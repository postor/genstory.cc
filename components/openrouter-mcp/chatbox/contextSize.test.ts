import assert from "node:assert/strict";
import test from "node:test";

import {
  buildContextSizeInput,
  estimateContextTokens,
  estimateContextUsage,
  formatContextBreakdown,
  formatContextLimit,
  formatContextSize,
} from "./contextSize.ts";

test("estimates context size from system context, chat history, and current input", () => {
  const messages = [
    { role: "user" as const, content: "你好" },
    { role: "assistant" as const, content: "你好，我可以帮你写故事。" },
  ];

  const input = buildContextSizeInput({
    context: "# Project\nchapter draft",
    messages,
    input: "继续写下一幕",
  });

  assert.match(input, /# Project/);
  assert.match(input, /你好，我可以帮你写故事。/);
  assert.match(input, /继续写下一幕/);
  assert.equal(estimateContextTokens(input), 30);
});

test("breaks context usage into project, history, and current input", () => {
  const usage = estimateContextUsage({
    context: "项目设定",
    messages: [{ role: "user" as const, content: "hello world" }],
    input: "继续",
  });

  assert.equal(usage.context, 4);
  assert.equal(usage.history, 5);
  assert.equal(usage.input, 4);
  assert.equal(usage.total, 13);
});

test("formats context size for compact live display", () => {
  assert.equal(formatContextSize(999), "999 tokens");
  assert.equal(formatContextSize(1200), "1.2k tokens");
  assert.equal(formatContextLimit(128000), "128k tokens");
  assert.equal(formatContextLimit(undefined), "上限未知");
});

test("formats every context component that contributes to the request total", () => {
  assert.equal(
    formatContextBreakdown({ context: 4, history: 5, input: 4 }),
    "项目概况 4 tokens + 聊天历史 5 tokens + 输入 4 tokens"
  );
});
