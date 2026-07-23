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
