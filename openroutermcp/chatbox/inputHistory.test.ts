import assert from "node:assert/strict";
import test from "node:test";

import { createModelSwitchNotice } from "./transcript.ts";
import { findLastUserInput } from "./inputHistory.ts";

test("finds the latest non-empty user message and ignores notices", () => {
  const transcript = [
    { role: "user" as const, content: "第一条消息" },
    { role: "assistant" as const, content: "第一条回复" },
    createModelSwitchNotice("openai/gpt-4o-mini"),
    { role: "user" as const, content: "  第二条消息  " },
  ];

  assert.equal(findLastUserInput(transcript), "  第二条消息  ");
});

test("returns null when the transcript has no non-empty user message", () => {
  assert.equal(
    findLastUserInput([
      { role: "assistant" as const, content: "回复" },
      { role: "user" as const, content: "   " },
    ]),
    null
  );
});
