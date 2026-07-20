import assert from "node:assert/strict";
import test from "node:test";

import { findUploadConflicts } from "./merge.ts";

test("upload conflict planning is based on full relative paths", () => {
  const conflicts = findUploadConflicts(
    [{ path: "book/a/meta.md", projectId: "a", blob: new Blob(["a"]) }],
    [
      { id: "remote-a", path: "book/a/meta.md" },
      { id: "remote-b", path: "book/b/meta.md" },
    ]
  );
  assert.deepEqual(conflicts.map((conflict) => conflict.path), ["book/a/meta.md"]);
});
