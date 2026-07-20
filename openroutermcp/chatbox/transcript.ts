import type { ChatMessage } from "@/lib/openrouter";
import type { Lang } from "@/lib/i18n";

const TRANSCRIPT_COPY = {
  zh: {
    modelSwitch: (modelName: string) => `模型切换到 ${modelName}`,
    compression: (count: number, tokens: number) =>
      `已压缩 ${count} 条早期消息，摘要约 ${tokens} tokens`,
  },
  en: {
    modelSwitch: (modelName: string) => `Model switched to ${modelName}`,
    compression: (count: number, tokens: number) =>
      `Compressed ${count} earlier messages, summary about ${tokens} tokens`,
  },
} satisfies Record<
  Lang,
  {
    modelSwitch: (modelName: string) => string;
    compression: (count: number, tokens: number) => string;
  }
>;

export interface ChatNotice {
  kind: "notice";
  id: string;
  content: string;
}

export type ChatTranscriptItem = ChatMessage | ChatNotice;

export function createModelSwitchNotice(modelName: string, lang: Lang = "zh"): ChatNotice {
  return {
    kind: "notice",
    id: `model-switch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    content: TRANSCRIPT_COPY[lang].modelSwitch(modelName),
  };
}

export function createContextCompressionNotice(input: {
  coveredMessageCount: number;
  summaryTokens: number;
}, lang: Lang = "zh"): ChatNotice {
  return {
    kind: "notice",
    id: `context-compression-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    content: TRANSCRIPT_COPY[lang].compression(input.coveredMessageCount, input.summaryTokens),
  };
}

export function isChatNotice(item: ChatTranscriptItem): item is ChatNotice {
  return "kind" in item && item.kind === "notice";
}

export function llmMessagesFromTranscript(items: ChatTranscriptItem[]): ChatMessage[] {
  return items.filter((item): item is ChatMessage => !isChatNotice(item));
}
