import type { ChatMessage } from "@/lib/openrouter";
import type { Lang } from "@/lib/i18n";

const CJK_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uf900-\ufaff]/g;
const LATIN_RE = /[A-Za-z0-9_]/g;
const SYMBOL_RE = /[^\s\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uf900-\ufaffA-Za-z0-9_]/g;

const CONTEXT_SIZE_COPY = {
  zh: {
    unknownLimit: "上限未知",
    context: "项目概况",
    history: "聊天历史",
    input: "输入",
  },
  en: {
    unknownLimit: "Unknown limit",
    context: "Project context",
    history: "Chat history",
    input: "Input",
  },
} satisfies Record<Lang, Record<string, string>>;

export interface ContextSizeInput {
  context?: string;
  messages: ChatMessage[];
  input?: string;

}

export interface ContextTokenBreakdown {
  context: number;
  history: number;
  input: number;
  total: number;
}

export function buildContextSizeInput({ context, messages, input }: ContextSizeInput): string {
  const parts: string[] = [];
  if (context?.trim()) parts.push(context);

  for (const message of messages) {
    const content = typeof message.content === "string" ? message.content : "";
    const toolCalls = message.tool_calls?.length ? JSON.stringify(message.tool_calls) : "";
    const line = [`${message.role}:`, content, toolCalls].filter(Boolean).join(" ");
    if (line.trim()) parts.push(line);
  }

  if (input?.trim()) parts.push(`user: ${input}`);
  return parts.join("\n");
}

export function estimateContextTokens(text: string): number {
  const cjkCount = text.match(CJK_RE)?.length ?? 0;
  const latinCount = text.match(LATIN_RE)?.length ?? 0;
  const symbolCount = text.match(SYMBOL_RE)?.length ?? 0;
  return cjkCount + Math.ceil(latinCount / 4) + Math.ceil(symbolCount / 2);
}

function buildHistoryContext(messages: ChatMessage[]): string {
  return buildContextSizeInput({ messages });
}

export function estimateContextUsage({
  context,
  messages,
  input,
}: ContextSizeInput): ContextTokenBreakdown {
  const contextTokens = estimateContextTokens(context ?? "");
  const historyTokens = estimateContextTokens(buildHistoryContext(messages));
  const inputTokens = estimateContextTokens(input?.trim() ? `user: ${input}` : "");
  return {
    context: contextTokens,
    history: historyTokens,
    input: inputTokens,
    total: contextTokens + historyTokens + inputTokens,
  };
}

export function estimateMessagesTokens(messages: ChatMessage[]): number {
  return estimateContextTokens(buildContextSizeInput({ messages }));
}

export function estimateRequestContextUsage(
  input: ContextSizeInput & { fixedTokens?: number }
): ContextTokenBreakdown {
  const usage = estimateContextUsage(input);
  const fixedTokens = input.fixedTokens ?? 0;
  return { ...usage, total: usage.total + fixedTokens };
}

export function formatContextSize(tokens: number): string {
  if (tokens < 1000) return `${tokens} tokens`;
  const value = tokens / 1000;
  const formatted = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1);
  return `${formatted}k tokens`;
}

export function formatContextLimit(tokens: number | undefined): string {
  return formatContextLimitForLang(tokens);
}

export function formatContextLimitForLang(tokens: number | undefined, lang: Lang = "zh"): string {
  if (tokens) return formatContextSize(tokens);
  return CONTEXT_SIZE_COPY[lang].unknownLimit;
}

export function formatContextBreakdown(
  usage: Pick<ContextTokenBreakdown, "context" | "history" | "input">,
  lang: Lang = "zh"
): string {
  const labels = CONTEXT_SIZE_COPY[lang];
  return [
    `${labels.context} ${formatContextSize(usage.context)}`,
    `${labels.history} ${formatContextSize(usage.history)}`,
    `${labels.input} ${formatContextSize(usage.input)}`,
  ].join(" + ");
}
