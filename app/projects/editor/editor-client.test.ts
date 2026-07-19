import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("editor title can enter inline edit mode on click and saves on blur", async () => {
  const source = await readFile(new URL("./editor-client.tsx", import.meta.url), "utf8");

  assert.match(source, /onClick=\{\(\) => startTitleEditing\(\)\}/);
  assert.match(source, /onBlur=\{\(\) => void commitTitleChange\(\)\}/);
  assert.match(source, /<Pencil className="size-4" \/>/);
  assert.match(source, /<Input/);
});
