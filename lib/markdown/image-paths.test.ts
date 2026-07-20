import assert from "node:assert/strict";
import test from "node:test";

import {
  collectMarkdownImageSources,
  collectMarkdownMediaSources,
  mediaKindForSource,
  resolveMarkdownImagePath,
  resolveMarkdownMediaPath,
} from "./image-paths.ts";

test("collects project image sources from markdown and html", () => {
  assert.deepEqual(
    collectMarkdownImageSources(
      [
        "![forest](../../assets/illustrations/illus_forest.png)",
        "<img src=\"/assets/pages/page-001.webp\" alt=\"page\" />",
        "![remote](https://example.com/image.png)",
        "![data](data:image/png;base64,aaaa)",
      ].join("\n")
    ),
    ["../../assets/illustrations/illus_forest.png", "/assets/pages/page-001.webp"]

  );

});

test("collects project media sources from markdown images and links", () => {
  assert.deepEqual(
    collectMarkdownMediaSources(
      [
        "![forest](../../assets/illustrations/illus_forest.png)",
        "> 视频镜头：[森林镜头](../../../assets/videos/vid_forest.mp4)",
        "[theme](../../../assets/bgm/theme.mp3)",
        "[remote](https://example.com/video.mp4)",
      ].join("\n")
    ),
    [
      "../../assets/illustrations/illus_forest.png",
      "../../../assets/videos/vid_forest.mp4",
      "../../../assets/bgm/theme.mp3",
    ]

  );

});

test("resolves markdown-relative image paths inside the project", () => {
  assert.equal(
    resolveMarkdownImagePath(
      "chapter-001/pages/page-001.md",
      "../../assets/illustrations/illus_forest.png"

    ),
    "assets/illustrations/illus_forest.png"

  );
  assert.equal(
    resolveMarkdownImagePath("chapter-001/pages/page-001.md", "/assets/pages/page-001.png"),
    "assets/pages/page-001.png"

  );

});

test("resolves markdown-relative media paths inside the project", () => {
  assert.equal(
    resolveMarkdownMediaPath(
      "chapter-001/segments/segment-001/script.md",
      "../../../assets/videos/vid_forest.mp4"

    ),
    "assets/videos/vid_forest.mp4"

  );
  assert.equal(mediaKindForSource("../../../assets/videos/vid_forest.mp4"), "video");
  assert.equal(mediaKindForSource("../../../assets/bgm/theme.mp3"), "audio");
  assert.equal(mediaKindForSource("../../../assets/bgm/theme.ogg"), "audio");
  assert.equal(mediaKindForSource("../../../assets/videos/intro.ogv"), "video");

});

test("rejects sources outside project image files", () => {
  assert.equal(resolveMarkdownImagePath("chapter/page.md", "../../../secret.png"), null);
  assert.equal(resolveMarkdownImagePath("chapter/page.md", "https://example.com/a.png"), null);
  assert.equal(resolveMarkdownImagePath("chapter/page.md", "../notes.md"), null);

});
