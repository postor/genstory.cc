// Client-side OpenRouter OpenAI-compatible API helpers.
//
// This module is intentionally server-less: the project is a static export with
// no backend, and the OpenRouter token lives in the browser's localStorage (see
// lib/mcp-client.ts). The token is passed in at call time from the page and is
// NEVER embedded in this source file or logged anywhere, so it never leaks into
// the frontend bundle or server responses.
//
// Usage: pass the live bearer token (from loadTokens()/getToken()) into chat().

import { OpenRouterStreamParser } from "./openrouter-stream";

const OR_BASE = "https://openrouter.ai/api/v1";

// Curated fallback models, used when the live /models endpoint is unreachable
// (offline, CORS, or rate-limited). Keeps the model picker usable in all cases.
const FALLBACK_MODELS: ModelInfo[] = [
  { id: "openai/gpt-4o-mini", name: "OpenAI: GPT-4o mini", contextLength: 128000 },
  { id: "openai/gpt-4o", name: "OpenAI: GPT-4o", contextLength: 128000 },
  { id: "anthropic/claude-3.5-sonnet", name: "Anthropic: Claude 3.5 Sonnet", contextLength: 200000 },
  { id: "google/gemini-flash-1.5", name: "Google: Gemini Flash 1.5", contextLength: 1000000 },
  { id: "meta-llama/llama-3.1-8b-instruct", name: "Meta: Llama 3.1 8B", contextLength: 131000 },
];

export interface ModelInfo {
  id: string;
  name: string;
  contextLength?: number;
}

export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface ChatMessage {
  role: ChatRole;
  content: string | null;
  // Present on assistant messages that request one or more tool calls.
  tool_calls?: ChatToolCall[];
  // Present on tool role messages echoing the originating call id.
  tool_call_id?: string;
  // Tool name, carried on `role: "tool"` messages for display only.
  name?: string;
}

// OpenAI-compatible tool definition, derived from MCP tools.
export interface ChatTool {
  type: "function";
  function: { name: string; description?: string; parameters?: unknown };
}

// Fetches the available model list from OpenRouter. Falls back to a curated
// list on any failure so the picker always works.
export async function listModels(): Promise<ModelInfo[]> {
  try {
    const res = await fetch(`${OR_BASE}/models`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return FALLBACK_MODELS;
    const json = (await res.json()) as {
      data?: {
        id?: string;
        name?: string;
        context_length?: number;
        top_provider?: { context_length?: number };
      }[];
    };
    const data = (json.data || [])
      .filter((m) => typeof m.id === "string" && typeof m.name === "string")
      .map((m) => ({
        id: m.id as string,
        name: m.name as string,
        contextLength: m.context_length ?? m.top_provider?.context_length,
      }));
    return data.length ? data : FALLBACK_MODELS;
  } catch {
    return FALLBACK_MODELS;
  }
}

export interface ChatResult {
  content: string | null;
  toolCalls: ChatToolCall[];
}

export interface ChatStreamOptions {
  onTextDelta?: (delta: string) => void;
}

// Sends a chat completion request to OpenRouter using the caller-supplied token.
// The token is only ever sent to https://openrouter.ai and is never logged.
//
// When `tools` is provided, the model may reply with `tool_calls` instead of
// (or in addition to) text. Callers run an agent loop: execute each requested
// tool, append the results as `role: "tool"` messages, and call again until the
// model returns a final textual answer.
export async function chat(
  token: string,
  model: string,
  messages: ChatMessage[],
  tools?: ChatTool[],
  options?: ChatStreamOptions
): Promise<ChatResult> {
  const body: Record<string, unknown> = { model, messages, stream: true };
  if (tools && tools.length) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  const res = await fetch(`${OR_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Token is supplied at runtime; never embedded in source.
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let detail = text.slice(0, 500);
    try {
      const j = JSON.parse(text) as { error?: { message?: string } };
      if (j.error?.message) detail = j.error.message;
    } catch {
      // keep raw text
    }
    throw new Error(`OpenRouter 请求失败 (${res.status}): ${detail}`);
  }

  if (!res.body) throw new Error("OpenRouter 未返回可读取的流");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const parser = new OpenRouterStreamParser();
  let content = "";
  const toolCalls = new Map<number, ChatToolCall>();

  const consumeEvents = (events: ReturnType<OpenRouterStreamParser["push"]>) => {
    for (const event of events) {
      if (event.type === "text") {
        content += event.content;
        options?.onTextDelta?.(event.content);
        continue;
      }
      if (event.type !== "tool_call") continue;

      const previous = toolCalls.get(event.index);
      toolCalls.set(event.index, {
        id: event.id ?? previous?.id ?? `call_${event.index}`,
        type: "function",
        function: {
          name: event.name ?? previous?.function.name ?? "",
          arguments: (previous?.function.arguments ?? "") + (event.arguments ?? ""),
        },
      });
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    consumeEvents(parser.push(decoder.decode(value, { stream: true })));
  }
  consumeEvents(parser.push(decoder.decode()));
  consumeEvents(parser.finish());

  const orderedToolCalls = [...toolCalls.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, call]) => call);
  if (!content && orderedToolCalls.length === 0) throw new Error("OpenRouter 返回内容为空");
  return { content: content || null, toolCalls: orderedToolCalls };
}
