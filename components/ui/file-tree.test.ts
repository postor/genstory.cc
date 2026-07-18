import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("file tree indentation is not capped to a fixed maximum depth", async () => {
  const source = await readFile(new URL("./file-tree.tsx", import.meta.url), "utf8");

  assert.equal(
    source.includes('Math.min(depth, 4)'),
    false,
    "tree indentation should keep increasing for deeper descendants"
  );
});
