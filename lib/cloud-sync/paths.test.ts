import assert from "node:assert/strict";
import test from "node:test";

import { cloudPathSegments, parseRemoteProjectPath, remoteProjectPath } from "./paths.ts";

const project = {
  id: "project-123",
  template: "visual-novel" as const,
  title: "A story",
  lang: "zh" as const,
  createdAt: 1,
  updatedAt: 2,
};

test("maps an OPFS project file to a stable cloud-relative path", () => {
  assert.equal(
    remoteProjectPath(project, "chapter-001/scenes/scene-001/script.md"),
    "visual-novel/project-123/chapter-001/scenes/scene-001/script.md"
  );
});

test("parses a cloud-relative path back to its project file", () => {
  assert.deepEqual(parseRemoteProjectPath("book/id-1/meta.md"), {
    template: "book",
    projectId: "id-1",
    filePath: "meta.md",
  });
});

test("rejects paths that cannot belong to a project", () => {
  assert.throws(() => parseRemoteProjectPath("meta.md"), /云端文件路径无效/);
  assert.deepEqual(cloudPathSegments("a/b/c"), ["a", "b", "c"]);
});
