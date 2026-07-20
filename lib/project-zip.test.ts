import assert from "node:assert/strict";
import test from "node:test";

import { buildSourceZip } from "./project-zip.ts";

test("builds a source ZIP from project file entries", async () => {
  const blob = await buildSourceZip([
    { path: "meta.md", blob: new Blob(["# Story"]) },
    { path: "chapter-001/script.md", blob: new Blob(["Hello"]) },
  ]);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const text = new TextDecoder().decode(bytes);

  assert.equal(blob.type, "application/zip");
  assert.match(text, /meta\.md/);
  assert.match(text, /chapter-001\/script\.md/);
});
