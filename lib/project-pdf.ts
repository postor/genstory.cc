import type { Lang } from "./i18n.ts";
import { readFile } from "./file-system/browser.ts";
import { collectPreviewSectionMediaReferences } from "./markdown/preview-media.ts";
import type {
  ProjectPreviewModel,
  ProjectPreviewSection,
} from "./project-source.ts";

export const PDF_SITE_URL = "https://www.genstory.cc";

export interface ReadableProjectPdfOptions {
  includeBookImages?: boolean;
  onLog?: (event: ReadableProjectPdfLogEvent) => void;
}

export interface ReadableProjectPdfLogEvent {
  phase: string;
  elapsedMs: number;
  totalElapsedMs: number;
  details?: Record<string, boolean | number | string | null>;
}

export function pdfFooterText(lang: Lang): string {
  return lang === "zh"
    ? "使用 www.genstory.cc 生成"
    : "Created with www.genstory.cc";
}

export function pdfShareText(title: string, lang: Lang): string {
  return lang === "zh"
    ? `《${title}》使用 www.genstory.cc 生成`
    : `${title} — Created with www.genstory.cc`;
}

function clockNow(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function createPdfLogEmitter(
  sink: ReadableProjectPdfOptions["onLog"]
): {
  startedAt: number;
  emit: (
    phase: string,
    phaseStartedAt: number,
    details?: Record<string, boolean | number | string | null>
  ) => void;
} {
  const startedAt = clockNow();
  return {
    startedAt,
    emit: (phase, phaseStartedAt, details) => {
      if (!sink) return;
      try {
        sink({
          phase,
          elapsedMs: Math.max(0, clockNow() - phaseStartedAt),
          totalElapsedMs: Math.max(0, clockNow() - startedAt),
          details,
        });
      } catch {
        /* Diagnostics must never interrupt an export. */
      }
    },
  };
}

function safeFilename(value: string): string {
  return value.trim().replace(/[\\/:*?"<>|]+/g, "-") || "project";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}

function inlineMarkdownToHtml(
  value: string,
  mediaUrls: Record<string, string>
): string {
  const tokenPattern =
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let html = "";
  let cursor = 0;

  for (const match of value.matchAll(tokenPattern)) {
    const start = match.index ?? 0;
    html += escapeHtml(value.slice(cursor, start));
    if (match[1] !== undefined) {
      const source = mediaUrls[match[2]] ?? match[2];
      html += `<img src="${escapeAttribute(source)}" alt="${escapeAttribute(match[1])}"${
        match[3] ? ` title="${escapeAttribute(match[3])}"` : ""
      }>`;
    } else {
      html += `<a href="${escapeAttribute(match[5])}">${escapeHtml(match[4])}</a>`;
    }
    cursor = start + match[0].length;
  }

  return html + escapeHtml(value.slice(cursor));
}

function markdownToHtml(
  markdown: string,
  mediaUrls: Record<string, string>
): string {
  const blocks = markdown.replaceAll("\r\n", "\n").split(/\n{2,}/);
  return blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";

      const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
      if (heading) {
        return `<h${heading[1].length}>${inlineMarkdownToHtml(heading[2], mediaUrls)}</h${heading[1].length}>`;
      }

      const lines = trimmed.split("\n");
      if (lines.every((line) => /^[-*]\s+/.test(line))) {
        return `<ul>${lines
          .map((line) => `<li>${inlineMarkdownToHtml(line.replace(/^[-*]\s+/, ""), mediaUrls)}</li>`)
          .join("")}</ul>`;
      }

      if (lines.every((line) => /^>\s?/.test(line))) {
        return `<blockquote>${lines
          .map((line) => inlineMarkdownToHtml(line.replace(/^>\s?/, ""), mediaUrls))
          .join("<br>")}</blockquote>`;
      }

      return `<p>${lines.map((line) => inlineMarkdownToHtml(line, mediaUrls)).join("<br>")}</p>`;
    })
    .filter(Boolean)
    .join("\n");
}

async function loadSectionMedia(
  root: FileSystemDirectoryHandle,
  section: ProjectPreviewSection
): Promise<{ urls: Record<string, string>; revoke: () => void }> {
  const references = collectPreviewSectionMediaReferences([section]);
  if (section.pageImagePath) {
    references.push({
      sectionPath: section.path,
      source: section.pageImagePath,
      mediaPath: section.pageImagePath,
      kind: "image",
    });
  }

  const urls: Record<string, string> = {};
  const createdUrls: string[] = [];
  for (const reference of references) {
    if (urls[reference.source]) continue;
    try {
      const file = await readFile(root, reference.mediaPath);
      const url = URL.createObjectURL(file);
      urls[reference.source] = url;
      createdUrls.push(url);
    } catch {
      /* Leave missing media as its original source so the PDF still renders. */
    }
  }

  return {
    urls,
    revoke: () => {
      for (const url of createdUrls) URL.revokeObjectURL(url);
    },
  };
}

function renderSection(
  model: ProjectPreviewModel,
  section: ProjectPreviewSection,
  mediaUrls: Record<string, string>
): HTMLElement {
  const element = document.createElement("section");
  element.className = model.type === "comic" ? "pdf-section pdf-comic-section" : "pdf-section";

  if (model.type === "comic" && section.pageImagePath) {
    const image = document.createElement("img");
    image.className = "pdf-comic-image";
    image.src = mediaUrls[section.pageImagePath] ?? section.pageImagePath;
    image.alt = "";
    element.appendChild(image);
    return element;
  }

  const title = document.createElement("h2");
  title.innerHTML = inlineMarkdownToHtml(section.title, mediaUrls);
  element.appendChild(title);

  const body = document.createElement("div");
  body.className = "pdf-body";
  body.innerHTML = markdownToHtml(section.body, mediaUrls);
  element.appendChild(body);
  return element;
}

function waitForImages(element: HTMLElement): Promise<void> {
  return Promise.all(
    [...element.querySelectorAll("img")].map(
      (image) =>
        image.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              image.addEventListener("load", () => resolve(), { once: true });
              image.addEventListener("error", () => resolve(), { once: true });
            })
    )
  ).then(() => undefined);
}

