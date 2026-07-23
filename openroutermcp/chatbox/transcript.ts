import type { ChatMessage } from "@/lib/openrouter";
import type { Lang } from "@/lib/i18n";

const TRANSCRIPT_COPY = {
  zh: {
    modelSwitch: (modelName: string) => `模型切换到 ${modelName}`,
    compression: (count: number, tokens: number) =>
      `已压缩 ${count} 条早期消息，摘要约 ${tokens} tokens`,
    goalBlocked: (blocker: string, nextAction: string) =>
      `我先停在这里：${blocker}。${nextAction ? `接下来需要${nextAction}。` : ""}这不是失败，完成后回复“继续”，我会接着处理。`,
    goalStalled: (nextAction: string) =>
      `我先暂停一下：这次还没有产生新的进展。${nextAction ? `下一步是${nextAction}。` : ""}你可以回复“继续”，我会换一种方式再试。`,
  },
  en: {
    modelSwitch: (modelName: string) => `Model switched to ${modelName}`,
    compression: (count: number, tokens: number) =>
      `Compressed ${count} earlier messages, summary about ${tokens} tokens`,
    goalBlocked: (blocker: string, nextAction: string) =>
      `I’ll pause here: ${blocker}. ${nextAction ? `Next: ${nextAction}. ` : ""}This is not a failure; reply “continue” when ready and I’ll pick it up.`,
    goalStalled: (nextAction: string) =>
      `I’ll pause for now: there has not been new progress. ${nextAction ? `Next: ${nextAction}. ` : ""}Reply “continue” and I’ll try another path.`,
  },
} satisfies Record<
  Lang,
  {
    modelSwitch: (modelName: string) => string;
    compression: (count: number, tokens: number) => string;
    goalBlocked: (blocker: string, nextAction: string) => string;
    goalStalled: (nextAction: string) => string;
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

export function createGoalStatusNotice(input: {
  status: "blocked" | "stalled";
  blocker?: string;
  nextAction?: string;
}, lang: Lang = "zh"): ChatNotice {
  const blocker = input.blocker?.trim() || (lang === "zh" ? "还缺少一个关键条件" : "one key dependency is still missing");
  const nextAction = input.nextAction?.trim() || "";
  return {
    kind: "notice",
    id: `goal-status-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    content:
      input.status === "blocked"
        ? TRANSCRIPT_COPY[lang].goalBlocked(blocker, nextAction)
        : TRANSCRIPT_COPY[lang].goalStalled(nextAction),
  };
}

export function isChatNotice(item: ChatTranscriptItem): item is ChatNotice {
  return "kind" in item && item.kind === "notice";
}

export function llmMessagesFromTranscript(items: ChatTranscriptItem[]): ChatMessage[] {
  return items.filter((item): item is ChatMessage => !isChatNotice(item));
}
