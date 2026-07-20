import type { Lang } from "@/lib/i18n";

const THINKING_DOT_STEPS = 3;

const THINKING_COPY = {
  zh: "思考中{dots}",
  en: "Thinking{dots}",
} satisfies Record<Lang, string>;

export function thinkingDotCount(frame: number): number {
  return (Math.abs(frame) % THINKING_DOT_STEPS) + 1;
}

export function formatThinkingLabel(frame: number, lang: Lang = "zh"): string {
  const template = THINKING_COPY[lang];
  return template.replace("{dots}", ".".repeat(thinkingDotCount(frame)));
}
