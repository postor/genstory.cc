import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { isImmersiveRoute } from "./site-layout-routes.ts";

test("site chrome is hidden on immersive routes only", () => {
  assert.equal(isImmersiveRoute("/projects/editor"), true);
  assert.equal(isImmersiveRoute("/projects/preview/example"), true);
  assert.equal(isImmersiveRoute("/projects"), false);
  assert.equal(isImmersiveRoute("/settings"), false);
});

test("site footer renders the requested copyright notice", async () => {
  const source = await readFile(new URL("./site-footer.tsx", import.meta.url), "utf8");

  assert.match(source, /© 2026 GenStory\.cc 版权所有/);
  assert.match(source, /mailto:postor@gmail\.com/);
  assert.match(source, /postor@gmail\.com[\s\S]*<\/a>/);
  assert.match(source, /if \(isImmersiveRoute\(pathname\)\)/);
});

test("root layout mounts the footer after the page content", async () => {
  const source = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");

  const contentIndex = source.indexOf('<div className="flex-1">{children}</div>');
  const footerIndex = source.indexOf("<SiteFooter />");

  assert.notEqual(contentIndex, -1);
  assert.notEqual(footerIndex, -1);
  assert.ok(contentIndex < footerIndex);
});
