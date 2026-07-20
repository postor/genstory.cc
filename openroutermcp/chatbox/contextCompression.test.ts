import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_COMPRESSION_BUDGET,
  buildCompressedLlmMessages,
  buildCompressionPrompt,
  fingerprintMessages,
  planContextCompression,
} from "./contextCompression.ts";

const msg = (role: "user" | "assistant" | "tool", content: string) => ({ role, content });

test("does not compress a request below the known model threshold", () => {
  const messages = [
    msg("user", "短问题"),
    msg("assistant", "短回答"),
  ];

  const plan = planContextCompression({
    messages,
    context: "项目概况",
    input: "继续",
    modelLimit: 128000,
    existingCoveredMessageCount: 0,
  });

  assert.equal(plan.shouldCompress, false);
  assert.deepEqual(plan.summarySourceMessages, []);
  assert.deepEqual(plan.recentMessages, messages);
});

test("compresses older messages when the request crosses the threshold", () => {
  const long = "设定".repeat(2000);
  const messages = Array.from({ length: 20 }, (_, index) =>
    index % 2 === 0
      ? msg("user", `${index}:${long}`)
      : msg("assistant", `${index}:${long}`)
  );

  const plan = planContextCompression({
    messages,
    context: "",
    input: "继续",
    modelLimit: 10000,
    existingCoveredMessageCount: 0,
  });

  assert.equal(plan.shouldCompress, true);
  assert.ok(plan.summarySourceMessages.length > 0);
  assert.ok(plan.recentMessages.length > 0);
  assert.equal(
    plan.summarySourceMessages.length + plan.recentMessages.length,
    messages.length
  );
  assert.equal(DEFAULT_COMPRESSION_BUDGET.triggerRatio, 0.7);
});

test("does not split a tool result from its assistant tool call", () => {
  const messages = [
    msg("user", "读文件"),
    {
      role: "assistant" as const,
      content: null,
      tool_calls: [
        {
          id: "call_1",
          type: "function" as const,
          function: { name: "read", arguments: "{\"path\":\"meta.md\"}" },
        },
      ],
    },
    {
      role: "tool" as const,
      tool_call_id: "call_1",
      name: "read",
      content: "meta content",
    },
    msg("assistant", "文件说明"),
    ...Array.from({ length: 18 }, (_, index) =>
      index % 2 === 0
        ? msg("user", `长问题${index}${"设定".repeat(1200)}`)
        : msg("assistant", `长回答${index}${"设定".repeat(1200)}`)
    ),
  ];

  const plan = planContextCompression({
    messages,
    modelLimit: 8000,
    existingCoveredMessageCount: 0,
  });

  assert.notEqual(plan.recentMessages[0]?.role, "tool");
});

test("injects a saved summary before the recent raw message window", () => {
  const result = buildCompressedLlmMessages({
    summary: "用户正在写视觉小说。红帽在森林。",
    recentMessages: [msg("user", "继续写下一幕")],
  });

  assert.deepEqual(result, [
    {
      role: "system",
      content:
        "以下是较早聊天历史的压缩摘要。它保留事实、决策、文件状态和未解决问题；如果它与最近消息冲突，以最近消息为准。\n\n用户正在写视觉小说。红帽在森林。",
    },
    { role: "user", content: "继续写下一幕" },
  ]);
});

test("builds an english compression prompt when requested", () => {
  const prompt = buildCompressionPrompt({
    lang: "en",
    messages: [msg("user", "Where is Red Riding Hood?")],
  });

  assert.match(prompt[0].content ?? "", /Compress the chat history/);
  assert.match(prompt[1].content ?? "", /New chat history to compress/);
});

test("compression prompt preserves canon and forbids invented story facts", () => {
  const prompt = buildCompressionPrompt({
    previousSummary: "此前摘要",
    messages: [
      msg("user", "红帽现在在哪？"),
      msg("assistant", "她在森林入口，尚未见到狼。"),
    ],
  });

  assert.match(prompt[0].content ?? "", /压缩聊天历史/);
  assert.match(prompt[0].content ?? "", /不要加入新的剧情/);
  assert.match(prompt[1].content ?? "", /此前摘要/);
  assert.match(prompt[1].content ?? "", /红帽现在在哪/);
});

test("fingerprint changes when source messages change", () => {
  assert.notEqual(
    fingerprintMessages([msg("user", "a")]),
    fingerprintMessages([msg("user", "b")])
  );
});
