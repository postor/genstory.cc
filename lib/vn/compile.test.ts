import assert from "node:assert/strict";
import test from "node:test";

import { seedRedRidingHood } from "./seed.ts";
import { compileSceneStage } from "./stage-compile.ts";

test("compiled visual novel scenes clear previous fixed character slots before changing stage", async () => {
  const vn = seedRedRidingHood();
  const assetsById = new Map(vn.assets.map((asset) => [asset.id, asset]));
  const scene = vn.chapters[0].scenes[1];

  assert.deepEqual(compileSceneStage(scene, assetsById), [
    "changeFigure:none -left;",
    "changeFigure:none;",
    "changeFigure:none -right;",
    "changeBg:bg_grandma.png;",
    "changeFigure:wolf_proud.png -left;",
    "changeFigure:grandma_weak.png -right;",
  ]);
});
