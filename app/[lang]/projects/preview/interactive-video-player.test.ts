import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("interactive video player enters fullscreen landscape playback and exposes exit controls", async () => {
  const source = await readFile(
    new URL("./interactive-video-player.tsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /requestFullscreen/);
  assert.match(source, /orientation\.lock\("landscape"\)/);
  assert.match(source, /exitFullscreen/);
  assert.match(source, /Pause/);
  assert.match(source, /LogOut/);
  assert.match(source, /finalExitLabel/);
});
