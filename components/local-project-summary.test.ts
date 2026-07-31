import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("local project summary exposes filters, sample work cards, and creation links", async () => {
  const source = await readFile(new URL("./local-project-summary.tsx", import.meta.url), "utf8");

  assert.match(source, /sampleWorks/);
  assert.match(source, /setActiveFilter/);
  assert.match(source, /localizedPath\(lang, work\.template\)/);
  assert.match(source, /href=\{work\.href\}/);
  assert.match(source, /创建新项目|Create a new project/);
  assert.match(source, /flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between/);
  assert.match(source, /<section aria-label=\{t\("nav\.projects"\)\} className="min-w-0">/);
  assert.match(source, /mb-5 flex w-full min-w-0 max-w-full gap-1 overflow-x-auto pb-1/);
  assert.match(source, /<div className="min-w-0">/);
});

test("local project summary prefers project cover files before type artwork", async () => {
  const [source, coverSource, renderSource] = await Promise.all([
    readFile(new URL("./local-project-summary.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/project-cover.ts", import.meta.url), "utf8"),
    readFile(new URL("./project-cover.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(source, /readProjectCoverUrl/);
  assert.match(source, /projectTypeImages\[project\.template\]/);
  assert.match(coverSource, /\["cover\.jpg", "cover\.png"\]/);
  assert.match(coverSource, /URL\.createObjectURL\(file\)/);
  assert.match(renderSource, /object-contain object-center/);
  assert.match(renderSource, /max-h-\[78%\] max-w-\[78%\]/);
});
