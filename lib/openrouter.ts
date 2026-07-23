// Client-side OpenRouter OpenAI-compatible API helpers.
//
// This module is intentionally server-less: the project is a static export with
// no backend, and the OpenRouter token lives in the browser's localStorage (see
// lib/mcp-client.ts). The token is passed in at call time from the page and is
// NEVER embedded in this source file or logged anywhere, so it never leaks into
// the frontend bundle or server responses.
//
// Usage: pass the live bearer token (from loadTokens()/getToken()) into chat().

import { OpenRouterStreamParser } from "./openrouter-stream.ts";
import {
  isOpenAICompatibleConfigured,
  loadOpenAICompatibleSettings,
  type OpenAICompatibleSettings,
} from "./openai-compatible-settings.ts";

const OR_BASE = "https://openrouter.ai/api/v1";
const MODEL_LOG_PREFIX = "[OpenRouter:model]";

interface ResolvedApi {
  baseUrl: string;
  apiKey: string;
  custom: boolean;
}

function resolveApi(
  settings?: OpenAICompatibleSettings | null,
  fallbackToken = ""
): ResolvedApi {
  const configured = settings === undefined ? loadOpenAICompatibleSettings() : settings;
  if (configured && isOpenAICompatibleConfigured(configured)) {
    return {
      baseUrl: configured.baseUrl,
      apiKey: configured.apiKey,
      custom: true,
    };
  }
  return { baseUrl: OR_BASE, apiKey: fallbackToken, custom: false };
}

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
  providers?: { name: string; slug: string }[];
  pricing?: {
    prompt?: string;
    completion?: string;
  };
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

// OpenAI-compatible function tool definition, derived from MCP tools.
export interface ChatFunctionTool {
  type: "function";
  function: { name: string; description?: string; parameters?: unknown };
}

// OpenRouter-hosted server tool. It runs on OpenRouter and does not expose a
// search provider key to the browser.
export interface OpenRouterWebSearchTool {
  type: "openrouter:web_search";
  parameters?: {
    search_context_size?: "low" | "medium" | "high";
  };
}

export type ChatTool = ChatFunctionTool | OpenRouterWebSearchTool;

export const OPENROUTER_WEB_SEARCH_TOOL: OpenRouterWebSearchTool = {
  type: "openrouter:web_search",
  parameters: { search_context_size: "medium" },
};

// Fetches the available model list from OpenRouter. Falls back to a curated
// list on any failure so the picker always works.
export async function listModels(
  apiSettings?: OpenAICompatibleSettings | null
): Promise<ModelInfo[]> {
  const api = resolveApi(apiSettings);
  try {
    console.info(MODEL_LOG_PREFIX, "fetching model index");
    const headers: Record<string, string> = { Accept: "application/json" };
    if (api.apiKey) headers.Authorization = `Bearer ${api.apiKey}`;
    const res = await fetch(`${api.baseUrl}/models`, {
      headers,
    });
    if (!res.ok) {
      console.info(MODEL_LOG_PREFIX, "model index failed", { status: res.status });
      if (api.custom) {
        throw new Error(`custom model index request failed (${res.status})`);
      }
      return FALLBACK_MODELS;
    }
    const json = (await res.json()) as {
      data?: {
        id?: string;
        name?: string;
        context_length?: number;
        top_provider?: { context_length?: number };
        pricing?: { prompt?: string; completion?: string };
      }[];
    };
    const data = (json.data || [])
      .filter((m) => typeof m.id === "string")
      .map((m) => {
        const model: ModelInfo = {
          id: m.id as string,
          name: typeof m.name === "string" && m.name ? m.name : (m.id as string),
        };
        const contextLength = m.context_length ?? m.top_provider?.context_length;
        if (contextLength !== undefined) model.contextLength = contextLength;
        if (m.pricing) model.pricing = m.pricing;
        return model;
      });
    if (!data.length) {
      console.info(MODEL_LOG_PREFIX, "model index was empty, using fallback models");
      if (api.custom) {
        throw new Error("custom model index was empty");
      }
      return FALLBACK_MODELS;
    }

    console.info(MODEL_LOG_PREFIX, "model index loaded", { count: data.length });
    return data;
  } catch (error) {
    console.info(MODEL_LOG_PREFIX, "model index request threw, using fallback models");
    if (api.custom) {
      throw error instanceof Error ? error : new Error("custom model index request failed");
    }
    return FALLBACK_MODELS;
  }
}

export async function getModelProviders(
  modelId: string,
  apiSettings?: OpenAICompatibleSettings | null
): Promise<{ name: string; slug: string }[]> {
  const api = resolveApi(apiSettings);
  if (api.custom) return [];
  const slash = modelId.indexOf("/");
  if (slash < 1 || slash === modelId.length - 1) return [];
  const author = encodeURIComponent(modelId.slice(0, slash));
  const slug = encodeURIComponent(modelId.slice(slash + 1));

  try {
    const res = await fetch(`${OR_BASE}/models/${author}/${slug}/endpoints`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      data?: { endpoints?: { provider_name?: string; tag?: string }[] };
    };
    const providers = new Map<string, { name: string; slug: string }>();
    for (const endpoint of json.data?.endpoints || []) {
      if (!endpoint.provider_name || !endpoint.tag) continue;
      const slug = endpoint.tag.split("/")[0];
      if (!providers.has(slug)) providers.set(slug, { name: endpoint.provider_name, slug });
    }
    const result = [...providers.values()];
    if (result.length) {
      console.info(MODEL_LOG_PREFIX, "providers loaded", { modelId, providers: result });
    }
    return result;
  } catch {
    return [];
  }
}

export interface ChatResult {
  content: string | null;
  toolCalls: ChatToolCall[];
}

export interface ChatStreamOptions {
  onTextDelta?: (delta: string) => void;
  providerOnly?: string[];
  apiSettings?: OpenAICompatibleSettings | null;
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
  const api = resolveApi(options?.apiSettings, token);
  const body: Record<string, unknown> = { model, messages, stream: true };
  if (!api.custom && options?.providerOnly?.length) {
    body.provider = { only: options.providerOnly, allow_fallbacks: false };
  }
  if (tools && tools.length) {
    body.tools = tools;
    body.tool_choice = "auto";
  }

  const res = await fetch(`${api.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Token is supplied at runtime; never embedded in source.
      Authorization: `Bearer ${api.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let detail = text.slice(0, 500);
    try {
      const j = JSON.parse(text) as {
        error?: { message?: string; code?: number; metadata?: { raw?: string } };
      };
      if (j.error?.message) detail = j.error.message;
      if (j.error?.metadata?.raw) detail += `: ${j.error.metadata.raw.slice(0, 300)}`;
    } catch {
      // keep raw text
    }
    if (res.status === 429) {
      const provider = options?.providerOnly?.join(", ");
      detail = provider
        ? `Provider ${provider} 的配额或速率限制已触发，请检查该 provider 的 BYOK 配额。${detail}`
        : `${detail}。上游 provider 的配额或速率限制已触发。`;
    }
    throw new Error(
      `${api.custom ? "兼容 API" : "OpenRouter"} 请求失败 (${res.status}): ${detail}`
    );
  }

  if (!res.body) {
    throw new Error(`${api.custom ? "兼容 API" : "OpenRouter"} 未返回可读取的流`);
  }

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
  if (!content && orderedToolCalls.length === 0) {
    throw new Error(`${api.custom ? "兼容 API" : "OpenRouter"} 返回内容为空`);
  }
  return { content: content || null, toolCalls: orderedToolCalls };
}
