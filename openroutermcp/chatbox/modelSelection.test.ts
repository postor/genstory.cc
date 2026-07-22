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

test("prefers NVIDIA Nemotron 3 Ultra when the previous selection is unavailable", () => {
  const models = [
    { id: "openai/gpt-4.1", name: "OpenAI: GPT-4.1" },
    { id: "google/gemini-2.5-flash-lite:free", name: "Google: Gemini 2.5 Flash Lite (free)" },
    { id: "nvidia/nemotron-3-ultra:free", name: "NVIDIA: Nemotron 3 Ultra (free)" },
  ];

  assert.equal(
    pickInitialModelId(models, "anthropic/claude-sonnet-4"),
    "nvidia/nemotron-3-ultra:free"
  );
});

test("keeps the previous model ahead of the preferred default", () => {
  const models = [
    { id: "openai/gpt-4.1", name: "OpenAI: GPT-4.1" },
    { id: "nvidia/nemotron-3-ultra:free", name: "NVIDIA: Nemotron 3 Ultra (free)" },
  ];

  assert.equal(pickInitialModelId(models, "openai/gpt-4.1"), "openai/gpt-4.1");
});

test("falls back to the first model when there is no previous selection and no free model", () => {
  const models = [
    { id: "openai/gpt-4.1", name: "OpenAI: GPT-4.1" },
    { id: "openai/gpt-4o", name: "OpenAI: GPT-4o" },
  ];

  assert.equal(pickInitialModelId(models, ""), "openai/gpt-4.1");
});
