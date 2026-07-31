import assert from "node:assert/strict";
import test from "node:test";



import {
  findProjectImportConflicts,
  parseBackupZip,
  parseProjectSourceZip,
} from "./project-import.ts";
import { zipStore } from "./vn/zip.ts";

test("imports a GenStory.cc source zip and infers its template", async () => {
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

test("recognizes a workspace backup and imports each project with its original id", async () => {
  const zip = await zipStore([
    {
      path: "genstory-workspace.json",
      blob: new Blob([
        JSON.stringify({
          version: 1,
          projects: [
            {
              id: "book-1",
              template: "book",
              title: "A Book",
              lang: "zh",
              createdAt: 100,
              updatedAt: 200,
            },
            {
              id: "vn-1",
              template: "visual-novel",
              title: "A VN",
              lang: "en",
              createdAt: 300,
              updatedAt: 400,
            },
          ],
        }),
      ]),
    },
    { path: "projects/book/book-1/AGENTS.md", blob: new Blob(["# Rules\n"]) },
    { path: "projects/book/book-1/meta.md", blob: new Blob(["# Wrong fallback\n"]) },
    { path: "projects/book/book-1/chapter-001/content.md", blob: new Blob(["Book"]) },
    { path: "projects/visual-novel/vn-1/AGENTS.md", blob: new Blob(["# Rules\n"]) },
    {
      path: "projects/visual-novel/vn-1/meta.md",
      blob: new Blob(["---\ntitle: \"A VN\"\ntype: visual-novel\n---\n"]),
    },
  ]);

  const imported = await parseBackupZip(zip);

  assert.equal(imported.kind, "workspace");
  assert.equal(imported.projects.length, 2);
  assert.deepEqual(
    imported.projects.map((project) => ({
      id: project.id,
      template: project.template,
      title: project.title,
      lang: project.lang,
    })),
    [
      { id: "book-1", template: "book", title: "A Book", lang: "zh" },
      { id: "vn-1", template: "visual-novel", title: "A VN", lang: "en" },
    ]
  );
  assert.deepEqual(
    imported.projects[0].files.map((file) => file.path).sort(),
    ["AGENTS.md", "chapter-001/content.md", "meta.md"]
  );
});

test("finds only incoming workspace projects whose ids already exist locally", () => {
  const incoming = [
    {
      id: "same",
      title: "Incoming",
      template: "book" as const,
      lang: "zh" as const,
      files: [],
    },
    {
      id: "new",
      title: "New",
      template: "comic" as const,
      lang: "zh" as const,
      files: [],
    },
  ];

  const conflicts = findProjectImportConflicts(incoming, [
    { id: "same" },
  ]);

  assert.deepEqual(conflicts.map((project) => project.id), ["same"]);
});
