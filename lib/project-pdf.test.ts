import assert from "node:assert/strict";
import { inflateSync } from "node:zlib";
import test from "node:test";

import { PDFDocument, PDFName, PDFRawStream } from "pdf-lib";

import {
  buildReadableProjectPdf,
  createBookCharacterWidthCache,
} from "./project-pdf.ts";
import type { ReadableProjectPdfLogEvent } from "./project-pdf.ts";
import type { ProjectPreviewModel } from "./project-source.ts";

type FakeEntry = FakeDirectory | FakeFile;

interface FakeFile {
  kind: "file";
  blob: Blob;
  getFile(): Promise<File>;
}

interface FakeDirectory {
  kind: "directory";
  children: Map<string, FakeEntry>;
  getDirectoryHandle(name: string): Promise<FakeDirectory>;
  getFileHandle(name: string): Promise<FakeFile>;
}

function fakeFile(blob: Blob): FakeFile {
  return {
    kind: "file",
    blob,
    async getFile() {
      return new File([blob], "asset", { type: blob.type, lastModified: 1 });
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
  };
}

function fakeRoot(files: Record<string, Blob>): FileSystemDirectoryHandle {
  const root = fakeDirectory();
  for (const [path, blob] of Object.entries(files)) {
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
    directory.children.set(filename, fakeFile(blob));
  }
  return root as unknown as FileSystemDirectoryHandle;
}

function emptyRoot(): FileSystemDirectoryHandle {
  return fakeRoot({});
}

async function pdfBytes(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer());
}

function decodePdfName(value: string): string {
  return value.replace(/#([0-9A-Fa-f]{2})/g, (_, hex: string) =>
    String.fromCharCode(Number.parseInt(hex, 16))
  );
}

function streamContents(stream: PDFRawStream): string {
  const filter = stream.dict.get(PDFName.of("Filter"))?.toString();
  const bytes = stream.getContents();
  const decoded = filter === "/FlateDecode" ? inflateSync(bytes) : bytes;
  return new TextDecoder("latin1").decode(decoded);
}

function decodeHexTextFragments(value: string): string {
  let decoded = "";
  for (const match of value.matchAll(/<([0-9A-Fa-f]+)>/g)) {
    const bytes = Uint8Array.from(
      match[1].match(/[0-9A-Fa-f]{2}/g)?.map((hex) => Number.parseInt(hex, 16)) ??
        []
    );
    decoded += new TextDecoder("latin1").decode(bytes);
    if (bytes.byteLength % 2 === 0) {
      for (let index = 0; index < bytes.byteLength; index += 2) {
        decoded += String.fromCharCode((bytes[index] << 8) | bytes[index + 1]);
      }
    }
  }
  return decoded;
}

async function loadedPdfResources(blob: Blob): Promise<{
  pageCount: number;
  xObjectNames: string[];
  contentText: string;
  decodedText: string;
}> {
  const document = await PDFDocument.load(await pdfBytes(blob));
  const xObjectNames: string[] = [];
  const contentParts: string[] = [];

  for (const page of document.getPages()) {
    const xObjects = page.node.Resources()?.lookup(PDFName.of("XObject"));
    if (xObjects && "keys" in xObjects && typeof xObjects.keys === "function") {
      for (const key of xObjects.keys()) xObjectNames.push(decodePdfName(key.toString()));
    }

    const contentStreams = page.node.Contents();
    if (contentStreams instanceof PDFRawStream) {
      contentParts.push(streamContents(contentStreams));
    } else if (
      contentStreams &&
      "asArray" in contentStreams &&
      typeof contentStreams.asArray === "function"
    ) {
      for (const ref of contentStreams.asArray()) {
        const stream = document.context.lookup(ref);
        if (stream instanceof PDFRawStream) {
          contentParts.push(streamContents(stream));
        }
      }
    }
  }

  return {
    pageCount: document.getPageCount(),
    xObjectNames,
    contentText: contentParts.join("\n"),
    decodedText: decodeHexTextFragments(contentParts.join("\n")),
  };
}

test("estimates character width by character and font size without font measurement", () => {
  const width = createBookCharacterWidthCache();
  const a11 = width("A", 11);
  const a11Again = width("A", 11);
  const cjk11 = width("界", 11);
  const space11 = width(" ", 11);
  const a12 = width("A", 12);

  assert.equal(a11, a11Again);
  assert.ok(cjk11 > a11);
  assert.ok(space11 < a11);
  assert.ok(a12 > a11);
  assert.deepEqual(width.getStats(), {
    hits: 1,
    misses: 4,
    entries: 4,
    measureMs: 0,
  });
});

test("book PDF reports structured phase timings through an optional logger", async () => {
  const events: ReadableProjectPdfLogEvent[] = [];
  const model: ProjectPreviewModel = {
    type: "book",
    title: "Logged Book",
    sections: [
      {
        path: "chapter-001/content.md",
        title: "Chapter One",
        body: "Logged text.",
      },
    ],
  };

  await buildReadableProjectPdf(emptyRoot(), model, "en", {
    onLog: (event) => events.push(event),
  });

  const phases = events.map((event) => event.phase);
  assert.ok(phases.includes("book.font-embedded"));
  assert.ok(phases.includes("book.section"));
  assert.ok(phases.includes("book.pdf-flushed"));
  assert.ok(phases.includes("book.pdf-saved"));
  assert.ok(events.every((event) => Number.isFinite(event.elapsedMs)));
});

