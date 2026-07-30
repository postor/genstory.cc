import assert from "node:assert/strict";
import test from "node:test";

import { readProjectPreview } from "./project-source.ts";

type FakeEntry = FakeDirectory | FakeFile;

interface FakeFile {
  kind: "file";
  content: string;
  getFile(): Promise<{
    size: number;
    lastModified: number;
    text(): Promise<string>;
  }>;
}

interface FakeDirectory {
  kind: "directory";
  children: Map<string, FakeEntry>;
  getDirectoryHandle(name: string): Promise<FakeDirectory>;
  getFileHandle(name: string): Promise<FakeFile>;
  entries(): AsyncIterableIterator<[string, FakeEntry]>;
}

function fakeFile(content: string): FakeFile {
  return {
    kind: "file",
    content,
    async getFile() {
      return {
        size: new TextEncoder().encode(content).byteLength,
        lastModified: 1,
        async text() {
          return content;
        },
      };
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
    directory.children.set(filename, fakeFile(content));
  }
  return root as unknown as FileSystemDirectoryHandle;
}

test("comic preview sections expose each rendered page image", async () => {
  const root = fakeRoot({
    "meta.md": "---\ntitle: \"小红帽\"\ntype: comic\n---\n# fallback",
    "chapter-001/pages/page-001/meta.md": "---\ntitle: \"第一页\"\n---\n",
    "chapter-001/pages/page-001/storyboard.md": "# Page fallback\n\n分镜文本",
    "chapter-001/pages/page-001/final.png": "fake-png",
  });

  const preview = await readProjectPreview(root, "comic");

  assert.equal(preview.title, "小红帽");
  assert.equal(preview.sections.length, 1);
  assert.equal(preview.sections[0].title, "第一页");
  assert.equal(
    preview.sections[0].pageImagePath,
    "chapter-001/pages/page-001/final.png"
  );
});

test("comic preview includes rendered pages without storyboard files", async () => {
  const root = fakeRoot({
    "meta.md": "---\ntitle: \"新的漫画\"\ntype: comic\n---\n",
    "chapter-001/pages/page-001/meta.md": "---\ntitle: \"第一页\"\n---\n",
    "chapter-001/pages/page-001/storyboard.md": "# Page One\n\n分镜文本",
    "chapter-001/pages/page-001/final.png": "fake-png-1",
    "chapter-002/pages/page-001/final.png": "fake-png-2",
  });

  const preview = await readProjectPreview(root, "comic");

  assert.equal(preview.sections.length, 2);
  assert.equal(
    preview.sections[1].pageImagePath,
    "chapter-002/pages/page-001/final.png"
  );
});

test("legacy comic script files still produce preview sections", async () => {
  const root = fakeRoot({
    "meta.md": "---\ntitle: \"Old Comic\"\ntype: comic\n---\n",
    "chapter-001/pages/page-001/meta.md": "---\ntitle: \"Page One\"\n---\n",
    "chapter-001/pages/page-001/script.md": "# Page One Script\n\nLegacy body",
  });

  const preview = await readProjectPreview(root, "comic");

  assert.equal(preview.sections.length, 1);
  assert.equal(preview.sections[0].path, "chapter-001/pages/page-001/script.md");
  assert.equal(preview.sections[0].pageImagePath, undefined);
});

test("picture-book preview resolves logical image and voice assets", async () => {
  const root = fakeRoot({
    "meta.md": "---\ntitle: \"小红帽绘本\"\ntype: picture-book\n---\n",
    "assets/index.yml": "assets:\n  - id: page_image\n    type: Image\n    file: assets/pages/page-001.png\n  - id: page_voice\n    type: Voice\n    file: assets/voice/page-001.mp3\n",
    "chapter-001/pages/page-001/meta.md": "---\ntitle: \"森林小径\"\n---\n",
    "chapter-001/pages/page-001/story.md": "---\ntitle: \"森林小径\"\nimage_asset: page_image\nvoice_asset: page_voice\nlayout: landscape\n---\n\n# 森林小径\n\n小红帽出发了。",
    "assets/pages/page-001.png": "fake-png",
    "assets/voice/page-001.mp3": "fake-mp3",
  });

  const preview = await readProjectPreview(root, "picture-book");

  assert.equal(preview.sections.length, 1);
  assert.equal(preview.sections[0].pageImagePath, "assets/pages/page-001.png");
  assert.equal(preview.sections[0].pageVoicePath, "assets/voice/page-001.mp3");
  assert.equal(preview.sections[0].layout, "landscape");
});
