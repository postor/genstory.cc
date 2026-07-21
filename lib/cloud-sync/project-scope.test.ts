import assert from "node:assert/strict";
import test from "node:test";

import { filterRemoteFilesForProjects } from "./scope.ts";

test("filters cloud files to a selected project before download", () => {
  const filtered = filterRemoteFilesForProjects(
    [
      { id: "1", path: "book/target/meta.md" },
      { id: "2", path: "book/other/meta.md" },
      { id: "3", path: "comic/target/meta.md" },
      { id: "4", path: "not-a-project-file" },
    ],
    [{ id: "target" }]
  );

  assert.deepEqual(
    filtered.map((file) => file.path),
    ["book/target/meta.md", "comic/target/meta.md"]
  );
});
