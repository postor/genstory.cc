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

test("chatbox persists large chat state through IndexedDB-backed chat storage", async () => {
  const source = await readFile(new URL("./ChatBox.tsx", import.meta.url), "utf8");

  assert.match(source, /loadStoredChatTranscript/);
  assert.match(source, /persistChatTranscript/);
  assert.match(source, /loadStoredChatImages/);
  assert.match(source, /persistChatImages/);
  assert.doesNotMatch(source, /window\.localStorage\.setItem\(\s*storageKey\(LS_MESSAGES, chatId\),\s*JSON\.stringify\(transcript\)\s*\)/);
  assert.doesNotMatch(source, /window\.localStorage\.setItem\(storageKey\(LS_IMAGES, chatId\), JSON\.stringify\(images\)\)/);
});

test("chatbox keeps going until five consecutive tool request failures", async () => {
  const source = await readFile(new URL("./ChatBox.tsx", import.meta.url), "utf8");

  assert.match(source, /const MAX_CONSECUTIVE_TOOL_REQUEST_FAILURES = 5/);
  assert.match(source, /let consecutiveToolRequestFailures = 0/);
  assert.match(source, /consecutiveToolRequestFailures \+= 1/);
  assert.match(source, /consecutiveToolRequestFailures >=\s+MAX_CONSECUTIVE_TOOL_REQUEST_FAILURES/);
  assert.match(source, /consecutiveToolRequestFailures = 0/);
});

