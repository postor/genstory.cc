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

test("site header places GitHub actions behind the GitHub menu", async () => {
  const source = await readFile(new URL("./site-header.tsx", import.meta.url), "utf8");

  const repositoryIndex = source.indexOf("https://github.com/postor/genstory.cc");
  const issueIndex = source.indexOf("https://github.com/postor/genstory.cc/issues/new");
  const sponsorIndex = source.indexOf("https://github.com/sponsors/postor");

  assert.notEqual(repositoryIndex, -1);
  assert.notEqual(issueIndex, -1);
  assert.notEqual(sponsorIndex, -1);
  assert.ok(repositoryIndex < sponsorIndex);
  assert.ok(sponsorIndex < issueIndex);
  assert.match(source, /PopoverTrigger/);
  assert.match(source, /aria-label=\{labels\.githubMenu\}/);
  assert.match(source, /labels\.star/);
  assert.match(source, /labels\.sponsor/);
  assert.match(source, /aria-label=\{labels\.newIssue\}/);
});

test("site header no longer renders the notification or avatar tools", async () => {
  const source = await readFile(new URL("./site-header.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(source, /<Bell\b/);
  assert.doesNotMatch(source, /assistant-bust\.png/);
  assert.doesNotMatch(source, /notifications:/);
  assert.doesNotMatch(source, /account:/);
});

test("site header collapses mobile navigation into a menu without the home link", async () => {
  const source = await readFile(new URL("./site-header.tsx", import.meta.url), "utf8");

  assert.match(source, /MenuIcon/);
  assert.match(source, /className="hidden items-center gap-1 sm:flex"/);
  assert.match(source, /sm:hidden/);
  assert.match(source, /navItems\.filter\(\(item\) => item\.href !== localizedPath\(publicLang\)\)/);
  assert.match(source, /aria-label=\{labels\.menu\}/);
});

test("site header exposes the searchable project and document palette", async () => {
  const source = await readFile(new URL("./site-header.tsx", import.meta.url), "utf8");

  assert.match(source, /<SiteSearch lang=\{publicLang\} homeHeader=\{homeHeader\} \/>/);
  assert.doesNotMatch(source, /render=\{<Link href="#work-types" \/>/);
});

test("homepage header uses the scroll surface on mobile as well as desktop", async () => {
  const headerSource = await readFile(
    new URL("./site-header.tsx", import.meta.url),
    "utf8",
  );
  const styles = await readFile(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );

  assert.match(headerSource, /homeHeader\s*\?\s*"fixed inset-x-0/);
  assert.match(
    styles,
    /\.home-header-scroll-surface\s*\{[\s\S]*animation-timeline:\s*scroll\(root\)/,
  );
  assert.doesNotMatch(
    styles,
    /@media\s*\(min-width:\s*1024px\)[\s\S]{0,160}\.home-header-scroll-surface/,
  );
});
