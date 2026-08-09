import assert from "node:assert/strict";
import test from "node:test";

import { formatThinkingLabel, thinkingDotCount } from "./thinkingIndicator.ts";

test("cycles the thinking dot count from one to three", () => {
  assert.equal(thinkingDotCount(0), 1);
  assert.equal(thinkingDotCount(1), 2);
  assert.equal(thinkingDotCount(2), 3);
  assert.equal(thinkingDotCount(3), 1);
  assert.equal(thinkingDotCount(7), 2);
});

test("formats the loading label with a changing dot suffix", () => {
  assert.equal(formatThinkingLabel(0, "zh"), "思考中.");
  assert.equal(formatThinkingLabel(1, "zh"), "思考中..");
  assert.equal(formatThinkingLabel(2, "zh"), "思考中...");
  assert.equal(formatThinkingLabel(0, "en"), "Thinking.");
});
