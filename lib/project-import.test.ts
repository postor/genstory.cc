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

test("imports a Phaser source zip by its project metadata", async () => {
  const zip = await zipStore([
    { path: "AGENTS.md", blob: new Blob(["# Rules\n"]) },
    {
      path: "meta.md",
      blob: new Blob(['---\ntitle: "Arcade"\ntype: phaser-game\n---\n']),
    },
    { path: "index.html", blob: new Blob(["<!doctype html>"]) },
    { path: "src/scenes/menu-scene.js", blob: new Blob(["class MenuScene {}\n"]) },
  ]);

  const imported = await parseProjectSourceZip(zip);

  assert.equal(imported.template, "phaser-game");
  assert.equal(imported.title, "Arcade");
});
