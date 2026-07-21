import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("code editor exposes a persistent automatic wrapping toggle", async () => {
  const source = await readFile(new URL("./code-editor.tsx", import.meta.url), "utf8");

  assert.match(source, /EditorView\.lineWrapping/);
  assert.match(source, /localStorage/);
  assert.match(source, /codeEditor\.wrap/);
  assert.match(source, /aria-pressed/);
});

test("code editor enables automatic wrapping by default until a saved preference overrides it", async () => {
  const source = await readFile(new URL("./code-editor.tsx", import.meta.url), "utf8");

  assert.match(source, /const \[wrapLines, setWrapLines\] = useState\(true\)/);
  assert.match(source, /savedWrapPreference === null \? true : savedWrapPreference === "true"/);
});

test("code editor keeps wrapping toggle usable when storage is unavailable", async () => {
  const source = await readFile(new URL("./code-editor.tsx", import.meta.url), "utf8");

  assert.match(source, /function readSavedWrapPreference/);
  assert.match(source, /function saveWrapPreference/);
  assert.match(source, /catch \{\s*return true;\s*\}/);
  assert.match(source, /catch \{\s*\/\* Ignore storage errors; wrapping still toggles for this session\. \*\/\s*\}/);
});

test("code editor keeps both axes scrollable inside the fixed editor body", async () => {
  const source = await readFile(new URL("./code-editor.tsx", import.meta.url), "utf8");

  assert.match(source, /\[&_\.cm-scroller\]:overflow-auto/);
  assert.match(source, /\[&_\.cm-scroller\]:h-full/);
  assert.match(source, /min-w-0 flex-1 overflow-hidden/);
});
