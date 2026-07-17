import test from "node:test";
import assert from "node:assert/strict";

import { seedRedRidingHood } from "./seed.ts";
import { buildVNProjectFiles } from "./project-files.ts";

test("builds an OpenWebGal source tree without a title.md project file", () => {
  const vn = seedRedRidingHood();
  const files = buildVNProjectFiles(vn, "# AGENTS.md\n\nKeep canon consistent.");
  const paths = files.map((file) => file.path);

  assert.deepEqual(paths.slice(0, 4), [
    "AGENTS.md",
    "meta.md",
    "assets/index.yml",
    "chapter-001/meta.md",
  ]);
  assert.ok(paths.includes("chapter-001/scenes/scene-001/script.md"));
  assert.ok(paths.includes("chapter-001/scenes/scene-001/stage.yml"));
  assert.ok(!paths.some((path) => path.endsWith("小红帽.md")));
});

test("uses structured scene data as the editable source", () => {
  const vn = seedRedRidingHood();
  const files = buildVNProjectFiles(vn, "# AGENTS.md");
  const script = files.find(
    (file) => file.path === "chapter-001/scenes/scene-001/script.md"
  );
  assert.match(script?.content ?? "", /小红帽: 终于可以出门啦/);
});
