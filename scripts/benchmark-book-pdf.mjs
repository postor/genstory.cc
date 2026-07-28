import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { parseProjectSourceZip } from "../lib/project-import.ts";
import { readProjectPreview } from "../lib/project-source.ts";
import { buildReadableProjectPdf } from "../lib/project-pdf.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceZipPath = resolve(
  repoRoot,
  "public/case-projects/book-jp-transfer-source.zip"
);
const fontPath = resolve(
  repoRoot,
  "public/fonts/noto-sans-sc-chinese-simplified-400-normal.woff"
);
const outputPath = resolve(repoRoot, "out/benchmark-book-case.pdf");
const logPath = resolve(repoRoot, "out/benchmark-book-case.log.jsonl");
const includeBookImages = process.env.BOOK_PDF_IMAGES !== "0";

function directoryEntry() {
  return {
    kind: "directory",
    children: new Map(),
    async *entries() {
      yield* this.children.entries();
    },
    async getDirectoryHandle(name) {
      const entry = this.children.get(name);
      if (!entry || entry.kind !== "directory") {
        throw new DOMException("Not found", "NotFoundError");
      }
      return entry;
    },
    async getFileHandle(name) {
      const entry = this.children.get(name);
      if (!entry || entry.kind !== "file") {
        throw new DOMException("Not found", "NotFoundError");
      }
      return entry;
    },
  };
}

function buildMemoryRoot(files) {
  const root = directoryEntry();
  for (const { path, blob } of files) {
    const parts = path.split("/");
    const filename = parts.pop();
    let directory = root;
    for (const part of parts) {
      let child = directory.children.get(part);
      if (!child) {
        child = directoryEntry();
        directory.children.set(part, child);
      }
      directory = child;
    }
    directory.children.set(filename, {
      kind: "file",
      async getFile() {
        return new File([blob], filename, {
          type: blob.type || "application/octet-stream",
          lastModified: 1,
        });
      },
    });
  }
  return root;
}

const events = [];

function logEvent(event) {
  events.push(event);
  process.stdout.write(`${JSON.stringify(event)}\n`);
}

const scriptStartedAt = performance.now();
const sourceBytes = await readFile(sourceZipPath);
const importStartedAt = performance.now();
const imported = await parseProjectSourceZip(new Blob([sourceBytes]));
const importFinishedAt = performance.now();
const root = buildMemoryRoot(imported.files);

const previewStartedAt = performance.now();
const preview = await readProjectPreview(root, "book");
const previewFinishedAt = performance.now();

logEvent({
  phase: "script.config",
  elapsedMs: performance.now() - scriptStartedAt,
  totalElapsedMs: performance.now() - scriptStartedAt,
  details: {
    includeBookImages,
    widthStrategy: "html-estimate-cache",
  },
});

const fontBytes = await readFile(fontPath);
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
  if (url === "/fonts/noto-sans-sc-chinese-simplified-400-normal.woff") {
    return new Response(fontBytes, {
      status: 200,
      headers: { "content-type": "font/woff" },
    });
  }
  return originalFetch(input, init);
};

try {
  const pdf = await buildReadableProjectPdf(root, preview, "zh", {
    includeBookImages,
    onLog: logEvent,
  });
  const pdfBytes = new Uint8Array(await pdf.arrayBuffer());
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, pdfBytes);

  logEvent({
    phase: "script.summary",
    elapsedMs: performance.now() - scriptStartedAt,
    totalElapsedMs: performance.now() - scriptStartedAt,
    details: {
      sourceZipBytes: sourceBytes.byteLength,
      importedFiles: imported.files.length,
      previewSections: preview.sections.length,
      previewChars: preview.sections.reduce(
        (total, section) => total + section.body.length,
        0
      ),
      importMs: importFinishedAt - importStartedAt,
      previewMs: previewFinishedAt - previewStartedAt,
      pdfBytes: pdfBytes.byteLength,
      outputPath,
      logPath,
    },
  });
} finally {
  globalThis.fetch = originalFetch;
  await writeFile(logPath, `${events.map((event) => JSON.stringify(event)).join("\n")}\n`);
}
