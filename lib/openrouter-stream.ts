export type OpenRouterStreamEvent =
  | { type: "text"; content: string }
  | {
      type: "tool_call";
      index: number;
      id?: string;
      name?: string;
      arguments?: string;
    }
  | { type: "done" };

function parseFrame(frame: string): OpenRouterStreamEvent[] {
  const data = frame
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n")
    .trim();

  if (!data) return [];
  if (data === "[DONE]") return [{ type: "done" }];

  const payload = JSON.parse(data) as {
    choices?: {
      delta?: {
        content?: string | null;
        tool_calls?: {
          index?: number;
          id?: string;
          type?: "function";
          function?: {
            name?: string;
            arguments?: string;
          };
        }[];
      };
    }[];
  };
  const delta = payload.choices?.[0]?.delta;
  if (!delta) return [];

  const events: OpenRouterStreamEvent[] = [];
  if (typeof delta.content === "string" && delta.content.length > 0) {
    events.push({ type: "text", content: delta.content });
  }
  for (const toolCall of delta.tool_calls ?? []) {
    if (typeof toolCall.index !== "number") continue;
    const event: Extract<OpenRouterStreamEvent, { type: "tool_call" }> = {
      type: "tool_call",
      index: toolCall.index,
    };
    if (toolCall.id !== undefined) event.id = toolCall.id;
    if (toolCall.function?.name !== undefined) event.name = toolCall.function.name;
    if (toolCall.function?.arguments !== undefined) {
      event.arguments = toolCall.function.arguments;
    }
    events.push(event);
  }
  return events;
}

export class OpenRouterStreamParser {
  private buffer = "";

  push(chunk: string): OpenRouterStreamEvent[] {
    this.buffer += chunk;
    const frames = this.buffer.split(/\r?\n\r?\n/);
    this.buffer = frames.pop() ?? "";
    return frames.flatMap(parseFrame);
  }

  finish(): OpenRouterStreamEvent[] {
    if (!this.buffer.trim()) return [];
    const frame = this.buffer;
    this.buffer = "";
    return parseFrame(frame);
  }
}
