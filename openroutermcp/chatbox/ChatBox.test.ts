import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("chatbox exposes an opt-in automatic compression toggle and a manual fallback", async () => {
  const source = await readFile(new URL("./ChatBox.tsx", import.meta.url), "utf8");

  assert.match(source, /id="chatbox-auto-compress"/);
  assert.match(source, /checked=\{autoCompress\}/);
  assert.match(source, /onChange=\{\(event\) => setAutoCompress\(event\.target\.checked\)\}/);
  assert.match(source, /\{!autoCompress && \(/);
  assert.match(source, /llmMessagesFromTranscript\(transcript\)\.length === 0/);
  assert.match(source, /压缩上下文/);
});
