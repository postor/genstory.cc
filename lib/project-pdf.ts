import type { Lang } from "@/lib/i18n";
import { readFile } from "@/lib/file-system/browser";
import { collectPreviewSectionMediaReferences } from "@/lib/markdown/preview-media";
import type { PDFDocument, PDFPage } from "pdf-lib";
import type {
  ProjectPreviewModel,
  ProjectPreviewSection,
} from "@/lib/project-source";

export const PDF_SITE_URL = "https://www.genstory.cc";

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

function bookTextBlocks(markdown: string): { text: string; size: number; gap: number }[] {
  const blocks: { text: string; size: number; gap: number }[] = [];
  for (const rawBlock of markdown.replaceAll("\r\n", "\n").split(/\n{2,}/)) {
    const block = rawBlock.trim();
    if (!block) continue;
    const heading = block.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push({
        text: heading[2].replace(/[`*_]/g, ""),
        size: heading[1].length === 1 ? 18 : 14,
        gap: 10,
      });
      continue;
    }
    const text = block
      .split("\n")
      .map((line) => {
        const image = line.match(/^!\[([^\]]*)\]\([^)]+\)$/);
        if (image) return image[1] ? `[${image[1]}]` : "";
        return line
          .replace(/^>\s?/, "")
          .replace(/^[-*]\s+/, "• ")
          .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
          .replace(/[`*_]/g, "");
      })
      .filter(Boolean)
      .join("\n");
    if (text) blocks.push({ text, size: 11, gap: 8 });
  }
  return blocks;
}

function splitBookLines(
  text: string,
  font: { widthOfTextAtSize: (value: string, size: number) => number },
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
    for (const character of paragraph) {
      const next = line + character;
      if (line && font.widthOfTextAtSize(next, size) > maxWidth) {
        lines.push(line);
        line = character;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function addPdfLinkAnnotation(
  pdfDoc: PDFDocument,
  page: PDFPage,
  pdfPrimitives: {
    PDFName: typeof import("pdf-lib").PDFName;
    PDFArray: typeof import("pdf-lib").PDFArray;
    PDFString: typeof import("pdf-lib").PDFString;
  },
  x: number,
  y: number,
  width: number,
  height: number,
  url: string
): void {
  const annotation = pdfDoc.context.register(
    pdfDoc.context.obj({
      Type: "Annot",
      Subtype: "Link",
      Rect: [x, y, x + width, y + height],
      Border: [0, 0, 0],
      A: {
        Type: "Action",
        S: "URI",
        URI: pdfPrimitives.PDFString.of(url),
      },
    } as never)
  );
  const annotsKey = pdfPrimitives.PDFName.of("Annots");
  const existing = page.node.lookup(annotsKey, pdfPrimitives.PDFArray);
  if (existing && typeof (existing as { push?: unknown }).push === "function") {
    existing.push(annotation);
    return;
  }
  const annots = pdfPrimitives.PDFArray.withContext(pdfDoc.context);
  annots.push(annotation);
  page.node.set(annotsKey, annots);
}

async function buildBookTextPdf(model: ProjectPreviewModel, lang: Lang): Promise<Blob> {
  const { PDFArray, PDFDocument, PDFName, PDFString, rgb } = await import("pdf-lib");
  const fontkit = await import("@pdf-lib/fontkit");
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit.default ?? fontkit);

  let font;
  if (lang === "zh") {
    const response = await fetch("/fonts/noto-sans-sc-chinese-simplified-400-normal.woff");
    if (!response.ok) throw new Error("中文 PDF 字体加载失败，请重新加载页面后重试");
    font = await pdfDoc.embedFont(await response.arrayBuffer(), { subset: true });
  } else {
    font = await pdfDoc.embedFont("Helvetica");
  }

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 54;
  const topMargin = 56;
  const footerY = 24;
  const footerSize = 8;
  const contentWidth = pageWidth - marginX * 2;
  const contentBottom = footerY + 24;
  const footer = pdfFooterText(lang);
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let cursorY = pageHeight - topMargin;

  const addPage = () => {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    cursorY = pageHeight - topMargin;
  };
  const ensureSpace = (height: number) => {
    if (cursorY - height < contentBottom) addPage();
  };

  ensureSpace(36);
  page.drawText(model.title, {
    x: marginX,
    y: cursorY - 28,
    size: 24,
    font,
    color: rgb(0.08, 0.08, 0.08),
  });
  cursorY -= 62;

  for (const section of model.sections) {
    ensureSpace(28);
    const titleLines = splitBookLines(section.title, font, 16, contentWidth);
    for (const line of titleLines) {
      ensureSpace(22);
      page.drawText(line, {
        x: marginX,
        y: cursorY - 16,
        size: 16,
        font,
        color: rgb(0.08, 0.08, 0.08),
      });
      cursorY -= 22;
    }
    cursorY -= 8;

    for (const block of bookTextBlocks(section.body)) {
      const lines = splitBookLines(block.text, font, block.size, contentWidth);
      for (const line of lines) {
        ensureSpace(block.size + 7);
        if (line) {
          page.drawText(line, {
            x: marginX,
            y: cursorY - block.size,
            size: block.size,
            font,
            color: rgb(0.12, 0.12, 0.12),
          });
        }
        cursorY -= block.size + 7;
      }
      cursorY -= block.gap;
    }
    cursorY -= 14;
  }

  for (const pdfPage of pdfDoc.getPages()) {
    const footerWidth = font.widthOfTextAtSize(footer, footerSize);
    pdfPage.drawText(footer, {
      x: (pageWidth - footerWidth) / 2,
      y: footerY,
      size: footerSize,
      font,
      color: rgb(0.35, 0.35, 0.35),
    });
    addPdfLinkAnnotation(
      pdfDoc,
      pdfPage,
      { PDFName, PDFArray, PDFString },
      (pageWidth - footerWidth) / 2,
      footerY - 3,
      footerWidth,
      12,
      PDF_SITE_URL
    );
  }

  const bytes = await pdfDoc.save();
  return new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
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
  lang: Lang
): Promise<Blob> {
  if (model.type === "book") {
    return buildBookTextPdf(model, lang);
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
    if (model.type !== "comic") {
      const titleCanvas = await html2canvas(renderRoot, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
      });
      hasPage = await appendCanvasPages(pdf, titleCanvas, false);
    }

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
  lang: Lang
): Promise<void> {
  const pdf = await buildReadableProjectPdf(root, model, lang);
  const url = URL.createObjectURL(pdf);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safeFilename(title)}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
