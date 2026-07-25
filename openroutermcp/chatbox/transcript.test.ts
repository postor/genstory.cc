import assert from "node:assert/strict";
import test from "node:test";

import {
  compactTranscriptForStorage,
  createContextCompressionNotice,
  createGoalStatusNotice,
  createModelSwitchNotice,
  llmMessagesFromTranscript,
} from "./transcript.ts";

test("model switch notices render in the transcript but are not sent to the LLM", () => {
  const notice = createModelSwitchNotice("openai/gpt-4o-mini");
  const transcript = [
    { role: "user" as const, content: "第一条消息" },
    notice,
    { role: "assistant" as const, content: "第一条回复" },
  ];

  assert.equal(notice.kind, "notice");
  assert.equal(notice.content, "模型切换到 openai/gpt-4o-mini");
  assert.deepEqual(llmMessagesFromTranscript(transcript), [
    { role: "user", content: "第一条消息" },
    { role: "assistant", content: "第一条回复" },
  ]);

});

test("context compression notices render but are not sent to the LLM", () => {
  const notice = createContextCompressionNotice({
    coveredMessageCount: 12,
    summaryTokens: 300,
  });
  const transcript = [
    { role: "user" as const, content: "第一条消息" },
    notice,
  ];

  assert.match(notice.content, /已压缩 12 条早期消息/);
  assert.deepEqual(llmMessagesFromTranscript(transcript), [
    { role: "user", content: "第一条消息" },
  ]);
});

test("goal issue notices explain the problem and the next user action", () => {
  const blocked = createGoalStatusNotice({
    status: "blocked",
    blocker: "还缺少发布平台授权",
    nextAction: "完成授权后继续",
  });
  assert.match(blocked.content, /先停在这里/);
  assert.match(blocked.content, /发布平台授权/);
  assert.match(blocked.content, /回复“继续”/);
  assert.equal(llmMessagesFromTranscript([blocked]).length, 0);

  const stalled = createGoalStatusNotice({
    status: "stalled",
    blocker: "自动继续轮次已用尽",
  });
  assert.match(stalled.content, /暂停一下/);
  assert.match(stalled.content, /回复“继续”/);
});

test("storage compaction truncates large tool results without changing live messages", () => {
  const largeToolContent = "x".repeat(200);
  const transcript = [
    { role: "user" as const, content: "读取多个文件" },
    {
      role: "tool" as const,
      tool_call_id: "call_1",
      name: "genstory_read_project_file",
      content: largeToolContent,
    },
  ];

  const compacted = compactTranscriptForStorage(transcript, 40);
  const compactedToolContent = compacted[1].content;

  assert.equal(transcript[1].content, largeToolContent);
  assert.equal(compacted[0], transcript[0]);
  assert.equal(typeof compactedToolContent, "string");
  if (typeof compactedToolContent !== "string") throw new Error("Expected compacted tool content");
  assert.match(compactedToolContent, /\[truncated for local storage/);
  assert.ok(compactedToolContent.length < largeToolContent.length);
});
