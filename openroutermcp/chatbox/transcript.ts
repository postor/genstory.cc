import type { ChatMessage } from "@/lib/openrouter";

export interface ChatNotice {
  kind: "notice";
  id: string;
  content: string;
}

export type ChatTranscriptItem = ChatMessage | ChatNotice;

export function createModelSwitchNotice(modelName: string): ChatNotice {
  return {
    kind: "notice",
    id: `model-switch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    content: `模型切换到 ${modelName}`,
  };
}

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

export function isChatNotice(item: ChatTranscriptItem): item is ChatNotice {
  return "kind" in item && item.kind === "notice";
}

export function llmMessagesFromTranscript(items: ChatTranscriptItem[]): ChatMessage[] {
  return items.filter((item): item is ChatMessage => !isChatNotice(item));
}
