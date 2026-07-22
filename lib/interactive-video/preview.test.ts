import assert from "node:assert/strict";
import test from "node:test";

import { parseInteractiveVideoSource } from "./preview.ts";

test("parses a start segment, its choice point, and playable branch targets", () => {
  const model = parseInteractiveVideoSource({
    "meta.md": '---\ntitle: "森林里的选择"\ntype: interactive-video\n---\n',
    "assets/index.yml": [
      "assets:",
      "  - id: vid_start",
      "    type: Video",
      '    name: "起始视频"',
      '    file: "videos/start.mp4"',
      "  - id: vid_branch",
      "    type: Video",
      '    name: "分支视频"',
      '    file: "videos/branch.mp4"',
    ].join("\n"),
    "chapter-001/segments/start/meta.md": '---\ntitle: "开始"\n---\n',
    "chapter-001/segments/start/script.md": "# 开始\n\n先播放起始视频。",
    "chapter-001/segments/start/timeline.yml": [
      "timeline:",
      "  - at: 0",
      "    video: vid_start",
      "    caption: 开始播放",
      "  - at: 4",
      "    choice: choose_path",
    ].join("\n"),
    "chapter-001/segments/start/choices.yml": [
      "choices:",
      "  - id: choose_path",
      '    prompt: "你要走哪条路？"',
      "    options:",
      '      - label: "走森林小路"',
      "        next: forest-path",
      '      - label: "走河边大路"',
      "        next: river-road",
    ].join("\n"),
    "chapter-001/segments/forest-path/meta.md": '---\ntitle: "森林小路"\n---\n',
    "chapter-001/segments/forest-path/script.md": "# 森林小路\n\n进入森林。",
    "chapter-001/segments/forest-path/timeline.yml": [
      "timeline:",
      "  - at: 0",
      "    video: vid_branch",
    ].join("\n"),
  });

  assert.equal(model.title, "森林里的选择");
  assert.equal(model.startSegmentId, "start");
  const start = model.segments.find((segment) => segment.id === model.startSegmentId);
  const branch = model.segments.find((segment) => segment.id === "forest-path");
  assert.ok(start);
  assert.ok(branch);
  assert.equal(start.timeline[1].choiceId, "choose_path");
  assert.deepEqual(start.choices[0].options, [
    { label: "走森林小路", next: "forest-path" },
    { label: "走河边大路", next: "river-road" },
  ]);
  assert.equal(model.assets.vid_start.path, "assets/videos/start.mp4");
  assert.equal(branch.timeline[0].videoId, "vid_branch");
});
