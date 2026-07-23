import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_OPENAI_COMPATIBLE_SETTINGS,
  isOpenAICompatibleConfigured,
  loadOpenAICompatibleSettings,
  saveOpenAICompatibleSettings,
} from "./openai-compatible-settings.ts";

test("loads and saves a complete OpenAI-compatible API configuration", () => {
  const originalWindow = globalThis.window;
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    },
  });

  try {
    assert.deepEqual(loadOpenAICompatibleSettings(), DEFAULT_OPENAI_COMPATIBLE_SETTINGS);
    saveOpenAICompatibleSettings({
      baseUrl: " https://api.example.com/v1/ ",
      apiKey: " key ",
    });

    assert.deepEqual(loadOpenAICompatibleSettings(), {
      baseUrl: "https://api.example.com/v1",
      apiKey: "key",
    });
    assert.equal(
      isOpenAICompatibleConfigured(loadOpenAICompatibleSettings()),
      true
    );
  } finally {
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

test("does not treat a partial OpenAI-compatible API configuration as active", () => {
  assert.equal(
    isOpenAICompatibleConfigured({ baseUrl: "https://api.example.com/v1", apiKey: "" }),
    false
  );
  assert.equal(
    isOpenAICompatibleConfigured({ baseUrl: "", apiKey: "key" }),
    false
  );
});
