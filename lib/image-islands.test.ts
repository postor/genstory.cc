import assert from "node:assert/strict";
import test from "node:test";

import {
  islandOutputPath,
  splitImageIslandsFromRgba,
} from "./image-islands.ts";

function rgba(width: number, height: number, pixels: number[][]): Uint8ClampedArray {
  assert.equal(pixels.length, width * height);
  const data = new Uint8ClampedArray(width * height * 4);
  pixels.forEach((pixel, index) => data.set(pixel, index * 4));
  return data;
}

test("turns the sampled background color transparent and crops disconnected islands", () => {
  const sea = [10, 20, 30, 255];
  const red = [200, 0, 0, 255];
  const blue = [0, 0, 200, 255];
  const result = splitImageIslandsFromRgba({
    width: 5,
    height: 4,
    data: rgba(5, 4, [
      sea, sea, sea, sea, sea,
      sea, red, red, sea, blue,
      sea, red, sea, sea, blue,
      sea, sea, sea, sea, sea,
    ]),
    padding: 1,
  });

  assert.equal(result.backgroundColor.hex, "#0a141e");
  assert.equal(result.islands.length, 2);
  assert.deepEqual(
    result.islands.map((island) => island.bounds),
    [
      { x: 0, y: 0, width: 4, height: 4 },
      { x: 3, y: 0, width: 2, height: 4 },
    ]
  );
  assert.deepEqual(
    result.islands.map((island) => island.landPixelCount),
    [3, 2]
  );
  assert.deepEqual(Array.from(result.islands[0].data.slice(0, 4)), [10, 20, 30, 0]);
});

test("filters tiny islands and creates source based output paths", () => {
  const sea = [0, 0, 0, 255];
  const land = [255, 255, 255, 255];
  const result = splitImageIslandsFromRgba({
    width: 4,
    height: 3,
    data: rgba(4, 3, [
      sea, sea, sea, sea,
      sea, land, sea, land,
      sea, land, sea, sea,
    ]),
    minIslandPixels: 2,
  });

  assert.equal(result.islands.length, 1);
  assert.equal(islandOutputPath("assets/characters/sheet.png", 1), "assets/characters/sheet-1.png");
  assert.equal(islandOutputPath("sheet", 2, "webp"), "sheet-2.webp");
});
