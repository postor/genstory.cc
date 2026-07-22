import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("site header exposes the source repository link", async () => {
  const source = await readFile(new URL("./site-header.tsx", import.meta.url), "utf8");

  assert.match(source, /GitHubMark/);
  assert.doesNotMatch(source, /GitBranchIcon/);
  assert.match(source, /https:\/\/github\.com\/postor\/genstory\.cc/);
  assert.match(source, /aria-label=\{labels\.sourceCode\}/);
});

test("site header exposes the new issue link after the GitHub link", async () => {
  const source = await readFile(new URL("./site-header.tsx", import.meta.url), "utf8");

  const repositoryIndex = source.indexOf("https://github.com/postor/genstory.cc");
  const issueIndex = source.indexOf("https://github.com/postor/genstory.cc/issues/new");

  assert.notEqual(repositoryIndex, -1);
  assert.notEqual(issueIndex, -1);
  assert.ok(repositoryIndex < issueIndex);
  assert.match(source, /aria-label=\{labels\.newIssue\}/);
  assert.match(source, />\s*Issue\s*</);
});