test("book PDF batches consecutive text lines into fewer drawText calls", async () => {
  const events: ReadableProjectPdfLogEvent[] = [];
  const model: ProjectPreviewModel = {
    type: "book",
    title: "Batched Book",
    sections: [
      {
        path: "chapter-001/content.md",
        title: "Chapter One",
        body: Array.from(
          { length: 20 },
          (_, index) => `Line ${index + 1} keeps selectable text in the same drawing batch.`
        ).join("\n"),
      },
    ],
  };

  await buildReadableProjectPdf(emptyRoot(), model, "en", {
    onLog: (event) => events.push(event),
  });

  const sectionEvent = events.find((event) => event.phase === "book.section");
  assert.ok(Number(sectionEvent?.details?.drawTextCalls) <= 5);
});

test("book PDF uses text drawing instead of canvas page images", async () => {
  const originalDocument = globalThis.document;
  const model: ProjectPreviewModel = {
    type: "book",
    title: "Readable Book",
    sections: [
      {
        path: "chapter-001/content.md",
        title: "Chapter One",
        body: "# Opening\n\nSelectable text stays selectable.",
      },
    ],
  };

  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement() {
        throw new Error("book PDF export must not create canvas render surfaces");
      },
    },
  });

  try {
    const blob = await buildReadableProjectPdf(emptyRoot(), model, "en");
    const resources = await loadedPdfResources(blob);

    assert.equal(blob.type, "application/pdf");
    assert.equal(resources.pageCount, 1);
    assert.deepEqual(resources.xObjectNames, []);
    assert.match(resources.contentText, /\bT[Jj]\b/);
    assert.ok(resources.decodedText.includes("Selectable text stays selectable."));
  } finally {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: originalDocument,
    });
  }
});

test("book PDF embeds referenced images without turning surrounding text into page screenshots", async () => {
  const png = Uint8Array.from(
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR42mP8z8BQDwAFgwJ/lz9Z4wAAAABJRU5ErkJggg==",
      "base64"
    )
  );
  const root = fakeRoot({
    "chapter-001/illustrations/scene-001.png": new Blob([png], {
      type: "image/png",
    }),
  });
  const model: ProjectPreviewModel = {
    type: "book",
    title: "Illustrated Book",
    sections: [
      {
        path: "chapter-001/content.md",
        title: "Chapter One",
        body: "Text before image.\n\n![Forest](illustrations/scene-001.png)\n\nText after image.",
      },
    ],
  };

  const blob = await buildReadableProjectPdf(root, model, "en");
  const resources = await loadedPdfResources(blob);

  assert.ok(resources.decodedText.includes("Text before image."));
  assert.ok(resources.decodedText.includes("Text after image."));
  assert.ok(resources.xObjectNames.length > 0);
});

test("book PDF can skip image asset reads for diagnostic fast paths", async () => {
  let imageReadAttempts = 0;
  const root = {
    async getDirectoryHandle() {
      imageReadAttempts += 1;
      throw new Error("image read should be skipped");
    },
  } as unknown as FileSystemDirectoryHandle;
  const model: ProjectPreviewModel = {
    type: "book",
    title: "Text Only Book",
    sections: [
      {
        path: "chapter-001/content.md",
        title: "Chapter One",
        body: "Text only export.\n\n![Skipped](illustrations/scene-001.png)",
      },
    ],
  };

  const blob = await buildReadableProjectPdf(root, model, "en", {
    includeBookImages: false,
  });
  const resources = await loadedPdfResources(blob);

  assert.equal(imageReadAttempts, 0);
  assert.deepEqual(resources.xObjectNames, []);
  assert.ok(resources.decodedText.includes("[Skipped]"));
});

test("comic PDF embeds rendered page images without creating DOM render surfaces", async () => {
  const originalDocument = globalThis.document;
  const png = Uint8Array.from(
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR42mP8z8BQDwAFgwJ/lz9Z4wAAAABJRU5ErkJggg==",
      "base64"
    )
  );
  const root = fakeRoot({
    "chapter-001/pages/page-001/final.png": new Blob([png], {
      type: "image/png",
    }),
  });
  const model: ProjectPreviewModel = {
    type: "comic",
    title: "Direct Comic",
    sections: [
      {
        path: "chapter-001/pages/page-001/storyboard.md",
        title: "Page One",
        body: "Storyboard text should not be screenshot for rendered pages.",
        pageImagePath: "chapter-001/pages/page-001/final.png",
      },
    ],
  };

  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement() {
        throw new Error("comic PDF export must not create canvas render surfaces");
      },
    },
  });

  try {
    const blob = await buildReadableProjectPdf(root, model, "en");
    const resources = await loadedPdfResources(blob);

    assert.equal(blob.type, "application/pdf");
    assert.equal(resources.pageCount, 1);
    assert.ok(resources.xObjectNames.length > 0);
  } finally {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: originalDocument,
    });
  }
});
