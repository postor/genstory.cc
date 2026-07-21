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

test("file tree exposes a per-node action render slot", async () => {
  const source = await readFile(new URL("./file-tree.tsx", import.meta.url), "utf8");

  assert.match(source, /renderActions\?: \(element: TreeViewElement\) => ReactNode/);
  assert.match(source, /\{renderActions\?\.\(el\)\}/);
  assert.match(source, /event\.stopPropagation\(\)/);
});

test("file tree node actions are visible without hover", async () => {
  const source = await readFile(new URL("./file-tree.tsx", import.meta.url), "utf8");

  assert.equal(
    source.includes("opacity-0"),
    false,
    "operation icons should remain discoverable next to every tree node"
  );
});

test("file tree renders one action slot next to each node", async () => {
  const source = await readFile(new URL("./file-tree.tsx", import.meta.url), "utf8");

  assert.match(source, /renderActions\?\.\(el\)/);
  assert.equal(
    (source.match(/renderActions\?\.\(el\)/g) ?? []).length,
    1,
    "the tree should render one grouped action slot per node"
  );
});
