import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  languageInfo,
  localizedSiteMetadata,
  publicHomeCopy,
  publicTopicChrome,
} from "./platform-i18n.ts";
import { publicLanguages } from "./seo.ts";

test("platform language registries cover every public language", () => {
  for (const lang of publicLanguages) {
    assert.ok(languageInfo[lang]);
    assert.ok(localizedSiteMetadata[lang]);
    assert.ok(publicHomeCopy[lang]);
    assert.ok(publicTopicChrome[lang]);
  }
});

test("public platform pages use language registries instead of inline zh/en ternaries", async () => {
  const files = [
    new URL("../app/[lang]/page.tsx", import.meta.url),
    new URL("../app/[lang]/[slug]/page.tsx", import.meta.url),
    new URL("../components/public-topic-page.tsx", import.meta.url),
    new URL("../components/public-home-page.tsx", import.meta.url),
    new URL("./project-naming.ts", import.meta.url),
  ];

  const sources = await Promise.all(files.map((file) => readFile(file, "utf8")));
  for (const source of sources) {
    assert.doesNotMatch(source, /lang\s*===\s*"zh"\s*\?/);
    assert.doesNotMatch(source, /isZh\s*\?/);
  }
});
