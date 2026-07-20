import assert from "node:assert/strict";
import test from "node:test";

import { buildPhaserPreviewHtml, buildPhaserStandaloneHtml } from "./preview.ts";

test("builds a runnable Phaser preview with local runtime and both scenes", () => {
  const html = buildPhaserPreviewHtml(
    {
      "index.html": `<!doctype html><html><head><title>Demo</title></head><body><div id="game"></div><script src="https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js"></script><script src="src/scenes/menu-scene.js"></script><script src="src/scenes/test-game-scene.js"></script><script src="src/main.js"></script></body></html>`,
      "src/scenes/menu-scene.js": "class MenuScene extends Phaser.Scene { constructor() { super('MenuScene'); } }",
      "src/scenes/test-game-scene.js": "class TestGameScene extends Phaser.Scene { constructor() { super('TestGameScene'); } }",
      "src/main.js": "new Phaser.Game({ scene: [MenuScene, TestGameScene] });",
    },
    "Phaser Demo"
  );

  assert.match(html, /src="\/phaser\/phaser\.min\.js"/);
  assert.match(html, /class MenuScene extends Phaser\.Scene/);
  assert.match(html, /class TestGameScene extends Phaser\.Scene/);
  assert.match(html, /new Phaser\.Game\(\{ scene: \[MenuScene, TestGameScene\] \}\)/);
  assert.match(html, /<title>Phaser Demo<\/title>/);
  assert.equal(html.includes("src=\"src/scenes/menu-scene.js\""), false);
});

test("rewrites the runtime path for a standalone Phaser export", () => {
  const html = buildPhaserStandaloneHtml(
    '<script src="/phaser/phaser.min.js"></script><script src="src/main.js"></script>'
  );

  assert.match(html, /src="vendor\/phaser\.min\.js"/);
  assert.match(html, /src="src\/main\.js"/);
});
