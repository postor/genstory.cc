import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("projects page can enter inline title edit mode from title or icon", async () => {
  const source = await readFile(new URL("./projects-client.tsx", import.meta.url), "utf8");

  assert.match(source, /editingProjectId === project\.id/);
  assert.match(source, /onClick=\{\(\) => startTitleEditing\(project\)\}/);
  assert.match(source, /onBlur=\{\(\) => void commitTitleChange\(project\)\}/);
  assert.match(source, /<Pencil className="size-3\.5" \/>/);

  assert.match(source, /await saveProject\(\{ \.\.\.project, title: nextTitle, updatedAt: now \}\)/);

});

test("projects empty state links the new work call to action", async () => {
  const source = await readFile(new URL("./projects-client.tsx", import.meta.url), "utf8");

  assert.match(source, /<Link href="\/projects\/new" className="[^"]*underline/);
  assert.match(source, /\{t\("projects\.emptyBeforeNew"\)\}/);
  assert.match(source, /\{t\("projects\.new"\)\}/);
  assert.match(source, /\{t\("projects\.emptyAfterNew"\)\}/);
});
