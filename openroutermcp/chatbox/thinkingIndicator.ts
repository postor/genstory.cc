const THINKING_DOT_STEPS = 3;

export function thinkingDotCount(frame: number): number {
  return (Math.abs(frame) % THINKING_DOT_STEPS) + 1;
}

export function formatThinkingLabel(frame: number): string {
  return `思考中${".".repeat(thinkingDotCount(frame))}`;
}
