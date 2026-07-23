import assert from "node:assert/strict";
import test from "node:test";

import { pickInitialModelId } from "./modelSelection.ts";

test("prefers the previous model from this chat over the global model", () => {
  const models = [
    { id: "openai/gpt-4o-mini", name: "OpenAI: GPT-4o mini" },
    { id: "openai/gpt-4o", name: "OpenAI: GPT-4o" },
  ];

  assert.equal(
    pickInitialModelId(models, {
      chatModelId: "openai/gpt-4o-mini",
      globalModelId: "openai/gpt-4o",
    }),
    "openai/gpt-4o-mini"
  );
});

test("uses the previous global model when this chat has no valid previous model", () => {
  const models = [
    { id: "openai/gpt-4o-mini", name: "OpenAI: GPT-4o mini" },
    { id: "openai/gpt-4o", name: "OpenAI: GPT-4o" },
  ];

  assert.equal(
    pickInitialModelId(models, {
      chatModelId: "anthropic/claude-sonnet-4",
      globalModelId: "openai/gpt-4o",
    }),
    "openai/gpt-4o"
  );
});

test("prefers the model named Free Models Router before the first model", () => {
  const models = [
    { id: "openai/gpt-4.1", name: "OpenAI: GPT-4.1" },
    { id: "openrouter/free", name: "Free Models Router" },
  ];

  assert.equal(
    pickInitialModelId(models, {
      chatModelId: "anthropic/claude-sonnet-4",
      globalModelId: "google/gemini-2.5-flash",
    }),
    "openrouter/free"
  );
});

test("falls back to the first model when no previous selection or Free Models Router exists", () => {
  const models = [
    { id: "openai/gpt-4.1", name: "OpenAI: GPT-4.1" },
    { id: "openai/gpt-4o", name: "OpenAI: GPT-4o" },
  ];

  assert.equal(
    pickInitialModelId(models, {
      chatModelId: "",
      globalModelId: "",
    }),
    "openai/gpt-4.1"
  );
});

test("ignores previous selections that are no longer in the model list", () => {
  const models = [
    { id: "openrouter/free", name: "Free Models Router" },
    { id: "openai/gpt-4o", name: "OpenAI: GPT-4o" },
  ];

  assert.equal(
    pickInitialModelId(models, {
      chatModelId: "openai/missing-chat-model",
      globalModelId: "openai/missing-global-model",
    }),
    "openrouter/free"
  );
});
