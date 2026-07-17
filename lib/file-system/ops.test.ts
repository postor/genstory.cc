import assert from "node:assert/strict";
import test from "node:test";

import {
  parentDirectoryPath,
  resolveNewEntryPath,
  uploadTargetDirectory,
} from "./ops.ts";

test("resolves upload target to the selected directory", () => {
  assert.equal(uploadTargetDirectory("assets/backgrounds", "directory"), "assets/backgrounds");
  assert.equal(uploadTargetDirectory("assets/backgrounds/bg.png", "file"), "assets/backgrounds");
  assert.equal(uploadTargetDirectory("AGENTS.md", "file"), "");
});

test("resolves a new entry below the selected folder or selected file parent", () => {
  assert.equal(resolveNewEntryPath("chapter-001", "directory", "notes.md"), "chapter-001/notes.md");
  assert.equal(resolveNewEntryPath("chapter-001/content.md", "file", "draft.md"), "chapter-001/draft.md");
});

test("rejects invalid entry names for new folders and files", () => {
  assert.throws(() => resolveNewEntryPath("chapter-001", "directory", "../bad"), /单一路径段/);
  assert.throws(() => resolveNewEntryPath("chapter-001", "directory", "bad/name"), /单一路径段/);
});

test("returns parent directory path without escaping root", () => {
  assert.equal(parentDirectoryPath("chapter-001/content.md"), "chapter-001");
  assert.equal(parentDirectoryPath("meta.md"), "");
});
