import assert from "node:assert/strict";
import test from "node:test";

import { nextDefaultProjectTitle } from "./project-naming.ts";
import type { Project } from "./local-projects.ts";

function project(title: string, template: Project["template"]): Project {
  return {
    id: crypto.randomUUID(),
    template,
    title,
    lang: "zh",
    createdAt: 1,
    updatedAt: 1,
  };
}

test("creates a type based Chinese default project title with two digit sequence", () => {
  const title = nextDefaultProjectTitle("interactive-video", "zh", [
    project("新的互动视频-01", "interactive-video"),
    project("新的互动视频-02", "interactive-video"),
    project("新的漫画-01", "comic"),
  ]);

  assert.equal(title, "新的互动视频-03");
});

test("creates a type based English default project title", () => {
  const title = nextDefaultProjectTitle("visual-novel", "en", [
    project("New Visual Novel-01", "visual-novel"),
  ]);

  assert.equal(title, "New Visual Novel-02");
});
