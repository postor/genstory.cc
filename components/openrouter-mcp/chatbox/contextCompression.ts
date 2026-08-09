import type { ChatMessage } from "@/lib/openrouter";
import type { Lang } from "@/lib/i18n";
import { estimateContextTokens, estimateContextUsage } from "./contextSize.ts";

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

const COMPRESSION_COPY = {
  zh: {
    savedSummaryIntro:
      "以下是较早聊天历史的压缩摘要。它保留事实、决策、文件状态和未解决问题；如果它与最近消息冲突，以最近消息为准。",
    promptSystem:
      "请压缩聊天历史，输出中文摘要。目标是让后续模型在不读取原始早期消息的情况下继续工作。\n" +
      "必须保留：用户目标、视觉小说 canon、角色状态、时间线、项目文件事实、已做决策、工具结果、待办、未解决问题、用户偏好。\n" +
      "必须遵守：不要加入新的剧情、不要改写已确立事件、不要编造文件内容、不要写渲染指令。\n" +
      "格式使用简洁 Markdown，控制在 1200 字以内。",
    previousSummary: "此前摘要：",
    newHistory: "需要压缩的新增聊天历史：",
    toolCalls: "工具调用",
  },
  en: {
    savedSummaryIntro:
      "The following is a compressed summary of earlier chat history. It preserves facts, decisions, file state, and unresolved questions. If it conflicts with recent messages, recent messages take priority.",
    promptSystem:
      "Compress the chat history into an English summary so the next model can continue without reading the original earlier messages.\n" +
      "Must preserve: user goals, visual novel canon, character state, timeline, project file facts, decisions made, tool results, todos, unresolved questions, and user preferences.\n" +
      "Must obey: do not add new story facts, do not rewrite established events, do not invent file contents, and do not write rendering instructions.\n" +
      "Use concise Markdown and keep it under 1200 words.",
    previousSummary: "Previous summary:",
    newHistory: "New chat history to compress:",
    toolCalls: "Tool calls",
  },
} satisfies Record<
  Lang,
  {
    savedSummaryIntro: string;
    promptSystem: string;
    previousSummary: string;
    newHistory: string;
    toolCalls: string;
  }
>;

function mergeBudget(
  modelLimit: number | undefined,
  overrides?: Partial<CompressionBudget>
): CompressionBudget {
  return { ...DEFAULT_COMPRESSION_BUDGET, ...overrides, modelLimit };
}

function messageTokens(message: ChatMessage): number {
  const content = typeof message.content === "string" ? message.content : "";
  const toolCalls = message.tool_calls?.length
    ? JSON.stringify(message.tool_calls)
    : "";
  return estimateContextTokens(
    [`${message.role}:`, content, toolCalls].filter(Boolean).join(" ")
  );
}

function splitAtRecentWindow(
  messages: ChatMessage[],
  minRecentTurns: number,
  targetRecentTokens: number
): number {
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

function adjustSplitForToolBoundary(
  messages: ChatMessage[],
  splitIndex: number
): number {
  let index = Math.min(Math.max(splitIndex, 0), messages.length);
  while (index > 0 && messages[index]?.role === "tool") {
    index -= 1;
  }
  return index;
}

export function planContextCompression(
  input: CompressionPlanInput
): CompressionPlan {
  const budget = mergeBudget(input.modelLimit, input.budget);
  const existingCoveredMessageCount = Math.min(
    Math.max(input.existingCoveredMessageCount, 0),
    input.messages.length
  );
  const estimatedRequestTokens =
    estimateContextUsage({
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
      recentMessages: input.messages.slice(existingCoveredMessageCount),
      coveredMessageCount: existingCoveredMessageCount,
      estimatedRequestTokens,
      targetTokens,
    };
  }

  const splitIndex = adjustSplitForToolBoundary(
    input.messages,
    splitAtRecentWindow(
      input.messages,
      budget.minRecentTurns,
      Math.max(1000, Math.floor(targetTokens / 2))
    )
  );
  const safeSplitIndex = Math.max(existingCoveredMessageCount, splitIndex);
  const summarySourceMessages = input.messages.slice(
    existingCoveredMessageCount,
    safeSplitIndex
  );

  return {
    shouldCompress: summarySourceMessages.length > 0,
    summarySourceMessages,
    recentMessages: input.messages.slice(safeSplitIndex),
    coveredMessageCount: safeSplitIndex,
    estimatedRequestTokens,
    targetTokens,
  };
}

export function buildCompressedLlmMessages(input: {
  summary?: string;
  recentMessages: ChatMessage[];
  lang?: Lang;
}): ChatMessage[] {
  const summary = input.summary?.trim();
  if (!summary) return input.recentMessages;
  const copy = COMPRESSION_COPY[input.lang ?? "zh"];

  return [
    {
      role: "system",
      content: `${copy.savedSummaryIntro}\n\n${summary}`,
    },
    ...input.recentMessages,
  ];
}

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
  lang?: Lang;
}): ChatMessage[] {
  const copy = COMPRESSION_COPY[input.lang ?? "zh"];
  return [
    {
      role: "system",
      content: copy.promptSystem,
    },
    {
      role: "user",
      content:
        (input.previousSummary?.trim()
          ? `${copy.previousSummary}\n${input.previousSummary.trim()}\n\n`
          : "") +
        `${copy.newHistory}\n` +
        input.messages
          .map((message) => {
            const content =
              typeof message.content === "string" ? message.content : "";
            const toolCalls = message.tool_calls?.length
              ? `\n${copy.toolCalls}: ${JSON.stringify(message.tool_calls)}`
              : "";
            const toolName = message.name ? ` ${message.name}` : "";
            return `【${message.role}${toolName}】\n${content}${toolCalls}`;
          })
          .join("\n\n"),
    },
  ];
}
