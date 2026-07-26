import assert from "node:assert/strict";
import test from "node:test";

import {
  downloadOpenRouterVideo,
  needsOpenRouterDownloadAuth,
  openRouterVideoDownloadUrl,
  pollOpenRouterVideo,
  submitOpenRouterVideo,
} from "./openrouter-video.ts";

test("submits OpenRouter video jobs through the asynchronous REST endpoint", async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return new Response(
      JSON.stringify({ id: "job_123", status: "pending", polling_url: "/videos/job_123" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }) as typeof fetch;

  try {
    const job = await submitOpenRouterVideo("token", {
      model: "google/veo-3.1-lite",
      prompt: "slow cinematic forest dolly",
      duration: 4,
      resolution: "720p",
      aspect_ratio: "16:9",
      generate_audio: false,
    });

    assert.equal(job.id, "job_123");
    assert.equal(calls[0].url, "https://openrouter.ai/api/v1/videos");
    assert.equal(calls[0].init?.method, "POST");
    assert.equal((calls[0].init?.headers as Record<string, string>).Authorization, "Bearer token");
    assert.deepEqual(JSON.parse(String(calls[0].init?.body)), {
      model: "google/veo-3.1-lite",
      prompt: "slow cinematic forest dolly",
      duration: 4,
      resolution: "720p",
      aspect_ratio: "16:9",
      generate_audio: false,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("polls by job id or polling_url and recognizes authenticated content downloads", async () => {
  const calls: string[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL | Request) => {
    calls.push(String(url));
    return new Response(JSON.stringify({ id: "job_123", status: "completed" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  try {
    await pollOpenRouterVideo("token", "job_123");
    await pollOpenRouterVideo("token", "https://openrouter.ai/api/v1/videos/job_456");
    assert.deepEqual(calls, [
      "https://openrouter.ai/api/v1/videos/job_123",
      "https://openrouter.ai/api/v1/videos/job_456",
    ]);
    assert.equal(
      openRouterVideoDownloadUrl({ id: "job_123" }),
      "https://openrouter.ai/api/v1/videos/job_123/content?index=0"
    );
    assert.equal(needsOpenRouterDownloadAuth("https://openrouter.ai/api/v1/videos/job_123/content"), true);
    assert.equal(needsOpenRouterDownloadAuth("https://cdn.example.com/video.mp4"), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("downloads unsigned URLs without OpenRouter auth headers", async () => {
  let observedHeaders: HeadersInit | undefined;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    observedHeaders = init?.headers;
    return new Response(new Blob(["mp4"]), { status: 200, headers: { "Content-Type": "video/mp4" } });
  }) as typeof fetch;

  try {
    const blob = await downloadOpenRouterVideo("token", {
      id: "job_123",
      unsigned_urls: ["https://cdn.example.com/video.mp4"],
    });

    assert.equal(blob.type, "video/mp4");
    assert.equal(observedHeaders, undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
