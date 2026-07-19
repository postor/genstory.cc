import assert from "node:assert/strict";
import test from "node:test";

import { pickInitialModelId } from "./modelSelection.ts";

test("keeps the previously selected model when it still exists", () => {
  const models = [
    { id: "openai/gpt-4o-mini", name: "OpenAI: GPT-4o mini" },
    { id: "openai/gpt-4o", name: "OpenAI: GPT-4o" },
  ];

  assert.equal(pickInitialModelId(models, "openai/gpt-4o"), "openai/gpt-4o");
});

test("falls back to the first free model when the previous selection is unavailable", () => {
  const models = [
    { id: "openai/gpt-4.1", name: "OpenAI: GPT-4.1" },
    { id: "google/gemini-2.5-flash-lite", name: "Google: Gemini 2.5 Flash Lite (free)" },
    { id: "deepseek/deepseek-chat-v3-0324", name: "DeepSeek: Chat V3 0324 (free)" },
  ];

  assert.equal(
    pickInitialModelId(models, "anthropic/claude-sonnet-4"),
    "google/gemini-2.5-flash-lite"
  );
});

test("falls back to the first model when there is no previous selection and no free model", () => {
  const models = [
    { id: "openai/gpt-4.1", name: "OpenAI: GPT-4.1" },
    { id: "openai/gpt-4o", name: "OpenAI: GPT-4o" },
  ];

  assert.equal(pickInitialModelId(models, ""), "openai/gpt-4.1");
});
