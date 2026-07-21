import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("site header exposes the source repository link", async () => {
  const source = await readFile(new URL("./site-header.tsx", import.meta.url), "utf8");

  assert.match(source, /GitBranchIcon/);
  assert.match(source, /https:\/\/github\.com\/postor\/genstory\.cc/);
  assert.match(source, /aria-label=\{labels\.sourceCode\}/);
});

