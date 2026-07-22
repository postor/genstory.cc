import assert from "node:assert/strict";
import test from "node:test";

import { trackEvent } from "./analytics.ts";

test("trackEvent is a no-op outside the browser", () => {
  const originalWindow = globalThis.window;

  try {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: undefined,
    });

    assert.doesNotThrow(() => {
      trackEvent("chat_send", { model: "openai/gpt-5", message_length: 42 });
    });
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  }
});

test("trackEvent sends sanitized Google Analytics events in the browser", () => {
  const originalWindow = globalThis.window;
  const calls: unknown[][] = [];

  try {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        gtag: (...args: unknown[]) => calls.push(args),
      },
    });

    trackEvent("project_create", {
      template: "visual-novel",
      lang: "zh",
      skipped: undefined,
      empty: null,
    });

    assert.deepEqual(calls, [
      [
        "event",
        "project_create",
        {
          template: "visual-novel",
          lang: "zh",
        },
      ],
    ]);
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  }
});
