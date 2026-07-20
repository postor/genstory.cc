import assert from "node:assert/strict";
import test from "node:test";

import { findDownloadConflicts, findUploadConflicts } from "./merge.ts";

test("finds exact local conflicts before downloading into OPFS", async () => {
  const remote = [{ id: "1", path: "book/p/meta.md" }];
  const conflicts = await findDownloadConflicts(
    remote,
    new Map([["book/p/meta.md", new Blob(["remote"])]]),
    new Map([
      [
        "book/p/meta.md",
        { path: "meta.md", projectId: "p", blob: new Blob(["local"]) },
      ],
    ])
  );
  assert.deepEqual(conflicts.map((item) => item.path), ["book/p/meta.md"]);
});

test("does not flag identical bytes as a download conflict", async () => {
  const conflicts = await findDownloadConflicts(
    [{ id: "1", path: "book/p/meta.md" }],
    new Map([["book/p/meta.md", new Blob(["same"])]]),
    new Map([
      [
        "book/p/meta.md",
        { path: "meta.md", projectId: "p", blob: new Blob(["same"]) },
      ],
    ])
  );
  assert.equal(conflicts.length, 0);
});

test("finds same-path files that upload would replace remotely", () => {
  const conflicts = findUploadConflicts(
    [
      { path: "book/p/meta.md", projectId: "p", blob: new Blob(["local"]) },
      { path: "book/p/new.md", projectId: "p", blob: new Blob(["new"]) },
    ],
    [{ id: "1", path: "book/p/meta.md" }]
  );
  assert.deepEqual(conflicts.map((item) => item.path), ["book/p/meta.md"]);
});
