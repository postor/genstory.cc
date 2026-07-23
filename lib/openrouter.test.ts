import assert from "node:assert/strict";
import test from "node:test";

import { chat, getModelProviders, listModels } from "./openrouter.ts";

test("loads model metadata without requesting provider endpoints", async () => {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];

  globalThis.fetch = async (input) => {
    const url = String(input);
    urls.push(url);
    if (url.endsWith("/models")) {
      return new Response(
        JSON.stringify({
          data: [
            {
              id: "google/gemini-2.5-flash",
              name: "Google: Gemini 2.5 Flash",
              context_length: 1000,
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    throw new Error(`unexpected endpoint request: ${url}`);
  };

  try {
    assert.deepEqual(await listModels(), [
      {
        id: "google/gemini-2.5-flash",
        name: "Google: Gemini 2.5 Flash",
        contextLength: 1000,
      },
    ]);
    assert.deepEqual(urls, ["https://openrouter.ai/api/v1/models"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("uses a configured OpenAI-compatible base URL and API key for model loading", async () => {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];
  const headers: Headers[] = [];

  globalThis.fetch = async (input, init) => {
    urls.push(String(input));
    headers.push(new Headers(init?.headers));
    return new Response(
      JSON.stringify({
        data: [{ id: "custom-model", name: "Custom model", context_length: 4096 }],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  };

  try {
    assert.deepEqual(
      await listModels({
        baseUrl: "https://api.example.com/v1",
        apiKey: "custom-key",
      }),
      [{ id: "custom-model", name: "Custom model", contextLength: 4096 }]
    );
    assert.deepEqual(urls, ["https://api.example.com/v1/models"]);
    assert.equal(headers[0]?.get("Authorization"), "Bearer custom-key");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("does not hide custom API model-list failures behind OpenRouter fallback models", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };

  try {
    await assert.rejects(
      listModels({
        baseUrl: "https://api.example.com/v1",
        apiKey: "custom-key",
      }),
      /Failed to fetch/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("loads providers only when the selected model requests them", async () => {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    urls.push(url);
    return new Response(JSON.stringify({
      data: {
        endpoints: [
          { provider_name: "Google AI Studio", tag: "google-ai-studio" },
          { provider_name: "Google AI Studio", tag: "google-ai-studio/flex" },
          { provider_name: "Google", tag: "google-vertex" },
        ],
      },
    }), { status: 200 });
  };

  try {
    assert.deepEqual(await getModelProviders("google/gemini-3.6-flash"), [
      { name: "Google AI Studio", slug: "google-ai-studio" },
      { name: "Google", slug: "google-vertex" },
    ]);
    assert.deepEqual(urls, [
      "https://openrouter.ai/api/v1/models/google/gemini-3.6-flash/endpoints",
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("sends chat completions to the configured OpenAI-compatible endpoint", async () => {
  const originalFetch = globalThis.fetch;
  const encoder = new TextEncoder();
  let requestUrl = "";
  let requestHeaders: Headers | undefined;

  globalThis.fetch = async (input, init) => {
    requestUrl = String(input);
    requestHeaders = new Headers(init?.headers);
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"ok"}}]}\n\n'));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    return new Response(body, { status: 200 });
  };

  try {
    const result = await chat(
      "fallback-token",
      "custom-model",
      [{ role: "user", content: "hello" }],
      undefined,
      {
        apiSettings: {
          baseUrl: "https://api.example.com/v1",
          apiKey: "custom-key",
        },
      }
    );

    assert.equal(requestUrl, "https://api.example.com/v1/chat/completions");
    assert.equal(requestHeaders?.get("Authorization"), "Bearer custom-key");
    assert.deepEqual(result, { content: "ok", toolCalls: [] });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("can explicitly keep OpenRouter active when a custom API is configured", async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  let requestUrl = "";
  const encoder = new TextEncoder();

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: () =>
          JSON.stringify({
            baseUrl: "https://api.example.com/v1",
            apiKey: "custom-key",
          }),
      },
    },
  });
  globalThis.fetch = async (input) => {
    requestUrl = String(input);
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"ok"}}]}\n\n'));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    return new Response(body, { status: 200 });
  };

  try {
    await chat(
      "openrouter-token",
      "openai/gpt-4o-mini",
      [{ role: "user", content: "hello" }],
      undefined,
      {
        apiSettings: null,
      }
    );
    assert.equal(requestUrl, "https://openrouter.ai/api/v1/chat/completions");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWindow === undefined) {
      Reflect.deleteProperty(globalThis, "window");
    } else {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow,
      });
    }
  }
});

test("requests a streaming completion and reports text deltas immediately", async () => {
  const originalFetch = globalThis.fetch;
  const encoder = new TextEncoder();
  const chunks = [
    'data: {"choices":[{"delta":{"content":"第一"}}]}\n\n',
    'data: {"choices":[{"delta":{"content":"段"}}]}\n\ndata: [DONE]\n\n',
  ];
  const deltas: string[] = [];
  let requestBody: Record<string, unknown> | undefined;

  globalThis.fetch = async (_input, init) => {
    requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    });
    return new Response(body, { status: 200 });
  };

  try {
    const result = await chat(
      "test-token",
      "test-model",
      [{ role: "user", content: "你好" }],
      undefined,
      {
        onTextDelta: (delta) => deltas.push(delta),
        providerOnly: ["google-ai-studio"],
      }
    );

    assert.equal(requestBody?.stream, true);
    assert.deepEqual(requestBody?.provider, {
      only: ["google-ai-studio"],
      allow_fallbacks: false,
    });
    assert.deepEqual(deltas, ["第一", "段"]);
    assert.deepEqual(result, { content: "第一段", toolCalls: [] });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("explains provider quota errors when a provider is explicitly selected", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({ error: { message: "Provider returned error", metadata: { raw: "quota exceeded" } } }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );

  try {
    await assert.rejects(
      () => chat(
        "test-token",
        "google/gemini-3.6-flash",
        [{ role: "user", content: "test" }],
        undefined,
        { providerOnly: ["google-ai-studio"] }
      ),
      /Provider google-ai-studio 的配额或速率限制已触发.*quota exceeded/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
