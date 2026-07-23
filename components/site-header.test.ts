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

test("site header collapses mobile navigation into a menu without the home link", async () => {
  const source = await readFile(new URL("./site-header.tsx", import.meta.url), "utf8");

  assert.match(source, /MenuIcon/);
  assert.match(source, /className="hidden items-center gap-1 sm:flex"/);
  assert.match(source, /className="sm:hidden"/);
  assert.match(source, /navItems\.filter\(\(item\) => item\.href !== localizedPath\(publicLang\)\)/);
  assert.match(source, /aria-label=\{labels\.menu\}/);
});
