import { mkdir, readFile as readNodeFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import JSZip from "jszip";
import mammoth from "mammoth";

import { readFile } from "../lib/file-system/browser.ts";
import { collectPreviewSectionMediaReferences } from "../lib/markdown/preview-media.ts";
import { parseProjectSourceZip } from "../lib/project-import.ts";
import { readProjectPreview } from "../lib/project-source.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceZipPath = resolve(
  repoRoot,
  "public/case-projects/book-jp-transfer-source.zip"
);
const includeBookImages = process.env.BOOK_DOCX_IMAGES !== "0";
const outputVariant = includeBookImages ? "images" : "no-images";
const outputDocxPath = resolve(
  repoRoot,
  `out/benchmark-book-case-mammoth-${outputVariant}.docx`
);
const outputHtmlPath = resolve(
  repoRoot,
  `out/benchmark-book-case-mammoth-${outputVariant}.html`
);
const logPath = resolve(
  repoRoot,
  `out/benchmark-book-docx-mammoth-${outputVariant}.log.jsonl`
);

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

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeXmlAttribute(value) {
  return escapeXml(value).replaceAll('"', "&quot;");
}

function plainMarkdownText(value) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_]/g, "")
    .trim();
}

function textParagraphXml(text, style) {
  const cleaned = plainMarkdownText(text);
  if (!cleaned) return "";
  const styleXml = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : "";
  const lines = cleaned.split("\n");
  const runs = lines
    .map((line, index) => {
      const breakXml = index === 0 ? "" : "<w:br/>";
      return `<w:r>${breakXml}<w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r>`;
    })
    .join("");
  return `<w:p>${styleXml}${runs}</w:p>`;
}

function imageParagraphXml(relationshipId, alt, imageIndex) {
  const cx = 3657600;
  const cy = 3657600;
  return `<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${imageIndex}" name="Picture ${imageIndex}" descr="${escapeXmlAttribute(
    alt
  )}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${imageIndex}" name="Picture ${imageIndex}" descr="${escapeXmlAttribute(
    alt
  )}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${relationshipId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

function appendBodyXml(paragraphs, markdown) {
  const tokenPattern = /!\[([^\]]*)\]\((<[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  for (const rawBlock of markdown.replaceAll("\r\n", "\n").split(/\n{2,}/)) {
    const block = rawBlock.trim();
    if (!block) continue;
    const heading = block.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      paragraphs.push({ kind: "text", text: heading[2], style: "Heading2" });
      continue;
    }
    let cursor = 0;
    for (const match of block.matchAll(tokenPattern)) {
      const start = match.index ?? 0;
      paragraphs.push({ kind: "text", text: block.slice(cursor, start) });
      paragraphs.push({
        kind: "image",
        source: match[2].replace(/^<|>$/g, ""),
        alt: match[1],
      });
      cursor = start + match[0].length;
    }
    paragraphs.push({ kind: "text", text: block.slice(cursor) });
  }
}

function addUtf8File(zip, path, content) {
  zip.file(path, new TextEncoder().encode(content));
}

async function buildDocxBuffer(root, preview) {
  const zip = new JSZip();
  const paragraphs = [{ kind: "text", text: preview.title, style: "Title" }];
  const relationships = [];
  let imageIndex = 0;

  for (const section of preview.sections) {
    paragraphs.push({ kind: "text", text: section.title, style: "Heading1" });
    const sectionParagraphs = [];
    appendBodyXml(sectionParagraphs, section.body);
    const references = collectPreviewSectionMediaReferences([section]);
    const referenceBySource = new Map(
      references.map((reference) => [reference.source, reference])
    );

    for (const paragraph of sectionParagraphs) {
      if (paragraph.kind !== "image") {
        paragraphs.push(paragraph);
        continue;
      }
      if (!includeBookImages) {
        paragraphs.push({
          kind: "text",
          text: paragraph.alt ? `[${paragraph.alt}]` : "",
        });
        continue;
      }
      const reference = referenceBySource.get(paragraph.source);
      if (!reference) {
        paragraphs.push({ kind: "text", text: `[${paragraph.alt}]` });
        continue;
      }
      try {
        const file = await readFile(root, reference.mediaPath);
        const extension = /\.jpe?g$/i.test(reference.mediaPath) ? "jpg" : "png";
        imageIndex += 1;
        const relationshipId = `rIdImage${imageIndex}`;
        const target = `media/image${imageIndex}.${extension}`;
        zip.file(`word/${target}`, new Uint8Array(await file.arrayBuffer()));
        relationships.push({
          id: relationshipId,
          target,
          type: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
        });
        paragraphs.push({
          kind: "image-relationship",
          relationshipId,
          alt: paragraph.alt,
          imageIndex,
        });
      } catch {
        paragraphs.push({ kind: "text", text: `[${paragraph.alt}]` });
      }
    }
  }

  const bodyXml = paragraphs
    .map((paragraph) => {
      if (paragraph.kind === "image-relationship") {
        return imageParagraphXml(
          paragraph.relationshipId,
          paragraph.alt,
          paragraph.imageIndex
        );
      }
      return textParagraphXml(paragraph.text, paragraph.style);
    })
    .join("");
  addUtf8File(
    zip,
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`
  );
  addUtf8File(
    zip,
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`
  );
  addUtf8File(
    zip,
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationships
      .map(
        (relationship) =>
          `<Relationship Id="${relationship.id}" Type="${relationship.type}" Target="${relationship.target}"/>`
      )
      .join("")}</Relationships>`
  );
  addUtf8File(
    zip,
    "word/styles.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/></w:style></w:styles>`
  );
  addUtf8File(
    zip,
    "word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${bodyXml}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1120" w:right="1080" w:bottom="1120" w:left="1080"/></w:sectPr></w:body></w:document>`
  );

  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

const scriptStartedAt = performance.now();
const sourceBytes = await readNodeFile(sourceZipPath);
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
    pipeline: "minimal-docx-to-mammoth-html",
  },
});

const docxStartedAt = performance.now();
const docxBuffer = await buildDocxBuffer(root, preview);
logEvent({
  phase: "docx.generated",
  elapsedMs: performance.now() - docxStartedAt,
  totalElapsedMs: performance.now() - scriptStartedAt,
  details: {
    bytes: docxBuffer.byteLength,
  },
});

const mammothStartedAt = performance.now();
const mammothResult = await mammoth.convertToHtml({ buffer: docxBuffer });
const mammothMessages = mammothResult.messages.map((message) => ({
  type: message.type,
  message: message.message,
}));
logEvent({
  phase: "mammoth.converted",
  elapsedMs: performance.now() - mammothStartedAt,
  totalElapsedMs: performance.now() - scriptStartedAt,
  details: {
    htmlChars: mammothResult.value.length,
    warnings: mammothResult.messages.length,
    warningMessages: mammothMessages,
  },
});

await mkdir(dirname(outputDocxPath), { recursive: true });
await writeFile(outputDocxPath, docxBuffer);
await writeFile(outputHtmlPath, mammothResult.value, "utf8");

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
    docxBytes: docxBuffer.byteLength,
    htmlChars: mammothResult.value.length,
    outputDocxPath,
    outputHtmlPath,
    logPath,
  },
});

await writeFile(logPath, `${events.map((event) => JSON.stringify(event)).join("\n")}\n`);
