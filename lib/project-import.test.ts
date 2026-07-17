import assert from "node:assert/strict";
import test from "node:test";



import { parseProjectSourceZip } from "./project-import.ts";
import { zipStore } from "./vn/zip.ts";

test("imports a GenStory source zip and infers its template", async () => {
  const zip = await zipStore([
    {
      path: "AGENTS.md",
      blob: new Blob(["# Rules\n"]),
    },
    {
      path: "meta.md",
      blob: new Blob(["---\ntitle: \"Restored Story\"\ntype: visual-novel\n---\n"]),
    },
    {
      path: "chapter-001/scenes/scene-001/stage.yml",
      blob: new Blob(["background: forest\n"]),
    },
  ]);


  const imported = await parseProjectSourceZip(zip);


  assert.equal(imported.title, "Restored Story");
  assert.equal(imported.template, "visual-novel");
  assert.deepEqual(
    imported.files.map((file) => file.path).sort(),
    ["AGENTS.md", "chapter-001/scenes/scene-001/stage.yml", "meta.md"]

  );


});

test("rejects zip files without project metadata", async () => {
  const zip = await zipStore([
    {
      path: "notes.md",
      blob: new Blob(["missing metadata"]),
    },
  ]);


  await assert.rejects(parseProjectSourceZip(zip), /meta\.md/);
});
