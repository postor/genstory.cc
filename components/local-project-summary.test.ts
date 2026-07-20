import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("empty local project categories expose type detail and create links", async () => {
  const source = await readFile(new URL("./local-project-summary.tsx", import.meta.url), "utf8");

  assert.match(source, /localizedPath\(lang, slug\)/);
  assert.match(source, /publicPages\[slug\]/);
  assert.match(source, /href=\{detailHref\}/);
  assert.match(source, /`\/projects\/new\?template=\$\{section\.id\}`/);
  assert.match(source, /home\.sectionDetails/);
});
