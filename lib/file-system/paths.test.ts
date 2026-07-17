import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeRelativePath,
  projectRelativePath,
  type ProjectPath,
} from "./paths.ts";

test("normalizes relative file paths and removes harmless dot segments", () => {
  assert.equal(normalizeRelativePath("./chapter-001/../meta.md"), "meta.md");
  assert.equal(normalizeRelativePath("chapter-001\\scenes\\scene-001\\script.md"), "chapter-001/scenes/scene-001/script.md");
});

test("rejects absolute paths, traversal, and empty paths", () => {
  assert.throws(() => normalizeRelativePath("/meta.md"), /相对路径/);
  assert.throws(() => normalizeRelativePath("C:\\meta.md"), /相对路径/);
  assert.throws(() => normalizeRelativePath("../../meta.md"), /超出/);
  assert.throws(() => normalizeRelativePath(""), /非空/);
});

test("builds a stable project path from type and project id", () => {
  const path: ProjectPath = projectRelativePath("visual-novel", "project-123");
  assert.deepEqual(path, ["visual-novel", "project-123"]);
});

test("rejects path identity segments that can escape the project root", () => {
  assert.throws(() => projectRelativePath("../book", "project-123"), /单一路径段/);
  assert.throws(() => projectRelativePath("book", "../project-123"), /单一路径段/);
  assert.throws(() => projectRelativePath("book", "project/123"), /单一路径段/);
});