type BookPdfBlock =
  | { kind: "text"; text: string; size: number; gap: number }
  | { kind: "image"; source: string; alt: string; gap: number };

function cleanMarkdownImageSource(src: string): string {
  const trimmed = src.trim();
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function plainMarkdownText(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_]/g, "");
}

function pushBookTextBlock(
  blocks: BookPdfBlock[],
  text: string,
  size: number,
  gap: number
): void {
  const cleaned = plainMarkdownText(text).trim();
  if (cleaned) blocks.push({ kind: "text", text: cleaned, size, gap });
}

function appendBookBlocksFromMarkdown(
  blocks: BookPdfBlock[],
  markdown: string,
  size: number,
  gap: number
): void {
  const tokenPattern = /!\[([^\]]*)\]\((<[^>]+>|[^)\s]+)(?:\s+["'][^"']*["'])?\)/g;
  let cursor = 0;

  for (const match of markdown.matchAll(tokenPattern)) {
    const start = match.index ?? 0;
    pushBookTextBlock(blocks, markdown.slice(cursor, start), size, gap);
    blocks.push({
      kind: "image",
      source: cleanMarkdownImageSource(match[2]),
      alt: match[1],
      gap,
    });
    cursor = start + match[0].length;
  }

  pushBookTextBlock(blocks, markdown.slice(cursor), size, gap);
}

function bookContentBlocks(markdown: string): BookPdfBlock[] {
  const blocks: BookPdfBlock[] = [];
  for (const rawBlock of markdown.replaceAll("\r\n", "\n").split(/\n{2,}/)) {
    const block = rawBlock.trim();
    if (!block) continue;
    const heading = block.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      pushBookTextBlock(blocks, heading[2], heading[1].length === 1 ? 18 : 14, 10);
      continue;
    }
    const text = block
      .split("\n")
      .map((line) => {
        return line
          .replace(/^>\s?/, "")
          .replace(/^[-*]\s+/, "• ");
      })
      .join("\n");
    appendBookBlocksFromMarkdown(blocks, text, 11, 8);
  }
  return blocks;
}

export interface BookCharacterWidthCache {
  (character: string, size: number): number;
  getStats(): { hits: number; misses: number; entries: number; measureMs: number };
}

