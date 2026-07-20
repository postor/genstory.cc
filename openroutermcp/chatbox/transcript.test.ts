import assert from "node:assert/strict";
import test from "node:test";

import {
  createContextCompressionNotice,
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
