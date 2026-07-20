# 聊天上下文压缩 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 OpenRouter ChatBox 增加自动/手动上下文压缩，让长对话在保留用户可见完整聊天记录的同时，把发送给模型的历史控制在模型上下文预算内。

**Architecture:** 保持当前浏览器端闭环：用户可见 `transcript` 仍完整存在 localStorage；发送给 LLM 的 `history` 由新的压缩层生成，形态为“基础 system prompt + 历史摘要 system message + 最近原文窗口”。压缩摘要通过现有 OpenRouter `chat()` 在客户端生成，并以 `chatId` 维度持久化；纯函数负责 token 预算、turn 分组和 tool call 邻接保护。

**Tech Stack:** Next.js 16 App Router + static export、React 19、TypeScript、Tailwind CSS、shadcn/ui、OpenRouter streaming helper、localStorage、node:test。

---

## 1. 产品行为

1. 用户仍能在聊天窗口看到完整原始对话，不用担心历史被“吃掉”。
2. 用户可勾选“自动压缩上下文”。勾选后，发送消息前如果预计请求超过模型上下文上限的 70%，或模型上限未知且历史超过 24k 估算 tokens，自动压缩较早历史。
3. 未勾选时不自动发起摘要请求；界面显示“压缩上下文”按钮，用户点击后才执行压缩。
4. 最近窗口始终保留原文，默认至少保留最近 8 个完整 turn，且保留当前用户输入。
5. 压缩只覆盖完整 turn，不截断 assistant tool_calls 与紧随其后的 tool message。
6. 压缩摘要保留：用户目标、项目事实、角色/设定/时间线、已读文件、已修改/待修改文件、工具结果结论、未解决问题、用户明确偏好。
7. 如果摘要调用失败，本次发送继续使用“尽量裁剪后的最近原文窗口”，并展示错误；不能阻断普通聊天。
8. 清空聊天时同时清空压缩摘要；切换模型不清空摘要，但下次压缩使用新模型的上下文上限重新计算。

## 2. 文件结构

- Create: `openroutermcp/chatbox/contextCompression.ts`
  - 纯函数：turn 分组、压缩窗口选择、摘要 message 注入、预算计算、状态类型。
- Create: `openroutermcp/chatbox/contextCompression.test.ts`
  - 覆盖预算触发、最近窗口保留、tool call 邻接保护、摘要注入、清空状态。
- Modify: `openroutermcp/chatbox/transcript.ts`
  - 增加压缩 notice 工厂；继续确保 notice 不进入 LLM 历史。
- Modify: `openroutermcp/chatbox/transcript.test.ts`
  - 覆盖压缩 notice。
- Modify: `openroutermcp/chatbox/ChatBox.tsx`
  - 新增摘要状态、自动压缩 checkbox、条件显示的手动压缩按钮、localStorage key、发送流程、状态展示、清空逻辑。
- Modify: `openroutermcp/chatbox/contextSize.ts`
  - 增加用于多段 messages 的 token 统计帮助函数，避免 ChatBox 内重复手算。
- Modify: `openroutermcp/chatbox/contextSize.test.ts`
  - 覆盖摘要 + 最近历史的 token 统计。
- Modify: `openroutermcp/chatbox/index.ts`
  - 导出新增纯函数，方便后续复用或测试。

Before implementation, read the relevant local Next.js docs under `node_modules/next/dist/docs/` for Client Components and browser APIs, because this repository explicitly targets a Next.js version with breaking changes.

## 3. Data Model

```ts
export interface ChatCompressionState {
  summary: string;
  coveredMessageCount: number;
  sourceFingerprint: string;
  updatedAt: number;
}

export interface ChatCompressionPreference {
  automatic: boolean;
}

export interface CompressionBudget {
  modelLimit?: number;
  triggerRatio: number;
  targetRatio: number;
  unknownLimitTriggerTokens: number;
  minRecentTurns: number;
}

export interface CompressionPlan {
  shouldCompress: boolean;
  summarySourceMessages: ChatMessage[];
  recentMessages: ChatMessage[];
  coveredMessageCount: number;
  estimatedRequestTokens: number;
  targetTokens: number;
}
```

`coveredMessageCount` is counted against `llmMessagesFromTranscript(transcript)`, not against visible notices.

