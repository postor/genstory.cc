import type { ChatTranscriptItem } from "./transcript";

export function findLastUserInput(
  transcript: readonly ChatTranscriptItem[]
): string | null {
  for (let index = transcript.length - 1; index >= 0; index -= 1) {
    const item = transcript[index];
    if ("kind" in item || item.role !== "user" || typeof item.content !== "string") {
      continue;
    }
    if (item.content.trim()) return item.content;
  }
  return null;
}
