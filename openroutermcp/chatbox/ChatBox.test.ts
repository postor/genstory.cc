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
  assert.match(source, /size="icon-sm"/);
  assert.match(source, /title=\{t\("chat\.compressionOptionsLabel"\)\}/);
  assert.match(source, /<SlidersHorizontal \/>/);
  assert.doesNotMatch(source, /<SlidersHorizontal[^>]*>[\s\S]*t\("chat\.compress"\)/);
  assert.match(source, /<PopoverPopup[\s\S]*t\("chat\.autoCompress"\)[\s\S]*t\("chat\.compressContext"\)[\s\S]*<\/PopoverPopup>/);
  assert.doesNotMatch(source, /formatContextBreakdown/);

  const contextStatusIndex = source.indexOf('formatContextSize(requestTokens).replace(/\\s+tokens$/, "")');
  const contextSettingsIndex = source.indexOf('aria-label={t("chat.compressionOptionsLabel")}');
  const sendButtonIndex = source.indexOf('{sending ? t("chat.sending") : t("chat.send")}');
  assert.doesNotMatch(source, /t\("chat\.context"\)/);
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

test("chatbox resolves model defaults per chat before global preferences and persists explicit choices to both scopes", async () => {
  const source = await readFile(new URL("./ChatBox.tsx", import.meta.url), "utf8");

  assert.match(source, /pickInitialModelId\(\s*models,\s*\{/);
  assert.match(source, /chatModelId: loadJSON<string>\(storageKey\(LS_MODEL, chatId\), ""\)/);
  assert.match(source, /globalModelId: loadJSON<string>\(LS_MODEL, ""\)/);
  assert.match(source, /window\.localStorage\.setItem\(LS_MODEL, id\)/);
  assert.match(source, /window\.localStorage\.setItem\(storageKey\(LS_MODEL, chatId\), id\)/);
});

test("chatbox enables the default goal contract and persists its state", async () => {
  const source = await readFile(new URL("./ChatBox.tsx", import.meta.url), "utf8");

  assert.match(source, /goalMode\?: "auto" \| "off"/);
  assert.match(source, /goalMode = "auto"/);
  assert.match(source, /isTaskLikeRequest\(text\)/);
  assert.match(source, /isGoalContinuationRequest\(text\)/);
  assert.match(source, /if \(!goalForTurn && goalModeActive\)/);
  assert.match(source, /parseGoalAssessment\(finalContent\)/);
  assert.match(source, /decideGoalContinuation\(\{/);
  assert.match(source, /MAX_GOAL_NO_PROGRESS = 2/);
  assert.match(source, /storageKey\(LS_GOAL, chatId\)/);
  assert.match(source, /resolvableDependencies/);
  assert.match(source, /userDependencies/);
});

test("chat settings place the goal mode toggle below auto compression and default it on", async () => {
  const source = await readFile(new URL("./ChatBox.tsx", import.meta.url), "utf8");

  assert.match(source, /const LS_GOAL_MODE = "chatbox_goal_mode"/);
  assert.match(source, /loadJSON<boolean>\(LS_GOAL_MODE, true\)/);
  assert.match(source, /id="chatbox-goal-mode"/);
  assert.match(source, /checked=\{goalEnabled\}/);
  assert.match(source, /onChange=\{\(event\) => \{/);
  assert.match(source, /setGoalEnabled\(enabled\)/);
  assert.match(source, /t\("chat\.goalMode"\)/);

  const autoCompressIndex = source.indexOf('id="chatbox-auto-compress"');
  const goalModeIndex = source.indexOf('id="chatbox-goal-mode"');
  const popoverEndIndex = source.indexOf("</PopoverPopup>");
  assert.ok(autoCompressIndex > -1);
  assert.ok(goalModeIndex > -1);
  assert.ok(popoverEndIndex > goalModeIndex);
  assert.ok(autoCompressIndex < goalModeIndex);
});

test("chatbox restores the latest user message with ArrowUp when the input is empty", async () => {
  const source = await readFile(new URL("./ChatBox.tsx", import.meta.url), "utf8");

  assert.match(source, /e\.key === "ArrowUp"/);
  assert.match(source, /!input\.trim\(\)/);
  assert.match(source, /findLastUserInput\(transcript\)/);
  assert.match(source, /setInput\(previousInput\)/);
});