test("chatbox wires OpenRouter's server-side web search tool into chat requests", async () => {
  const [chatboxSource, openrouterSource] = await Promise.all([
    readFile(new URL("./ChatBox.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../lib/openrouter.ts", import.meta.url), "utf8"),
  ]);

  assert.match(chatboxSource, /OPENROUTER_WEB_SEARCH_TOOL/);
  assert.match(chatboxSource, /\.\.\.runtimeTools\.map\(/);
  assert.match(openrouterSource, /type: "openrouter:web_search"/);
  assert.match(openrouterSource, /search_context_size: "medium"/);
  assert.doesNotMatch(openrouterSource, /Tavily|loadWebSearchApiKey|searchWeb/);
});

test("chatbox resolves model defaults per chat before global preferences and persists explicit choices to both scopes", async () => {
  const source = await readFile(new URL("./ChatBox.tsx", import.meta.url), "utf8");

  assert.match(source, /pickInitialModelId\(\s*models,\s*\{/);
  assert.match(source, /chatModelId: savedChatModel/);
  assert.match(source, /globalModelId: savedGlobalModel/);
  assert.match(source, /window\.localStorage\.setItem\(LS_MODEL, id\)/);
  assert.match(source, /window\.localStorage\.setItem\(chatStorageKey, id\)/);
});

test("chatbox restores the saved model after the model list finishes loading", async () => {
  const source = await readFile(new URL("./ChatBox.tsx", import.meta.url), "utf8");

  assert.match(source, /if \(modelLoading\) \{/);
  assert.match(source, /const savedChatModel = loadStoredModel\(chatStorageKey\)/);
  assert.match(source, /const savedGlobalModel = loadStoredModel\(LS_MODEL\)/);
  assert.match(source, /const savedModel = savedChatModel \|\| savedGlobalModel/);
  assert.match(source, /const restoredModel =[\s\S]*pickInitialModelId\(models,/);
  assert.match(source, /setModel\(restoredModel\)/);
  assert.match(source, /\[chatId, modelLoading, models\]/);
});

test("chatbox waits for a project chat id before restoring a scoped model", async () => {
  const source = await readFile(new URL("./ChatBox.tsx", import.meta.url), "utf8");

  assert.match(source, /restoredStorageKeyRef/);
  assert.match(source, /if \(!chatId && restoredStorageKeyRef\.current !== LS_MODEL\)/);
  assert.match(source, /restore skipped until chat id is available/);
  assert.match(source, /const chatStorageKey = storageKey\(LS_MODEL, chatId\)/);
});

test("chatbox reads model ids as raw localStorage strings", async () => {
  const source = await readFile(new URL("./ChatBox.tsx", import.meta.url), "utf8");

  assert.match(source, /function loadStoredModel\(key: string\): string/);
  assert.match(source, /window\.localStorage\.getItem\(key\) \?\? ""/);
  assert.match(source, /const savedChatModel = loadStoredModel\(chatStorageKey\)/);
  assert.match(source, /const savedGlobalModel = loadStoredModel\(LS_MODEL\)/);
});

test("chatbox logs model restoration diagnostics without logging chat content", async () => {
  const source = await readFile(new URL("./ChatBox.tsx", import.meta.url), "utf8");

  assert.match(source, /const MODEL_LOG_PREFIX = "\[ChatBox:model\]"/);
  assert.match(source, /model restore decision/);
  assert.match(source, /savedModelInLoadedList/);
  assert.match(source, /loadedModelIds/);
  assert.doesNotMatch(source, /logModelEvent\([^\n]*input/);
});

test("chatbox logs model storage write and readback diagnostics", async () => {
  const source = await readFile(new URL("./ChatBox.tsx", import.meta.url), "utf8");

  assert.match(source, /model selection persisted/);
  assert.match(source, /globalReadback/);
  assert.match(source, /chatReadback/);
  assert.match(source, /model selection persistence failed/);
  assert.match(source, /window\.location\.origin/);
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
  assert.match(source, /name: "set_goal"/);
  assert.match(source, /name: "clear_goal"/);
  assert.match(source, /applySetGoalToolInput\(/);
  assert.match(source, /createGoalStatusNotice\(/);
  assert.match(source, /<Trash2 \/>/);
  assert.match(source, /aria-label=\{t\("chat\.clearGoal"\)\}/);
  assert.match(source, /onClick=\{\(\) => updateGoal\(null\)\}/);
  assert.match(source, /resolvableDependencies/);
  assert.match(source, /userDependencies/);
  assert.match(source, /const \[goalDetailsOpen, setGoalDetailsOpen\] = useState\(false\)/);
  assert.match(source, /const \[goalObjectiveOpen, setGoalObjectiveOpen\] = useState\(false\)/);
  assert.match(source, /goal\.status === "blocked" \|\| goal\.status === "stalled"/);
  assert.match(source, /<Popover open=\{goalDetailsOpen\} onOpenChange=\{setGoalDetailsOpen\}>/);
  assert.match(source, /<Popover open=\{goalObjectiveOpen\} onOpenChange=\{setGoalObjectiveOpen\}>/);
  assert.match(source, /aria-label=\{t\("chat\.goalDetailsLabel"\)\}/);
  assert.match(source, /aria-label=\{t\("chat\.goalObjectiveDetailsLabel"\)\}/);
  assert.match(source, /onMouseEnter=\{\(\) => setGoalDetailsOpen\(true\)\}/);
  assert.match(source, /onMouseEnter=\{\(\) => setGoalObjectiveOpen\(true\)\}/);
  assert.match(source, /onFocus=\{\(\) => setGoalDetailsOpen\(true\)\}/);
  assert.match(source, /onFocus=\{\(\) => setGoalObjectiveOpen\(true\)\}/);
  assert.match(source, /t\("chat\.goalDetailsReason"\)/);
  assert.match(source, /t\("chat\.goalObjectiveDetailsTitle"\)/);
  assert.match(source, /interruptedGoal\.missingDependencies\.map/);
  assert.match(source, /interruptedGoal\.userDependencies\.map/);
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
  assert.match(source, /goal\.status === "active" && sending/);

  const autoCompressIndex = source.indexOf('id="chatbox-auto-compress"');
  const goalModeIndex = source.indexOf('id="chatbox-goal-mode"');
  const popoverEndIndex = source.indexOf("</PopoverPopup>", goalModeIndex);
  assert.ok(autoCompressIndex > -1);
  assert.ok(goalModeIndex > -1);
  assert.ok(popoverEndIndex > goalModeIndex);
  assert.ok(autoCompressIndex < goalModeIndex);
});

test("chat settings persist per-model provider controls and apply provider routing", async () => {
  const source = await readFile(new URL("./ChatBox.tsx", import.meta.url), "utf8");

  assert.match(source, /const LS_CHAT_PROVIDER = "chatbox_provider"/);
  assert.match(source, /id: "custom-openai"/);
  assert.match(source, /t\("chat\.providerCustomOpenAI"\)/);
  assert.match(source, /disabled=\{!apiSettingsReady\}/);
  assert.match(source, /const activeApiSettings = activeCustomApi \? apiSettings : null/);
  assert.match(source, /const LS_DISABLED_PROVIDERS = "chatbox_disabled_providers"/);
  assert.match(source, /loadJSON<Record<string, string\[\]>>\(LS_DISABLED_PROVIDERS, \{\}\)/);
  assert.match(source, /providerOnly: selectedProviderOnly/);
  assert.match(source, /getModelProviders/);
  assert.match(source, /provider loading started/);
  assert.match(source, /providerLoading/);
  assert.match(source, /providerOptions/);
  assert.match(source, /checked=\{checked\}/);
  assert.match(source, /provider\.slug/);
});

test("chatbox restores the latest user message with ArrowUp when the input is empty", async () => {
  const source = await readFile(new URL("./ChatBox.tsx", import.meta.url), "utf8");

  assert.match(source, /e\.key === "ArrowUp"/);
  assert.match(source, /!input\.trim\(\)/);
  assert.match(source, /findLastUserInput\(transcript\)/);
  assert.match(source, /setInput\(previousInput\)/);
});
