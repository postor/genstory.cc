import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("home page sends creation-type exploration to local categories", async () => {
  const source = await readFile(new URL("./public-home-page.tsx", import.meta.url), "utf8");

  assert.match(source, /href="#work-types"/);
  assert.match(source, /<LocalProjectSummary \/>/);
  assert.match(source, /id="work-types"/);
  assert.doesNotMatch(source, /publicPageSlugs\.map/);
});
