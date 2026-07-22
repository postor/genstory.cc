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
  assert.match(source, /t\("chat\.compressContext"\)/);
  assert.match(source, /aria-label=\{t\("chat\.compressionOptionsLabel"\)\}/);
  assert.match(source, /<PopoverPopup[\s\S]*t\("chat\.autoCompress"\)[\s\S]*t\("chat\.compressContext"\)[\s\S]*<\/PopoverPopup>/);
  assert.doesNotMatch(source, /formatContextBreakdown/);

  const contextStatusIndex = source.indexOf('<span className="font-medium text-foreground">{t("chat.context")}</span>');
  const contextSettingsIndex = source.indexOf('aria-label={t("chat.compressionOptionsLabel")}');
  const sendButtonIndex = source.indexOf('{sending ? t("chat.sending") : t("chat.send")}');
  assert.ok(contextStatusIndex > -1);
  assert.ok(contextSettingsIndex > -1);
  assert.ok(sendButtonIndex > -1);
  assert.ok(contextStatusIndex < contextSettingsIndex);
  assert.ok(contextSettingsIndex < sendButtonIndex);
});

test("chatbox tracks model selections, sends, and tool calls", async () => {
  const source = await readFile(new URL("./ChatBox.tsx", import.meta.url), "utf8");

  assert.match(source, /trackChatSent\(\{/);
  assert.match(source, /messageLength: text\.length/);
  assert.match(source, /mcpToolCount: tools\.length/);
  assert.match(source, /projectToolCount: projectTools\.length/);
  assert.match(source, /trackToolCalled\(\{[\s\S]*toolName: tc\.function\.name[\s\S]*success: true/);
  assert.match(source, /trackToolCalled\(\{[\s\S]*toolName: tc\.function\.name[\s\S]*success: false/);
  assert.match(source, /trackModelSelected\(\{ model: id \}\)/);
});
