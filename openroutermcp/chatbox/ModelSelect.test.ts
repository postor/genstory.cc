import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("model picker links to OpenRouter benchmark rankings from the dropdown footer", async () => {
  const source = await readFile(new URL("./ModelSelect.tsx", import.meta.url), "utf8");

  assert.match(source, /https:\/\/openrouter\.ai\/rankings#benchmarks/);
  assert.match(source, /target="_blank"/);
  assert.match(source, /rel="noopener noreferrer"/);
  assert.match(source, /t\("chat\.modelBenchmarkHint"\)/);
  assert.match(source, /t\("chat\.modelBenchmarkLink"\)/);
});

test("model picker keyboard navigation only handles keys from the filter input", async () => {
  const source = await readFile(new URL("./ModelSelect.tsx", import.meta.url), "utf8");

  assert.match(source, /if \(e\.target !== inputRef\.current\) return;/);
});

test("model picker renders OpenRouter input and output pricing", async () => {
  const source = await readFile(new URL("./ModelSelect.tsx", import.meta.url), "utf8");

  assert.match(source, /pricing\?\.prompt/);
  assert.match(source, /pricing\?\.completion/);
  assert.match(source, /per 1M tokens/);
  assert.match(source, /text-\[10px\]/);
});
