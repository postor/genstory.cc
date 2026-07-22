import assert from "node:assert/strict";
import test from "node:test";

import {
  buildInteractiveVideoProjectZip,
  buildInteractiveVideoStandaloneHtml,
} from "./export.ts";
import type { InteractiveVideoPreviewModel } from "./preview.ts";

type FakeEntry = FakeDirectory | FakeFile;

interface FakeFile {
  kind: "file";
  name: string;
  content: string;
  getFile(): Promise<File>;
}

interface FakeDirectory {
  kind: "directory";
  children: Map<string, FakeEntry>;
  getDirectoryHandle(name: string): Promise<FakeDirectory>;
  getFileHandle(name: string): Promise<FakeFile>;
  entries(): AsyncIterableIterator<[string, FakeEntry]>;
}

test("builds a standalone interactive video runtime with fullscreen controls and branch choices", () => {
  const model: InteractiveVideoPreviewModel = {
    type: "interactive-video",
    title: "Branch Film",
    startSegmentId: "start",
    assets: {
      intro: {
        id: "intro",
        type: "Video",
        name: "Intro",
        path: "assets/videos/intro.mp4",
      },
      ending: {
        id: "ending",
        type: "Video",
        name: "Ending",
        path: "assets/videos/ending.mp4",
      },
    },
    segments: [
      {
        id: "start",
        path: "chapter-001/segments/start/script.md",
        title: "Start",
        body: "",
        timeline: [
          { at: 0, videoId: "intro" },
          { at: 3, choiceId: "choice-a" },
        ],
        choices: [
          {
            id: "choice-a",
            prompt: "Pick one",
            options: [{ label: "Go", next: "end" }],
          },
        ],
      },
      {
        id: "end",
        path: "chapter-001/segments/end/script.md",
        title: "End",
        body: "",
        timeline: [{ at: 0, videoId: "ending" }],
        choices: [],
      },
    ],
  };

  const html = buildInteractiveVideoStandaloneHtml(model);

  assert.match(html, /requestFullscreen/);
  assert.match(html, /orientation\.lock\("landscape"\)/);
  assert.match(html, /exitFullscreen/);
  assert.match(html, /assets\/videos\/intro\.mp4/);
  assert.match(html, /Pick one/);
  assert.match(html, /Go/);
});

function fakeFile(name: string, content: string): FakeFile {
  return {
    kind: "file",
    name,
    content,
    async getFile() {
      return new File([content], name);
    },
  };
}

function fakeDirectory(): FakeDirectory {
  return {
    kind: "directory",
    children: new Map(),
    async getDirectoryHandle(name: string) {
      const entry = this.children.get(name);
      if (!entry || entry.kind !== "directory") {
        throw new DOMException("Not found", "NotFoundError");
      }
      return entry;
    },
    async getFileHandle(name: string) {
      const entry = this.children.get(name);
      if (!entry || entry.kind !== "file") {
        throw new DOMException("Not found", "NotFoundError");
      }
      return entry;
    },
    async *entries() {
      for (const entry of this.children.entries()) yield entry;
    },
  };
}

function fakeRoot(files: Record<string, string>): FileSystemDirectoryHandle {
  const root = fakeDirectory();
  for (const [path, content] of Object.entries(files)) {
    const parts = path.split("/");
    const filename = parts.pop();
    assert.ok(filename);
    let directory = root;
    for (const part of parts) {
      const existing = directory.children.get(part);
      if (existing) {
        assert.equal(existing.kind, "directory");
        directory = existing;
      } else {
        const next = fakeDirectory();
        directory.children.set(part, next);
        directory = next;
      }
    }
    directory.children.set(filename, fakeFile(filename, content));
  }
  return root as unknown as FileSystemDirectoryHandle;
}

test("builds a runnable interactive video zip with html and referenced assets", async () => {
  const root = fakeRoot({
    "meta.md": '---\ntitle: "Export Film"\ntype: interactive-video\n---\n',
    "assets/index.yml": [
      "assets:",
      "  - id: intro",
      "    type: Video",
      '    name: "Intro"',
      '    file: "videos/intro.mp4"',
    ].join("\n"),
    "assets/videos/intro.mp4": "fake-video",
    "chapter-001/segments/start/meta.md": '---\ntitle: "Start"\n---\n',
    "chapter-001/segments/start/script.md": "# Start",
    "chapter-001/segments/start/timeline.yml": [
      "timeline:",
      "  - at: 0",
      "    video: intro",
    ].join("\n"),
  });

  const zip = await buildInteractiveVideoProjectZip(root);
  const bytes = new Uint8Array(await zip.arrayBuffer());
  const text = new TextDecoder().decode(bytes);

  assert.match(text, /index\.html/);
  assert.match(text, /assets\/videos\/intro\.mp4/);
  assert.match(text, /requestFullscreen/);
});
