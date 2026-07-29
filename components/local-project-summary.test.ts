import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("local project summary exposes filters, sample work cards, and creation links", async () => {
  const source = await readFile(new URL("./local-project-summary.tsx", import.meta.url), "utf8");

  assert.match(source, /sampleWorks/);
  assert.match(source, /setActiveFilter/);
  assert.match(source, /\/projects\/new\?template=\$\{work\.template\}/);
  assert.match(source, /href=\{work\.href\}/);
  assert.match(source, /创建新项目|Create a new project/);
});
