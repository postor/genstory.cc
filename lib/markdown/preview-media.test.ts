import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error TS5097: required by the native Node test runner.
import { collectPreviewSectionMediaReferences } from "./preview-media.ts";

test("resolves markdown media against each preview section path", () => {
  assert.deepEqual(
    collectPreviewSectionMediaReferences([
      {
        path: "chapter-001/pages/page-001/storyboard.md",
        body: [
          "![panel](./images/panel-001.png)",
          "[theme](../../../assets/bgm/theme.mp3)",
        ].join("\n"),
      },
      {
        path: "chapter-002/pages/page-003/storyboard.md",
        body: "![panel](./images/panel-001.png)",
      },
    ]),
    [
      {
        sectionPath: "chapter-001/pages/page-001/storyboard.md",
        source: "./images/panel-001.png",
        mediaPath: "chapter-001/pages/page-001/images/panel-001.png",
        kind: "image",
      },
      {
        sectionPath: "chapter-001/pages/page-001/storyboard.md",
        source: "../../../assets/bgm/theme.mp3",
        mediaPath: "assets/bgm/theme.mp3",
        kind: "audio",
      },
      {
        sectionPath: "chapter-002/pages/page-003/storyboard.md",
        source: "./images/panel-001.png",
        mediaPath: "chapter-002/pages/page-003/images/panel-001.png",
        kind: "image",
      },
    ]
  );
});
