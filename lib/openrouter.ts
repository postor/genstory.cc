// Client-side OpenRouter OpenAI-compatible API helpers.
//
// This module is intentionally server-less: the project is a static export with
// no backend, and the OpenRouter token lives in the browser's localStorage (see
// lib/mcp-client.ts). The token is passed in at call time from the page and is
// NEVER embedded in this source file or logged anywhere, so it never leaks into
// the frontend bundle or server responses.
//
// Usage: pass the live bearer token (from loadTokens()/getToken()) into chat().

const OR_BASE = "https://openrouter.ai/api/v1";

// Curated fallback models, used when the live /models endpoint is unreachable
// (offline, CORS, or rate-limited). Keeps the model picker usable in all cases.
const FALLBACK_MODELS: ModelInfo[] = [
  { id: "openai/gpt-4o-mini", name: "OpenAI: GPT-4o mini" },
  { id: "openai/gpt-4o", name: "OpenAI: GPT-4o" },
  { id: "anthropic/claude-3.5-sonnet", name: "Anthropic: Claude 3.5 Sonnet" },
  { id: "google/gemini-flash-1.5", name: "Google: Gemini Flash 1.5" },
  { id: "meta-llama/llama-3.1-8b-instruct", name: "Meta: Llama 3.1 8B" },
];

export interface ModelInfo {
  id: string;
  name: string;
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
      data?: { id?: string; name?: string }[];
    };
    const data = (json.data || [])
      .filter((m) => typeof m.id === "string" && typeof m.name === "string")
      .map((m) => ({ id: m.id as string, name: m.name as string }));
    return data.length ? data : FALLBACK_MODELS;
  } catch {
    return FALLBACK_MODELS;
  }
}

export interface ChatResult {
  content: string | null;
  toolCalls: ChatToolCall[];
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
  tools?: ChatTool[]
): Promise<ChatResult> {
  const body: Record<string, unknown> = { model, messages, stream: false };
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

  const json = (await res.json()) as {
    choices?: { message?: { content?: string | null; tool_calls?: ChatToolCall[] } }[];
  };
  const message = json.choices?.[0]?.message;
  const content = message?.content ?? null;
  const toolCalls = message?.tool_calls ?? [];
  if (!content && toolCalls.length === 0) throw new Error("OpenRouter 返回内容为空");
  return { content, toolCalls };
}
