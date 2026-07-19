import assert from "node:assert/strict";
import test from "node:test";

import { chat } from "./openrouter.ts";

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
      { onTextDelta: (delta) => deltas.push(delta) }
    );

    assert.equal(requestBody?.stream, true);
    assert.deepEqual(deltas, ["第一", "段"]);
    assert.deepEqual(result, { content: "第一段", toolCalls: [] });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