function estimateHtmlCharacterWidth(character: string, size: number): number {
  if (character === "\t") return size * 1.12;
  if (/\s/u.test(character)) return size * 0.28;
  if (/[\u1100-\u11ff\u2e80-\u9fff\uf900-\ufaff\uac00-\ud7af\uff00-\uffef]/u.test(character)) {
    return size;
  }
  if (/[.,:;'"`!|()[\]{}]/u.test(character)) return size * 0.32;
  if (/[-_+=/\\]/u.test(character)) return size * 0.46;
  if (/[A-Z0-9]/u.test(character)) return size * 0.62;
  return size * 0.56;
}

export function createBookCharacterWidthCache(): BookCharacterWidthCache {
  const widths = new Map<string, number>();
  let hits = 0;
  let misses = 0;
  const characterWidth = ((character: string, size: number) => {
    const key = `${size}\u0000${character}`;
    const cached = widths.get(key);
    if (cached !== undefined) {
      hits += 1;
      return cached;
    }
    misses += 1;
    const measured = estimateHtmlCharacterWidth(character, size);
    widths.set(key, measured);
    return measured;
  }) as BookCharacterWidthCache;
  characterWidth.getStats = () => ({
    hits,
    misses,
    entries: widths.size,
    measureMs: 0,
  });
  return characterWidth;
}

function bookTextWidth(
  text: string,
  size: number,
  characterWidth: (character: string, size: number) => number
): number {
  let width = 0;
  for (const character of text) {
    width += characterWidth(character, size);
  }
  return width;
}

function splitBookLines(
  text: string,
  characterWidth: (character: string, size: number) => number,
  size: number,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (!paragraph) {
      lines.push("");
      continue;
    }
    let line = "";
    let lineWidth = 0;
    for (const character of paragraph) {
      const characterWidthValue = characterWidth(character, size);
      if (line && lineWidth + characterWidthValue > maxWidth) {
        lines.push(line);
        line = character;
        lineWidth = characterWidthValue;
      } else {
        line += character;
        lineWidth += characterWidthValue;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

async function readBookImageBytes(file: File, path: string): Promise<ArrayBuffer | null> {
  const type = file.type.toLowerCase();
  if (type === "image/png" || /\.png$/i.test(path)) {
    return file.arrayBuffer();
  }
  if (type === "image/jpeg" || type === "image/jpg" || /\.jpe?g$/i.test(path)) {
    return file.arrayBuffer();
  }
  return null;
}

async function loadBookSectionImages(
  root: FileSystemDirectoryHandle,
  section: ProjectPreviewSection
): Promise<Map<string, ArrayBuffer>> {
  const images = new Map<string, ArrayBuffer>();
  const references = collectPreviewSectionMediaReferences([section]).filter(
    (reference) => reference.kind === "image"
  );

  for (const reference of references) {
    if (images.has(reference.source)) continue;
    try {
      const file = await readFile(root, reference.mediaPath);
      const image = await readBookImageBytes(file, reference.mediaPath);
      if (image) images.set(reference.source, image);
    } catch {
      /* Keep exporting text even when an optional illustration is unavailable. */
    }
  }

  return images;
}

interface PdfKitOpenedImage {
  width: number;
  height: number;
}

interface BookPdfImage {
  width: number;
  height: number;
  colorSpace: "/DeviceGray" | "/DeviceRGB";
  bitsPerComponent: number;
  filter: "/DCTDecode" | "/FlateDecode";
  data: Uint8Array;
  decodeParms?: string;
}

class RawPdfWriter {
  private objects: (Uint8Array | null)[] = [];
  private encoder = new TextEncoder();

  reserveObject(): number {
    this.objects.push(null);
    return this.objects.length;
  }

  addObject(content: string | Uint8Array): number {
    const id = this.reserveObject();
    this.setObject(id, content);
    return id;
  }

  setObject(id: number, content: string | Uint8Array): void {
    this.objects[id - 1] =
      typeof content === "string" ? this.encoder.encode(content) : content;
  }

  addStreamObject(dictionary: string, data: Uint8Array): number {
    return this.addObject(
      concatBytes(
        this.encoder.encode(`<< ${dictionary} /Length ${data.byteLength} >>\nstream\n`),
        data,
        this.encoder.encode("\nendstream")
      )
    );
  }

  build(rootObjectId: number): Uint8Array {
    const chunks: Uint8Array[] = [this.encoder.encode("%PDF-1.7\n%\xE2\xE3\xCF\xD3\n")];
    const offsets = [0];
    let cursor = chunks[0].byteLength;

    for (const [index, object] of this.objects.entries()) {
      if (!object) throw new Error("PDF object was reserved but never written");
      offsets.push(cursor);
      const prefix = this.encoder.encode(`${index + 1} 0 obj\n`);
      const suffix = this.encoder.encode("\nendobj\n");
      chunks.push(prefix, object, suffix);
      cursor += prefix.byteLength + object.byteLength + suffix.byteLength;
    }

    const xrefOffset = cursor;
    let xref = `xref\n0 ${this.objects.length + 1}\n0000000000 65535 f \n`;
    for (const offset of offsets.slice(1)) {
      xref += `${String(offset).padStart(10, "0")} 00000 n \n`;
    }
    xref += `trailer\n<< /Size ${this.objects.length + 1} /Root ${rootObjectId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    chunks.push(this.encoder.encode(xref));
    return concatBytes(...chunks);
  }
}

function concatBytes(...chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
}

function pdfNumber(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(3).replace(/\.?0+$/, "");
}

function pdfColor(value: string): string {
  const red = Number.parseInt(value.slice(1, 3), 16) / 255;
  const green = Number.parseInt(value.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(value.slice(5, 7), 16) / 255;
  return `${pdfNumber(red)} ${pdfNumber(green)} ${pdfNumber(blue)} rg`;
}

function pdfLiteralString(value: string): string {
  return `(${value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)")})`;
}

function utf16BeHex(value: string): string {
  let hex = "";
  for (let index = 0; index < value.length; index += 1) {
    hex += value.charCodeAt(index).toString(16).padStart(4, "0");
  }
  return hex.toUpperCase();
}

function parsePngImage(bytes: Uint8Array): BookPdfImage | null {
  if (
    bytes[0] !== 0x89 ||
    bytes[1] !== 0x50 ||
    bytes[2] !== 0x4e ||
    bytes[3] !== 0x47
  ) {
    return null;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  const bitsPerComponent = bytes[24];
  const colorType = bytes[25];
  if (bitsPerComponent !== 8 || (colorType !== 0 && colorType !== 2)) return null;

  const idatChunks: Uint8Array[] = [];
  let offset = 8;
  while (offset + 8 <= bytes.byteLength) {
    const length = view.getUint32(offset);
    const type = new TextDecoder("ascii").decode(bytes.slice(offset + 4, offset + 8));
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (type === "IDAT") idatChunks.push(bytes.slice(dataStart, dataEnd));
    if (type === "IEND") break;
    offset = dataEnd + 4;
  }
  if (idatChunks.length === 0) return null;

  const colors = colorType === 0 ? 1 : 3;
  return {
    width,
    height,
    colorSpace: colorType === 0 ? "/DeviceGray" : "/DeviceRGB",
    bitsPerComponent,
    filter: "/FlateDecode",
    data: concatBytes(...idatChunks),
    decodeParms: `<< /Predictor 15 /Colors ${colors} /BitsPerComponent ${bitsPerComponent} /Columns ${width} >>`,
  };
}

function parseJpegImage(bytes: Uint8Array): BookPdfImage | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < bytes.byteLength) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1];
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3
    ) {
      const bitsPerComponent = bytes[offset + 4];
      const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
      const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
      const components = bytes[offset + 9];
      return {
        width,
        height,
        colorSpace: components === 1 ? "/DeviceGray" : "/DeviceRGB",
        bitsPerComponent,
        filter: "/DCTDecode",
        data: bytes,
      };
    }
    offset += 2 + length;
  }
  return null;
}

function parseBookPdfImage(bytes: ArrayBuffer): BookPdfImage | null {
  const view = new Uint8Array(bytes);
  return parsePngImage(view) ?? parseJpegImage(view);
}

async function buildBookTextPdf(
  root: FileSystemDirectoryHandle,
  model: ProjectPreviewModel,
  lang: Lang,
  includeImages: boolean,
  log: ReturnType<typeof createPdfLogEmitter>
): Promise<Blob> {
  const exportStartedAt = clockNow();
  log.emit("book.export-start", exportStartedAt, {
    title: model.title,
    sections: model.sections.length,
    includeImages,
  });

  const dependenciesStartedAt = clockNow();
  log.emit("book.dependencies-loaded", dependenciesStartedAt);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 54;
  const topMargin = 56;
  const footerY = 24;
  const footerSize = 8;
  const contentWidth = pageWidth - marginX * 2;
  const contentBottom = footerY + 24;
  const footer = pdfFooterText(lang);
  const writer = new RawPdfWriter();
  const pagesObjectId = writer.reserveObject();
  const fontDescriptorId = writer.addObject(
    "<< /Type /FontDescriptor /FontName /STSong-Light /Flags 4 /FontBBox [-260 -220 996 1071] /ItalicAngle 0 /Ascent 880 /Descent -120 /CapHeight 880 /StemV 80 >>"
  );
  const descendantFontId = writer.addObject(
    `<< /Type /Font /Subtype /CIDFontType0 /BaseFont /STSong-Light /CIDSystemInfo << /Registry ${pdfLiteralString(
      "Adobe"
    )} /Ordering ${pdfLiteralString(
      "GB1"
    )} /Supplement 2 >> /FontDescriptor ${fontDescriptorId} 0 R >>`
  );
  const fontObjectId = writer.addObject(
    `<< /Type /Font /Subtype /Type0 /BaseFont /STSong-Light /Encoding /UniGB-UCS2-H /DescendantFonts [${descendantFontId} 0 R] >>`
  );

  if (lang === "zh") {
    const fontFetchStartedAt = clockNow();
    log.emit("book.font-fetched", fontFetchStartedAt, {
      bytes: 0,
    });
    const fontEmbedStartedAt = clockNow();
    log.emit("book.font-embedded", fontEmbedStartedAt, {
      language: lang,
      subset: false,
      bytes: 0,
    });
  } else {
    const fontEmbedStartedAt = clockNow();
    log.emit("book.font-embedded", fontEmbedStartedAt, {
      language: lang,
      subset: false,
    });
  }
  const characterWidth = createBookCharacterWidthCache();
  let pageCount = 0;
  let cursorY = pageHeight - topMargin;
  let drawTextCalls = 0;
  let drawTextMs = 0;
  interface RawBookPage {
    content: string;
    images: Map<string, number>;
    annots: number[];
  }
  const createRawBookPage = (): RawBookPage => ({
    content: "",
    images: new Map(),
    annots: [],
  });
  const pages: RawBookPage[] = [];
  let currentPage = createRawBookPage();
  const pageIds: number[] = [];
  let imageCounter = 0;

  const addPage = () => {
    if (pageCount > 0) pages.push(currentPage);
    currentPage = createRawBookPage();
    pageCount += 1;
    cursorY = pageHeight - topMargin;
  };
  const drawBookText = (
    text: string,
    options: {
      x: number;
      y: number;
      size: number;
      lineHeight?: number;
      color: string;
    }
  ): void => {
    const startedAt = clockNow();
    const lineHeight = options.lineHeight ?? options.size;
    const lines = text.split("\n");
    currentPage.content += `BT /F1 ${pdfNumber(options.size)} Tf ${pdfColor(
      options.color
    )} 1 0 0 1 ${pdfNumber(options.x)} ${pdfNumber(options.y)} Tm `;
    for (const [index, line] of lines.entries()) {
      if (index > 0) {
        currentPage.content += `0 -${pdfNumber(lineHeight)} Td `;
      }
      if (line) currentPage.content += `<${utf16BeHex(line)}> Tj `;
    }
    currentPage.content += "ET\n";
    drawTextMs += clockNow() - startedAt;
    drawTextCalls += 1;
  };
  type DrawBookTextLineOptions = {
    x: number;
    size: number;
    lineHeight: number;
    color: string;
  };
  const drawBookTextLines = (
    lines: string[],
    options: DrawBookTextLineOptions
  ): void => {
    let batch: string[] = [];
    let batchY = 0;
    const flushBatch = () => {
      if (batch.some((line) => line.length > 0)) {
        drawBookText(batch.join("\n"), {
          ...options,
          y: batchY,
        });
      }
      batch = [];
    };

    for (const line of lines) {
      if (cursorY - options.lineHeight < contentBottom) {
        flushBatch();
        addPage();
      }
      if (batch.length === 0) batchY = cursorY - options.size;
      batch.push(line);
      cursorY -= options.lineHeight;
    }
    flushBatch();
  };
  const ensureSpace = (height: number) => {
    if (cursorY - height < contentBottom) addPage();
  };

  addPage();
  ensureSpace(36);
  drawBookText(model.title, {
    x: marginX,
    y: cursorY - 28,
    size: 24,
    color: "#141414",
  });
  cursorY -= 62;

  for (const [sectionIndex, section] of model.sections.entries()) {
    const sectionStartedAt = clockNow();
    const sectionDrawTextCalls = drawTextCalls;
    const sectionDrawTextMs = drawTextMs;
    const sectionImagesStartedAt = clockNow();
    const sectionImages = includeImages
      ? await loadBookSectionImages(root, section)
      : new Map<string, ArrayBuffer>();
    const sectionImageLoadMs = clockNow() - sectionImagesStartedAt;
    ensureSpace(28);
    const titleLines = splitBookLines(section.title, characterWidth, 16, contentWidth);
    drawBookTextLines(titleLines, {
      x: marginX,
      size: 16,
      lineHeight: 22,
      color: "#141414",
    });
    cursorY -= 8;

    for (const block of bookContentBlocks(section.body)) {
      if (block.kind === "image") {
        const image = sectionImages.get(block.source);
        if (!image) {
          if (block.alt) {
            const fallbackLines = splitBookLines(
              `[${block.alt}]`,
              characterWidth,
              11,
              contentWidth
            );
            drawBookTextLines(fallbackLines, {
              x: marginX,
              size: 11,
              lineHeight: 18,
              color: "#595959",
            });
          }
          cursorY -= block.gap;
          continue;
        }

        const maxHeight = Math.min(320, pageHeight - topMargin - contentBottom);
        const parsedImage = parseBookPdfImage(image);
        if (!parsedImage) {
          cursorY -= block.gap;
          continue;
        }
        const openedImage: PdfKitOpenedImage = parsedImage;
        let drawWidth = Math.min(contentWidth, openedImage.width);
        let drawHeight = (openedImage.height / openedImage.width) * drawWidth;
        if (drawHeight > maxHeight) {
          drawHeight = maxHeight;
          drawWidth = (openedImage.width / openedImage.height) * drawHeight;
        }
        ensureSpace(drawHeight + block.gap);
        const imageObjectId = writer.addStreamObject(
          `/Type /XObject /Subtype /Image /Width ${parsedImage.width} /Height ${
            parsedImage.height
          } /ColorSpace ${parsedImage.colorSpace} /BitsPerComponent ${
            parsedImage.bitsPerComponent
          } /Filter ${parsedImage.filter}${
            parsedImage.decodeParms ? ` /DecodeParms ${parsedImage.decodeParms}` : ""
          }`,
          parsedImage.data
        );
        imageCounter += 1;
        const imageName = `Im${imageCounter}`;
        currentPage.images.set(imageName, imageObjectId);
        currentPage.content += `q ${pdfNumber(drawWidth)} 0 0 ${pdfNumber(
          drawHeight
        )} ${pdfNumber(marginX + (contentWidth - drawWidth) / 2)} ${pdfNumber(
          cursorY - drawHeight
        )} cm /${imageName} Do Q\n`;
        cursorY -= drawHeight + block.gap;
        continue;
      }

      const lines = splitBookLines(
        block.text,
        characterWidth,
        block.size,
        contentWidth
      );
      drawBookTextLines(lines, {
        x: marginX,
        size: block.size,
        lineHeight: block.size + 7,
        color: "#1f1f1f",
      });
      cursorY -= block.gap;
    }
    cursorY -= 14;
    log.emit("book.section", sectionStartedAt, {
      index: sectionIndex,
      path: section.path,
      bodyChars: section.body.length,
      pages: pageCount,
      drawTextCalls: drawTextCalls - sectionDrawTextCalls,
      drawTextMs: drawTextMs - sectionDrawTextMs,
      widthCacheHits: characterWidth.getStats().hits,
      widthCacheMisses: characterWidth.getStats().misses,
      widthMeasureMs: characterWidth.getStats().measureMs,
      imageCount: sectionImages.size,
      imageLoadMs: sectionImageLoadMs,
    });
  }

  if (pageCount > pages.length) pages.push(currentPage);
  for (const pageState of pages) {
    currentPage = pageState;
    const footerWidth = bookTextWidth(footer, footerSize, characterWidth);
    const footerX = (pageWidth - footerWidth) / 2;
    drawBookText(footer, {
      x: footerX,
      y: footerY,
      size: footerSize,
      color: "#595959",
    });
    const annotationId = writer.addObject(
      `<< /Type /Annot /Subtype /Link /Rect [${pdfNumber(footerX)} ${pdfNumber(
        footerY - 3
      )} ${pdfNumber(footerX + footerWidth)} ${pdfNumber(
        footerY + 9
      )}] /Border [0 0 0] /A << /S /URI /URI ${pdfLiteralString(PDF_SITE_URL)} >> >>`
    );
    pageState.annots.push(annotationId);
  }

  const flushStartedAt = clockNow();
  for (const pageState of pages) {
    const contentId = writer.addStreamObject("", new TextEncoder().encode(pageState.content));
    const xObjects =
      pageState.images.size > 0
        ? `/XObject << ${[...pageState.images.entries()]
            .map(([name, id]) => `/${name} ${id} 0 R`)
            .join(" ")} >>`
        : "";
    const annots =
      pageState.annots.length > 0
        ? `/Annots [${pageState.annots.map((id) => `${id} 0 R`).join(" ")}]`
        : "";
    const pageId = writer.addObject(
      `<< /Type /Page /Parent ${pagesObjectId} 0 R /MediaBox [0 0 ${pdfNumber(
        pageWidth
      )} ${pdfNumber(
        pageHeight
      )}] /Resources << /Font << /F1 ${fontObjectId} 0 R >> ${xObjects} >> /Contents ${contentId} 0 R ${annots} >>`
    );
    pageIds.push(pageId);
  }
  writer.setObject(
    pagesObjectId,
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${
      pageIds.length
    } >>`
  );
  const catalogId = writer.addObject(`<< /Type /Catalog /Pages ${pagesObjectId} 0 R >>`);
  const bytes = writer.build(catalogId);
  log.emit("book.pdf-flushed", flushStartedAt, {
    pages: pageCount,
    drawTextCalls,
    drawTextMs,
  });
  const saveStartedAt = clockNow();
  const blob = new Blob(
    [bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer],
    { type: "application/pdf" }
  );
  log.emit("book.pdf-saved", saveStartedAt, {
    bytes: bytes.byteLength,
    pages: pageCount,
    widthCacheEntries: characterWidth.getStats().entries,
    widthCacheHits: characterWidth.getStats().hits,
    widthCacheMisses: characterWidth.getStats().misses,
    widthMeasureMs: characterWidth.getStats().measureMs,
  });
  log.emit("book.export-complete", exportStartedAt, {
    bytes: bytes.byteLength,
    pages: pageCount,
  });
  return blob;
}

async function buildComicImagePdf(
  root: FileSystemDirectoryHandle,
  model: ProjectPreviewModel,
  lang: Lang,
  log: ReturnType<typeof createPdfLogEmitter>
): Promise<Blob> {
  const exportStartedAt = clockNow();
  log.emit("comic.export-start", exportStartedAt, {
    title: model.title,
    sections: model.sections.length,
  });

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 36;
  const topMargin = 36;
  const footerY = 24;
  const footerSize = 8;
  const footer = pdfFooterText(lang);
  const contentWidth = pageWidth - marginX * 2;
  const contentHeight = pageHeight - topMargin - 52;
  const writer = new RawPdfWriter();
  const pagesObjectId = writer.reserveObject();
  const fontDescriptorId = writer.addObject(
    "<< /Type /FontDescriptor /FontName /STSong-Light /Flags 4 /FontBBox [-260 -220 996 1071] /ItalicAngle 0 /Ascent 880 /Descent -120 /CapHeight 880 /StemV 80 >>"
  );
  const descendantFontId = writer.addObject(
    `<< /Type /Font /Subtype /CIDFontType0 /BaseFont /STSong-Light /CIDSystemInfo << /Registry ${pdfLiteralString(
      "Adobe"
    )} /Ordering ${pdfLiteralString(
      "GB1"
    )} /Supplement 2 >> /FontDescriptor ${fontDescriptorId} 0 R >>`
  );
  const fontObjectId = writer.addObject(
    `<< /Type /Font /Subtype /Type0 /BaseFont /STSong-Light /Encoding /UniGB-UCS2-H /DescendantFonts [${descendantFontId} 0 R] >>`
  );
  const characterWidth = createBookCharacterWidthCache();

  interface RawComicPage {
    content: string;
    images: Map<string, number>;
    annots: number[];
  }
  const pages: RawComicPage[] = [];
  const pageIds: number[] = [];
  let imageCounter = 0;
  let imageCount = 0;
  let imageReadMs = 0;

  const drawFooter = (page: RawComicPage) => {
    const footerWidth = bookTextWidth(footer, footerSize, characterWidth);
    const footerX = (pageWidth - footerWidth) / 2;
    page.content += `BT /F1 ${pdfNumber(footerSize)} Tf ${pdfColor(
      "#595959"
    )} 1 0 0 1 ${pdfNumber(footerX)} ${pdfNumber(footerY)} Tm <${utf16BeHex(
      footer
    )}> Tj ET\n`;
    const annotationId = writer.addObject(
      `<< /Type /Annot /Subtype /Link /Rect [${pdfNumber(footerX)} ${pdfNumber(
        footerY - 3
      )} ${pdfNumber(footerX + footerWidth)} ${pdfNumber(
        footerY + 9
      )}] /Border [0 0 0] /A << /S /URI /URI ${pdfLiteralString(PDF_SITE_URL)} >> >>`
    );
    page.annots.push(annotationId);
  };

  for (const [sectionIndex, section] of model.sections.entries()) {
    const sectionStartedAt = clockNow();
    if (!section.pageImagePath) {
      log.emit("comic.section", sectionStartedAt, {
        index: sectionIndex,
        path: section.path,
        image: false,
      });
      continue;
    }

    const readStartedAt = clockNow();
    let parsedImage: BookPdfImage | null = null;
    try {
      const file = await readFile(root, section.pageImagePath);
      parsedImage = parseBookPdfImage(await file.arrayBuffer());
    } catch {
      parsedImage = null;
    }
    const sectionImageReadMs = clockNow() - readStartedAt;
    imageReadMs += sectionImageReadMs;

    if (!parsedImage) {
      log.emit("comic.section", sectionStartedAt, {
        index: sectionIndex,
        path: section.path,
        image: false,
        imageReadMs: sectionImageReadMs,
      });
      continue;
    }

    const page: RawComicPage = {
      content: "",
      images: new Map(),
      annots: [],
    };
    const imageObjectId = writer.addStreamObject(
      `/Type /XObject /Subtype /Image /Width ${parsedImage.width} /Height ${
        parsedImage.height
      } /ColorSpace ${parsedImage.colorSpace} /BitsPerComponent ${
        parsedImage.bitsPerComponent
      } /Filter ${parsedImage.filter}${
        parsedImage.decodeParms ? ` /DecodeParms ${parsedImage.decodeParms}` : ""
      }`,
      parsedImage.data
    );
    imageCounter += 1;
    imageCount += 1;
    const imageName = `Im${imageCounter}`;
    page.images.set(imageName, imageObjectId);

    let drawWidth = contentWidth;
    let drawHeight = (parsedImage.height / parsedImage.width) * drawWidth;
    if (drawHeight > contentHeight) {
      drawHeight = contentHeight;
      drawWidth = (parsedImage.width / parsedImage.height) * drawHeight;
    }
    const x = (pageWidth - drawWidth) / 2;
    const y = pageHeight - topMargin - drawHeight;
    page.content += `q ${pdfNumber(drawWidth)} 0 0 ${pdfNumber(drawHeight)} ${pdfNumber(
      x
    )} ${pdfNumber(y)} cm /${imageName} Do Q\n`;
    drawFooter(page);
    pages.push(page);
    log.emit("comic.section", sectionStartedAt, {
      index: sectionIndex,
      path: section.path,
      image: true,
      sourceWidth: parsedImage.width,
      sourceHeight: parsedImage.height,
      imageReadMs: sectionImageReadMs,
    });
  }

  if (pages.length === 0) {
    const page: RawComicPage = {
      content: `BT /F1 14 Tf ${pdfColor("#1f1f1f")} 1 0 0 1 ${pdfNumber(
        marginX
      )} ${pdfNumber(pageHeight - topMargin - 14)} Tm <${utf16BeHex(
        lang === "zh" ? "暂无可导出的内容。" : "There is no content to export yet."
      )}> Tj ET\n`,
      images: new Map(),
      annots: [],
    };
    drawFooter(page);
    pages.push(page);
  }

  const flushStartedAt = clockNow();
  for (const pageState of pages) {
    const contentId = writer.addStreamObject("", new TextEncoder().encode(pageState.content));
    const xObjects =
      pageState.images.size > 0
        ? `/XObject << ${[...pageState.images.entries()]
            .map(([name, id]) => `/${name} ${id} 0 R`)
            .join(" ")} >>`
        : "";
    const annots =
      pageState.annots.length > 0
        ? `/Annots [${pageState.annots.map((id) => `${id} 0 R`).join(" ")}]`
        : "";
    const pageId = writer.addObject(
      `<< /Type /Page /Parent ${pagesObjectId} 0 R /MediaBox [0 0 ${pdfNumber(
        pageWidth
      )} ${pdfNumber(
        pageHeight
      )}] /Resources << /Font << /F1 ${fontObjectId} 0 R >> ${xObjects} >> /Contents ${contentId} 0 R ${annots} >>`
    );
    pageIds.push(pageId);
  }
  writer.setObject(
    pagesObjectId,
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${
      pageIds.length
    } >>`
  );
  const catalogId = writer.addObject(`<< /Type /Catalog /Pages ${pagesObjectId} 0 R >>`);
  const bytes = writer.build(catalogId);
  log.emit("comic.pdf-flushed", flushStartedAt, {
    pages: pageIds.length,
    images: imageCount,
    imageReadMs,
  });
  const saveStartedAt = clockNow();
  const blob = new Blob(
    [bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer],
    { type: "application/pdf" }
  );
  log.emit("comic.pdf-saved", saveStartedAt, {
    bytes: bytes.byteLength,
    pages: pageIds.length,
    images: imageCount,
  });
  log.emit("comic.export-complete", exportStartedAt, {
    bytes: bytes.byteLength,
    pages: pageIds.length,
    images: imageCount,
  });
  return blob;
}

function makeSlice(
  source: HTMLCanvasElement,
  sourceY: number,
  sourceHeight: number
): HTMLCanvasElement {
  const slice = document.createElement("canvas");
  slice.width = source.width;
  slice.height = sourceHeight;
  const context = slice.getContext("2d");
  if (!context) throw new Error("无法准备 PDF 页面");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, slice.width, slice.height);
  context.drawImage(
    source,
    0,
    sourceY,
    source.width,
    sourceHeight,
    0,
    0,
    slice.width,
    slice.height
  );
  return slice;
}

async function appendCanvasPages(
  pdf: {
    addPage: () => void;
    addImage: (
      imageData: string,
      format: "PNG",
      x: number,
      y: number,
      width: number,
      height: number
    ) => void;
    link: (
      x: number,
      y: number,
      width: number,
      height: number,
      options: { url: string }
    ) => void;
    getNumberOfPages: () => number;
  },
  canvas: HTMLCanvasElement,
  hasExistingPage: boolean
): Promise<boolean> {
  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 15;
  const topMargin = 15;
  const footerHeight = 12;
  const contentWidth = pageWidth - marginX * 2;
  const contentHeight = pageHeight - topMargin - footerHeight - 8;
  const pageSourceHeight = Math.max(
    1,
    Math.floor(canvas.width * (contentHeight / contentWidth))
  );
  let sourceY = 0;
  let shouldAddPage = hasExistingPage;

  while (sourceY < canvas.height) {
    if (shouldAddPage) pdf.addPage();
    const height = Math.min(pageSourceHeight, canvas.height - sourceY);
    const slice = makeSlice(canvas, sourceY, height);
    const renderedHeight = (height / canvas.width) * contentWidth;
    pdf.addImage(
      slice.toDataURL("image/png"),
      "PNG",
      marginX,
      topMargin,
      contentWidth,
      renderedHeight
    );
    const footerY = pageHeight - 8;
    pdf.link(marginX, footerY - 5, contentWidth, 8, { url: PDF_SITE_URL });
    sourceY += height;
    shouldAddPage = true;
  }

  return sourceY > 0;
}

export async function buildReadableProjectPdf(
  root: FileSystemDirectoryHandle,
  model: ProjectPreviewModel,
  lang: Lang,
  options: ReadableProjectPdfOptions = {}
): Promise<Blob> {
  const log = createPdfLogEmitter(options.onLog);
  if (model.type === "book") {
    return buildBookTextPdf(
      root,
      model,
      lang,
      options.includeBookImages !== false,
      log
    );
  }
  if (model.type === "comic") {
    return buildComicImagePdf(root, model, lang, log);
  }

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const footerText = pdfFooterText(lang);
  let hasPage = false;
  const renderStyles = `
    <style>
      .pdf-render-root {
        position: fixed;
        left: -100000px;
        top: 0;
        width: 794px;
        box-sizing: border-box;
        padding: 56px;
        background: #ffffff;
        color: #111111;
        font-family: Georgia, "Times New Roman", "Noto Serif SC", serif;
        font-size: 18px;
        line-height: 1.7;
      }
      .pdf-render-root h1 {
        margin: 0;
        font-size: 42px;
        line-height: 1.15;
      }
      .pdf-section {
        box-sizing: border-box;
        width: 100%;
        padding: 0;
        color: #111111;
      }
      .pdf-section h2 {
        margin: 0 0 24px;
        font-size: 30px;
        line-height: 1.25;
      }
      .pdf-body p, .pdf-body ul, .pdf-body blockquote {
        margin: 0 0 18px;
      }
      .pdf-body ul {
        padding-left: 28px;
      }
      .pdf-body blockquote {
        border-left: 4px solid #b7b7b7;
        padding-left: 18px;
        color: #555555;
      }
      .pdf-body img {
        display: block;
        max-width: 100%;
        max-height: 980px;
        margin: 18px auto;
        object-fit: contain;
      }
      .pdf-body a {
        color: #1d4ed8;
        text-decoration: underline;
      }
      .pdf-comic-section {
        display: block;
      }
      .pdf-comic-image {
        display: block;
        width: 100%;
        max-height: 1120px;
        margin: 0 auto;
        object-fit: contain;
      }
    </style>`;
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.title = "PDF rendering surface";
  frame.style.position = "absolute";
  frame.style.left = "-10000px";
  frame.style.top = "0";
  frame.style.width = "900px";
  frame.style.height = "1400px";
  frame.style.border = "0";
  frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8">${renderStyles}</head><body></body></html>`;
  const frameLoaded = new Promise<void>((resolve) => {
    frame.addEventListener("load", () => resolve(), { once: true });
  });
  document.body.appendChild(frame);
  await frameLoaded;
  const renderDocument = frame.contentDocument;
  if (!renderDocument) throw new Error("无法准备 PDF 页面");
  const renderRoot = renderDocument.createElement("div");
  renderRoot.className = "pdf-render-root";
  renderRoot.setAttribute("aria-hidden", "true");
  renderRoot.innerHTML = `<h1>${escapeHtml(model.title)}</h1>`;
  renderDocument.body.appendChild(renderRoot);

  try {
    const titleCanvas = await html2canvas(renderRoot, {
      backgroundColor: "#ffffff",
      scale: 2,
      logging: false,
    });
    hasPage = await appendCanvasPages(pdf, titleCanvas, false);

    for (const section of model.sections) {
      const media = await loadSectionMedia(root, section);
      const element = renderSection(model, section, media.urls);
      renderRoot.innerHTML = "";
      renderRoot.appendChild(element);
      await waitForImages(element);
      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
      });
      hasPage = (await appendCanvasPages(pdf, canvas, hasPage)) || hasPage;
      element.remove();
      media.revoke();
    }

    if (!hasPage) {
      const empty = renderDocument.createElement("p");
      empty.textContent = lang === "zh" ? "暂无可导出的内容。" : "There is no content to export yet.";
      renderRoot.appendChild(empty);
      const canvas = await html2canvas(renderRoot, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
      });
      await appendCanvasPages(pdf, canvas, hasPage);
    }
  } finally {
    frame.remove();
  }

  // The footer is rendered as pixels for correct CJK support; each page also
  // receives a real PDF link annotation over the footer area.
  for (let page = 1; page <= pdf.getNumberOfPages(); page += 1) {
    pdf.setPage(page);
    pdf.setTextColor(90, 90, 90);
    pdf.setFontSize(8);
    pdf.text(footerText, 105, 289, { align: "center" });
  }

  return pdf.output("blob");
}

export async function exportReadableProjectPdf(
  root: FileSystemDirectoryHandle,
  model: ProjectPreviewModel,
  title: string,
  lang: Lang,
  options: ReadableProjectPdfOptions = {}
): Promise<void> {
  const pdf = await buildReadableProjectPdf(root, model, lang, options);
  const url = URL.createObjectURL(pdf);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safeFilename(title)}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
