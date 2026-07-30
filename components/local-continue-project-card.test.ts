import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("continue project card uses the most recently updated local project", async () => {
  const source = await readFile(new URL("./local-continue-project-card.tsx", import.meta.url), "utf8");

  assert.match(source, /"use client"/);
  assert.match(source, /void listProjects\(\)[\s\S]*\.then/);
  assert.match(source, /const recentProject = projects\[0\];/);
  assert.match(source, /if \(!recentProject\) return null;/);
  assert.match(source, /const projectHref = `\/projects\/editor\?id=\$\{recentProject\.id\}`;/);
  assert.match(source, /href=\{projectHref\}/);
  assert.match(source, /今天继续创作|Continue creating today/);
  assert.match(source, /继续创作|Continue/);
});

test("continue project card loads project cover before falling back to type artwork", async () => {
  const source = await readFile(new URL("./local-continue-project-card.tsx", import.meta.url), "utf8");

  assert.match(source, /readProjectCoverUrl\(recentProject\)/);
  assert.match(source, /\["cover\.jpg", "cover\.png"\]/);
  assert.match(source, /coverImage \?\? typeImages\[recentProject\.template\]/);
  assert.match(source, /URL\.createObjectURL\(file\)/);
  assert.match(source, /URL\.revokeObjectURL\(coverUrl\)/);
});
