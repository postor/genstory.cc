import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("home page sends creation-type exploration to local categories", async () => {
  const source = await readFile(new URL("./public-home-page.tsx", import.meta.url), "utf8");

  assert.match(source, /href="#work-types"/);
  assert.match(source, /<LocalProjectSummary \/>/);
  assert.match(source, /<LocalContinueProjectCard lang=\{lang\} \/>/);
  assert.match(source, /id="work-types"/);
  assert.match(source, /\/home\/type-icons\//);
  assert.match(source, /object-contain object-center/);
  assert.doesNotMatch(source, /group-hover:scale-105/);
  assert.doesNotMatch(source, /continueWork: "星之旅人"/);
  assert.doesNotMatch(source, /continueType: "视觉小说"/);
  assert.doesNotMatch(source, /publicPageSlugs\.map/);
});