## 4. Task 1: Pure Compression Planner

**Files:**
- Create: `openroutermcp/chatbox/contextCompression.ts`
- Create: `openroutermcp/chatbox/contextCompression.test.ts`

- [ ] **Step 1: Write failing tests for trigger thresholds**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_COMPRESSION_BUDGET,
  planContextCompression,
} from "./contextCompression.ts";

const msg = (role: "user" | "assistant" | "tool", content: string) => ({ role, content });

test("does not compress when request is below known model threshold", () => {
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

test("compresses when request crosses known model trigger ratio", () => {
  const long = "设定".repeat(2000);
  const messages = Array.from({ length: 20 }, (_, index) =>
    index % 2 === 0 ? msg("user", `${index}:${long}`) : msg("assistant", `${index}:${long}`)
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
```

- [ ] **Step 2: Run tests and verify they fail**

Run: `node --experimental-strip-types --test openroutermcp/chatbox/contextCompression.test.ts`

Expected: FAIL with module/function not found.

- [ ] **Step 3: Implement planner types and threshold logic**

```ts
import type { ChatMessage } from "@/lib/openrouter";
import { estimateContextTokens, estimateContextUsage } from "./contextSize";

export interface ChatCompressionState {
  summary: string;
  coveredMessageCount: number;
  sourceFingerprint: string;
  updatedAt: number;
}

export interface CompressionBudget {
  modelLimit?: number;
  triggerRatio: number;
  targetRatio: number;
  unknownLimitTriggerTokens: number;
  minRecentTurns: number;
}

export interface CompressionPlanInput {
  messages: ChatMessage[];
  context?: string;
  input?: string;
  fixedTokens?: number;
  modelLimit?: number;
  existingCoveredMessageCount: number;
  force?: boolean;
  budget?: Partial<CompressionBudget>;
}

export interface CompressionPlan {
  shouldCompress: boolean;
  summarySourceMessages: ChatMessage[];
  recentMessages: ChatMessage[];
  coveredMessageCount: number;
  estimatedRequestTokens: number;
  targetTokens: number;
}

export const DEFAULT_COMPRESSION_BUDGET: CompressionBudget = {
  triggerRatio: 0.7,
  targetRatio: 0.45,
  unknownLimitTriggerTokens: 24000,
  minRecentTurns: 8,
};

function mergeBudget(modelLimit: number | undefined, overrides?: Partial<CompressionBudget>): CompressionBudget {
  return { ...DEFAULT_COMPRESSION_BUDGET, ...overrides, modelLimit };
}

function messageTokens(message: ChatMessage): number {
  const content = typeof message.content === "string" ? message.content : "";
  const toolCalls = message.tool_calls?.length ? JSON.stringify(message.tool_calls) : "";
  return estimateContextTokens([message.role, content, toolCalls].filter(Boolean).join(" "));
}

function splitAtRecentWindow(messages: ChatMessage[], minRecentTurns: number, targetRecentTokens: number): number {
  let turns = 0;
  let tokens = 0;
  let index = messages.length;

  while (index > 0) {
    index -= 1;
    const message = messages[index];
    tokens += messageTokens(message);
    if (message.role === "user") turns += 1;
    if (turns >= minRecentTurns && tokens >= targetRecentTokens) break;
  }

  return Math.max(0, index);
}

export function planContextCompression(input: CompressionPlanInput): CompressionPlan {
  const budget = mergeBudget(input.modelLimit, input.budget);
  const estimatedRequestTokens = estimateContextUsage({
    context: input.context,
    messages: input.messages,
    input: input.input,
  }).total + (input.fixedTokens ?? 0);
  const triggerTokens = budget.modelLimit
    ? Math.floor(budget.modelLimit * budget.triggerRatio)
    : budget.unknownLimitTriggerTokens;
  const targetTokens = budget.modelLimit
    ? Math.floor(budget.modelLimit * budget.targetRatio)
    : Math.floor(budget.unknownLimitTriggerTokens * budget.targetRatio);

  if (!input.force && estimatedRequestTokens < triggerTokens) {
    return {
      shouldCompress: false,
      summarySourceMessages: [],
      recentMessages: input.messages,
      coveredMessageCount: input.existingCoveredMessageCount,
      estimatedRequestTokens,
      targetTokens,
    };
  }

  const splitIndex = splitAtRecentWindow(
    input.messages,
    budget.minRecentTurns,
    Math.max(1000, Math.floor(targetTokens / 2))
  );
  const safeSplitIndex = Math.max(input.existingCoveredMessageCount, splitIndex);
  const summarySourceMessages = input.messages.slice(input.existingCoveredMessageCount, safeSplitIndex);

  return {
    shouldCompress: summarySourceMessages.length > 0,
    summarySourceMessages,
    recentMessages: input.messages.slice(safeSplitIndex),
    coveredMessageCount: safeSplitIndex,
    estimatedRequestTokens,
    targetTokens,
  };
}
```

- [ ] **Step 4: Run tests**

Run: `node --experimental-strip-types --test openroutermcp/chatbox/contextCompression.test.ts`

Expected: PASS for threshold tests, with later tool-boundary tests not yet present.

## 5. Task 2: Tool Call Boundary Protection

**Files:**
- Modify: `openroutermcp/chatbox/contextCompression.ts`
- Modify: `openroutermcp/chatbox/contextCompression.test.ts`

- [ ] **Step 1: Add failing tests for tool adjacency**

```ts
test("does not put a tool result in recent messages without its assistant tool call", () => {
  const messages = [
    msg("user", "读文件"),
    {
      role: "assistant" as const,
      content: null,
      tool_calls: [
        {
          id: "call_1",
          type: "function" as const,
          function: { name: "genstory_read_project_file", arguments: "{\"path\":\"meta.md\"}" },
        },
      ],
    },
    {
      role: "tool" as const,
      tool_call_id: "call_1",
      name: "genstory_read_project_file",
      content: "meta content",
    },
    msg("assistant", "文件说明"),
    ...Array.from({ length: 18 }, (_, index) =>
      index % 2 === 0 ? msg("user", `长问题${index}${"设定".repeat(1200)}`) : msg("assistant", `长回答${index}${"设定".repeat(1200)}`)
    ),
  ];

  const plan = planContextCompression({
    messages,
    modelLimit: 8000,
    existingCoveredMessageCount: 0,
  });

  const firstRecent = plan.recentMessages[0];
  assert.notEqual(firstRecent.role, "tool");
});
```

- [ ] **Step 2: Implement safe split adjustment**

Add this helper and use it before slicing:

```ts
function adjustSplitForToolBoundary(messages: ChatMessage[], splitIndex: number): number {
  let index = splitIndex;
  while (index < messages.length && messages[index]?.role === "tool") {
    index -= 1;
  }

  const previous = messages[index - 1];
  if (previous?.role === "assistant" && previous.tool_calls?.length) {
    const expectedToolIds = new Set(previous.tool_calls.map((call) => call.id));
    let cursor = index;
    while (cursor < messages.length && messages[cursor]?.role === "tool") {
      const toolCallId = messages[cursor].tool_call_id;
      if (toolCallId) expectedToolIds.delete(toolCallId);
      cursor += 1;
    }
    if (expectedToolIds.size > 0) return Math.max(0, index - 1);
  }

  return Math.max(0, index);
}
```

Change:

```ts
const splitIndex = splitAtRecentWindow(...);
```

to:

```ts
const splitIndex = adjustSplitForToolBoundary(
  input.messages,
  splitAtRecentWindow(input.messages, budget.minRecentTurns, Math.max(1000, Math.floor(targetTokens / 2)))
);
```

- [ ] **Step 3: Run tests**

Run: `node --experimental-strip-types --test openroutermcp/chatbox/contextCompression.test.ts`

Expected: PASS.

## 6. Task 3: Summary Message Builder

**Files:**
- Modify: `openroutermcp/chatbox/contextCompression.ts`
- Modify: `openroutermcp/chatbox/contextCompression.test.ts`

- [ ] **Step 1: Add failing tests for summary injection**

```ts
import { buildCompressedLlmMessages } from "./contextCompression.ts";

test("injects summary as a system message before recent messages", () => {
  const recent = [msg("user", "继续写下一幕")];
  const result = buildCompressedLlmMessages({
    summary: "用户正在写视觉小说。红帽在森林。",
    recentMessages: recent,
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
```

- [ ] **Step 2: Implement builder**

```ts
export function buildCompressedLlmMessages(input: {
  summary?: string;
  recentMessages: ChatMessage[];
}): ChatMessage[] {
  const summary = input.summary?.trim();
  if (!summary) return input.recentMessages;
  return [
    {
      role: "system",
      content:
        "以下是较早聊天历史的压缩摘要。它保留事实、决策、文件状态和未解决问题；如果它与最近消息冲突，以最近消息为准。\n\n" +
        summary,
    },
    ...input.recentMessages,
  ];
}
```

- [ ] **Step 3: Run tests**

Run: `node --experimental-strip-types --test openroutermcp/chatbox/contextCompression.test.ts`

Expected: PASS.

## 7. Task 4: Summary Prompt and Fingerprint

**Files:**
- Modify: `openroutermcp/chatbox/contextCompression.ts`
- Modify: `openroutermcp/chatbox/contextCompression.test.ts`

- [ ] **Step 1: Add failing tests for summarizer prompt**

```ts
import { buildCompressionPrompt, fingerprintMessages } from "./contextCompression.ts";

test("summary prompt preserves project-writing facts and excludes rendering instructions", () => {
  const prompt = buildCompressionPrompt({
    previousSummary: "此前摘要",
    messages: [
      msg("user", "红帽现在在哪？"),
      msg("assistant", "她在森林入口，尚未见到狼。"),
    ],
  });

  assert.match(prompt[0].content ?? "", /压缩聊天历史/);
  assert.match(prompt[0].content ?? "", /视觉小说/);
  assert.match(prompt[0].content ?? "", /不要加入新的剧情/);
  assert.match(prompt[1].content ?? "", /此前摘要/);
  assert.match(prompt[1].content ?? "", /红帽现在在哪/);
});

test("fingerprint changes when source messages change", () => {
  const left = fingerprintMessages([msg("user", "a")]);
  const right = fingerprintMessages([msg("user", "b")]);
  assert.notEqual(left, right);
});
```

- [ ] **Step 2: Implement prompt and fingerprint**

```ts
export function fingerprintMessages(messages: ChatMessage[]): string {
  let hash = 2166136261;
  const source = JSON.stringify(messages);
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function buildCompressionPrompt(input: {
  previousSummary?: string;
  messages: ChatMessage[];
}): ChatMessage[] {
  return [
    {
      role: "system",
      content:
        "请压缩聊天历史，输出中文摘要。目标是让后续模型在不读取原始早期消息的情况下继续工作。\n" +
        "必须保留：用户目标、视觉小说 canon、角色状态、时间线、项目文件事实、已做决策、工具结果、待办、未解决问题、用户偏好。\n" +
        "必须遵守：不要加入新的剧情、不要改写已确立事件、不要编造文件内容、不要写渲染指令。\n" +
        "格式使用简洁 Markdown，控制在 1200 字以内。",
    },
    {
      role: "user",
      content:
        (input.previousSummary?.trim()
          ? `此前摘要：\n${input.previousSummary.trim()}\n\n`
          : "") +
        "需要压缩的新增聊天历史：\n" +
        input.messages
          .map((message) => {
            const content = typeof message.content === "string" ? message.content : "";
            const toolCalls = message.tool_calls?.length ? `\n工具调用: ${JSON.stringify(message.tool_calls)}` : "";
            const toolName = message.name ? ` ${message.name}` : "";
            return `【${message.role}${toolName}】\n${content}${toolCalls}`;
          })
          .join("\n\n"),
    },
  ];
}
```

- [ ] **Step 3: Run tests**

Run: `node --experimental-strip-types --test openroutermcp/chatbox/contextCompression.test.ts`

Expected: PASS.

## 8. Task 5: Context Size Helpers

**Files:**
- Modify: `openroutermcp/chatbox/contextSize.ts`
- Modify: `openroutermcp/chatbox/contextSize.test.ts`

- [ ] **Step 1: Add failing test**

```ts
import { estimateMessagesTokens } from "./contextSize.ts";
import { estimateRequestContextUsage } from "./contextSize.ts";

test("estimates message arrays including tool calls", () => {
  const tokens = estimateMessagesTokens([
    {
      role: "assistant",
      content: null,
      tool_calls: [
        {
          id: "call_1",
          type: "function",
          function: { name: "read", arguments: "{\"path\":\"meta.md\"}" },
        },
      ],
    },
  ]);

  assert.ok(tokens > 0);
});

test("adds fixed system and tool-definition tokens to request estimate", () => {
  const usage = estimateRequestContextUsage({
    context: "",
    messages: [{ role: "user", content: "继续" }],
    input: "",
    fixedTokens: 120,
  });

  assert.equal(usage.total, estimateContextUsage({
    context: "",
    messages: [{ role: "user", content: "继续" }],
    input: "",
  }).total + 120);
});
```

- [ ] **Step 2: Implement helper**

```ts
export function estimateMessagesTokens(messages: ChatMessage[]): number {
  return estimateContextTokens(buildContextSizeInput({ messages }));
}

export function estimateRequestContextUsage(input: ContextSizeInput & { fixedTokens?: number }): ContextTokenBreakdown {
  const usage = estimateContextUsage(input);
  const fixedTokens = input.fixedTokens ?? 0;
  return { ...usage, total: usage.total + fixedTokens };
}
```

- [ ] **Step 3: Run test**

Run: `node --experimental-strip-types --test openroutermcp/chatbox/contextSize.test.ts`

Expected: PASS.

## 9. Task 6: Transcript Notice

**Files:**
- Modify: `openroutermcp/chatbox/transcript.ts`
- Modify: `openroutermcp/chatbox/transcript.test.ts`

- [ ] **Step 1: Add failing test**

```ts
import { createContextCompressionNotice } from "./transcript.ts";

test("context compression notices render but are not sent to the LLM", () => {
  const notice = createContextCompressionNotice({ coveredMessageCount: 12, summaryTokens: 300 });
  const transcript = [
    { role: "user" as const, content: "第一条消息" },
    notice,
  ];

  assert.match(notice.content, /已压缩 12 条早期消息/);
  assert.deepEqual(llmMessagesFromTranscript(transcript), [
    { role: "user", content: "第一条消息" },
  ]);
});
```

- [ ] **Step 2: Implement notice factory**

```ts
export function createContextCompressionNotice(input: {
  coveredMessageCount: number;
  summaryTokens: number;
}): ChatNotice {
  return {
    kind: "notice",
    id: `context-compression-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    content: `已压缩 ${input.coveredMessageCount} 条早期消息，摘要约 ${input.summaryTokens} tokens`,
  };
}
```

- [ ] **Step 3: Run test**

Run: `node --experimental-strip-types --test openroutermcp/chatbox/transcript.test.ts`

Expected: PASS.

## 10. Task 7: ChatBox Integration

**Files:**
- Modify: `openroutermcp/chatbox/ChatBox.tsx`

- [ ] **Step 1: Add imports and localStorage key**

```ts
import {
  buildCompressedLlmMessages,
  buildCompressionPrompt,
  fingerprintMessages,
  planContextCompression,
  type ChatCompressionState,
} from "./contextCompression";
import { createContextCompressionNotice } from "./transcript";
```

Add:

```ts
const LS_COMPRESSION = "chatbox_context_compression";
const LS_AUTO_COMPRESS = "chatbox_auto_compress";
```

- [ ] **Step 2: Add state**

```ts
const [compression, setCompression] = useState<ChatCompressionState | null>(null);
const [compressing, setCompressing] = useState(false);
const [autoCompress, setAutoCompress] = useState(false);
```

- [ ] **Step 3: Load and persist compression by chatId**

In the `chatId` loading effect:

```ts
setCompression(loadJSON<ChatCompressionState | null>(storageKey(LS_COMPRESSION, chatId), null));
```

Load the global preference once and persist it:

```ts
useEffect(() => {
  setAutoCompress(loadJSON<boolean>(LS_AUTO_COMPRESS, false));
  setCompressionStorageReady(true);
}, []);

useEffect(() => {
  if (!compressionStorageReady) return;
  window.localStorage.setItem(LS_AUTO_COMPRESS, JSON.stringify(autoCompress));
}, [autoCompress, compressionStorageReady]);
```

Add persistence effect:

```ts
useEffect(() => {
  if (!chatStorageReady) return;
  const key = storageKey(LS_COMPRESSION, chatId);
  if (compression) {
    window.localStorage.setItem(key, JSON.stringify(compression));
  } else {
    window.localStorage.removeItem(key);
  }
}, [compression, chatId, chatStorageReady]);
```

- [ ] **Step 4: Clear compression with chat**

Inside `clearChat`:

```ts
setCompression(null);
```

- [ ] **Step 5: Add compression runner inside component**

```ts
const compressHistoryIfNeeded = useCallback(
  async (
    tk: string,
    nextTranscript: ChatTranscriptItem[],
    fixedTokens = 0,
    force = false
  ) => {
    const llmMessages = llmMessagesFromTranscript(nextTranscript);
    const currentCompression =
      compression &&
      fingerprintMessages(llmMessages.slice(0, compression.coveredMessageCount)) === compression.sourceFingerprint
        ? compression
        : null;
    const plan = planContextCompression({
      messages: llmMessages,
      context,
      input: "",
      fixedTokens,
      modelLimit: selectedModel?.contextLength,
      existingCoveredMessageCount: currentCompression?.coveredMessageCount ?? 0,
      force,
    });

    if (!force && !plan.shouldCompress) {
      return {
        messages: buildCompressedLlmMessages({
          summary: currentCompression?.summary,
          recentMessages: llmMessages.slice(currentCompression?.coveredMessageCount ?? 0),
        }),
        compression: currentCompression,
        compressionApplied: false,
      };
    }

    if (plan.summarySourceMessages.length === 0) {
      return {
        messages: buildCompressedLlmMessages({
          summary: currentCompression?.summary,
          recentMessages: plan.recentMessages,
        }),
        compression: currentCompression,
        compressionApplied: false,
      };
    }

    setCompressing(true);
    try {
      const prompt = buildCompressionPrompt({
        previousSummary: currentCompression?.summary,
        messages: plan.summarySourceMessages,
      });
      const result = await chat(tk, model, prompt);
      const summary = result.content?.trim();
      if (!summary) throw new Error("上下文压缩未返回摘要");
      const nextCompression: ChatCompressionState = {
        summary,
        coveredMessageCount: plan.coveredMessageCount,
        sourceFingerprint: fingerprintMessages(llmMessages.slice(0, plan.coveredMessageCount)),
        updatedAt: Date.now(),
      };
      setCompression(nextCompression);
      return {
        messages: buildCompressedLlmMessages({
          summary,
          recentMessages: plan.recentMessages,
        }),
        compression: nextCompression,
        compressionApplied: true,
      };
    } finally {
      setCompressing(false);
    }
  },
  [compression, context, model, selectedModel?.contextLength]
);
```

- [ ] **Step 6: Use compressed history in sendChat**

Persist the visible transcript rather than the derived LLM messages, so a saved summary system message never reappears as a visible chat bubble:

```ts
const storedTranscript = loadJSON<ChatTranscriptItem[]>(
  storageKey(LS_MESSAGES, chatId),
  []
);
setMessages(llmMessagesFromTranscript(storedTranscript));
setTranscript(storedTranscript);
```

Replace:

```ts
const history: ChatMessage[] = llmMessagesFromTranscript(displayTranscript);
setMessages(history);
```

with:

```ts
let history: ChatMessage[] = llmMessagesFromTranscript(displayTranscript);
setMessages(history);
```

After token/tool validation and before the agent loop:

```ts
if (autoCompress) {
  const compressed = await compressHistoryIfNeeded(
    tk,
    displayTranscript,
    estimateContextTokens(systemMsg.content ?? "") +
      estimateContextTokens(JSON.stringify(mcpTools))
  );
  history = compressed.messages;
  if (compressed.error) {
    setError(`上下文压缩失败，已改用最近历史：${compressed.error.message}`);
  }
  if (compressed.compressionApplied && compressed.compression) {
    displayTranscript = [
      ...displayTranscript,
      createContextCompressionNotice({
        coveredMessageCount: compressed.compression.coveredMessageCount,
        summaryTokens: estimateContextTokens(compressed.compression.summary),
      }),
    ];
    setTranscript(displayTranscript);
  }
  setMessages(history);
}
```

Keep `displayTranscript` as the full visible transcript.

- [ ] **Step 7: Add manual compression control**

In the button row next to clear chat:

```tsx
{!autoCompress && (
  <Button
    variant="outline"
    size="sm"
    onClick={() => void handleManualCompression()}
    disabled={!authorized || compressing || sending || llmMessagesFromTranscript(transcript).length < 6}
  >
    {compressing ? "压缩中..." : "压缩上下文"}
  </Button>
)}
```

Render the checkbox beside it:

```tsx
<div className="flex items-center gap-2">
  <input
    id="chatbox-auto-compress"
    type="checkbox"
    checked={autoCompress}
    onChange={(event) => setAutoCompress(event.target.checked)}
    disabled={!authorized || sending || compressing}
  />
  <Label htmlFor="chatbox-auto-compress">自动压缩上下文</Label>
</div>
```

Define the handler used by the manual button:

```ts
async function handleManualCompression() {
  const tk = await refreshToken();
  if (!tk) {
    setError("未找到可用令牌，请先完成 OAuth 授权。");
    setOauthOpen(true);
    return;
  }
  const result = await compressHistoryIfNeeded(tk, transcript, 0, true);
  if (result.error) {
    setError(`上下文压缩失败：${result.error.message}`);
    return;
  }
  setMessages(result.messages);
  if (result.compressionApplied && result.compression) {
    setTranscript((previous) => [
      ...previous,
      createContextCompressionNotice({
        coveredMessageCount: result.compression.coveredMessageCount,
        summaryTokens: estimateContextTokens(result.compression.summary),
      }),
    ]);
  }
}
```

- [ ] **Step 8: Add compact status**

In the context usage text:

```tsx
{compression ? (
  <span className="block truncate">
    已压缩 {compression.coveredMessageCount} 条早期消息，摘要 {formatContextSize(estimateContextTokens(compression.summary))}
  </span>
) : null}
```

- [ ] **Step 9: Run lint**

Run: `npm run lint -- openroutermcp/chatbox/ChatBox.tsx`

Expected: PASS.

## 11. Task 8: Export and Regression Tests

**Files:**
- Modify: `openroutermcp/chatbox/index.ts`

- [ ] **Step 1: Export helpers**

```ts
export {
  buildCompressedLlmMessages,
  buildCompressionPrompt,
  fingerprintMessages,
  planContextCompression,
  type ChatCompressionState,
} from "./contextCompression";
```

- [ ] **Step 2: Run chatbox tests**

Run:

```bash
node --experimental-strip-types --test openroutermcp/chatbox/contextSize.test.ts openroutermcp/chatbox/transcript.test.ts openroutermcp/chatbox/contextCompression.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run related OpenRouter tests**

Run:

```bash
node --experimental-strip-types --test lib/openrouter.test.ts lib/openrouter-stream.test.ts
```

Expected: PASS.

- [ ] **Step 4: Run full lint**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 5: Run build**

Run: `npm run build`

Expected: Either PASS, or the already-known external `next/font`/Turbopack font resolution issue from `memory/2026-07-19-chatbox-streaming.md`. If it fails for that known reason, record it in the implementation summary and verify no new chatbox errors appear before the font failure.

## 12. Acceptance Checklist

- [ ] Long chat sends use a summary plus recent messages instead of full raw history.
- [ ] Automatic compression is opt-in; it defaults to unchecked and persists globally.
- [ ] When automatic compression is unchecked, only the manual “压缩上下文” button is available.
- [ ] Visible chat history remains complete.
- [ ] Manual compression works without sending a user message.
- [ ] Auto compression triggers before an oversized send.
- [ ] Tool call messages are never split from their tool results.
- [ ] Summary is persisted per `chatId` and cleared by “清空聊天”.
- [ ] Context usage display shows compression status.
- [ ] Tests cover pure planner behavior and transcript filtering.
- [ ] Lint passes.
- [ ] Build result is documented, including any pre-existing font blocker.

## 13. Risks and Guardrails

1. **Summary drift:** Keep latest turns raw and phrase summary as lower priority than recent messages.
2. **Tool protocol breakage:** Split only on safe message boundaries; tests must cover assistant `tool_calls` followed by `tool`.
3. **Extra cost/latency:** Only auto-compress near threshold; manual button lets users choose earlier.
4. **localStorage size:** Summary is small; original transcript already persists. If future transcripts grow too large, move chat storage to IndexedDB.
5. **No backend:** All summarization uses the user’s existing OpenRouter token in the browser; no API routes are introduced.
