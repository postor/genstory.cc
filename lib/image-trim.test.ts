import assert from "node:assert/strict";
import test from "node:test";

import {
  trimImageBackgroundFromRgba,
  trimmedOutputPath,
} from "./image-islands.ts";

function rgba(width: number, height: number, pixels: number[][]): Uint8ClampedArray {
  assert.equal(pixels.length, width * height);
  const data = new Uint8ClampedArray(width * height * 4);
  pixels.forEach((pixel, index) => data.set(pixel, index * 4));
  return data;
}

test("turns the sampled background color transparent and crops the outer transparent border", () => {
  const sea = [12, 24, 36, 255];
  const red = [220, 20, 60, 255];
  const green = [10, 180, 40, 255];

  const result = trimImageBackgroundFromRgba({
    width: 5,
    height: 4,
    data: rgba(5, 4, [
      sea, sea, sea, sea, sea,
      sea, red, red, green, sea,
      sea, red, sea, green, sea,
      sea, sea, sea, sea, sea,
    ]),
  });

  assert.equal(result.backgroundColor.hex, "#0c1824");
  assert.ok(result.trimmed);
  assert.deepEqual(result.trimmed.bounds, { x: 1, y: 1, width: 3, height: 2 });
  assert.equal(result.trimmed.visiblePixelCount, 5);
  assert.deepEqual(Array.from(result.trimmed.data.slice(12, 16)), [220, 20, 60, 255]);
  assert.deepEqual(Array.from(result.trimmed.data.slice(16, 20)), [12, 24, 36, 0]);
});

test("returns no trimmed image when the whole image is background", () => {
  const sea = [30, 40, 50, 255];
  const result = trimImageBackgroundFromRgba({
    width: 2,
    height: 2,
    data: rgba(2, 2, [sea, sea, sea, sea]),
  });

  assert.equal(result.trimmed, null);
});

test("creates a trim output path beside the source image", () => {
  assert.equal(trimmedOutputPath("assets/hero.jpg"), "assets/hero-trim.png");
  assert.equal(trimmedOutputPath("assets/hero.webp"), "assets/hero-trim.webp");
  assert.equal(trimmedOutputPath("hero"), "hero-trim.png");
});
