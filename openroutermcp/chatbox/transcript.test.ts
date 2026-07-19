import assert from "node:assert/strict";
import test from "node:test";

import { createModelSwitchNotice, llmMessagesFromTranscript } from "./transcript.ts";

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
