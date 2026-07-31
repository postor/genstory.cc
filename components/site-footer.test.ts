import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  isImmersiveRoute,
  shouldShowSiteContentBackground,
} from "./site-layout-routes.ts";

test("site chrome is hidden on immersive routes only", () => {
  assert.equal(isImmersiveRoute("/projects/editor"), true);
  assert.equal(isImmersiveRoute("/projects/preview/example"), true);
  assert.equal(isImmersiveRoute("/projects"), false);
  assert.equal(isImmersiveRoute("/settings"), false);
});

test("site content background is limited to non-home, non-immersive routes", () => {
  assert.equal(shouldShowSiteContentBackground("/"), false);
  assert.equal(shouldShowSiteContentBackground("/zh"), false);
  assert.equal(shouldShowSiteContentBackground("/projects/editor"), false);
  assert.equal(shouldShowSiteContentBackground("/projects/preview/example"), false);
  assert.equal(shouldShowSiteContentBackground("/projects"), true);
  assert.equal(shouldShowSiteContentBackground("/settings"), true);
  assert.equal(shouldShowSiteContentBackground("/zh/types"), true);
});

test("site footer renders the requested copyright notice", async () => {
  const source = await readFile(new URL("./site-footer.tsx", import.meta.url), "utf8");

  assert.match(source, /© 2026 GenStory\.cc/);
  assert.match(source, /lang === "zh" \? "版权所有" : "All rights reserved"/);
  assert.match(source, /mailto:postor@gmail\.com/);
  assert.match(source, /postor@gmail\.com[\s\S]*<\/a>/);
  assert.match(source, /if \(isImmersiveRoute\(pathname\)\)/);
});

test("root layout mounts the footer after the page content", async () => {
  const source = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");

  const contentIndex = source.indexOf("<SiteContent>{children}</SiteContent>");
  const footerIndex = source.indexOf("<SiteFooter />");

  assert.notEqual(contentIndex, -1);
  assert.notEqual(footerIndex, -1);
  assert.ok(contentIndex < footerIndex);
});
