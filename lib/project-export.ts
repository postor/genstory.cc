import { listProjectFiles, readFile } from "@/lib/file-system/browser";
import type { ProjectPreviewModel } from "@/lib/project-source";
import { zipStore, type ZipEntry } from "@/lib/vn/zip";

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function safeFilename(value: string): string {
  return value.trim().replace(/[\\/:*?"<>|]+/g, "-") || "project";
}

export async function exportProjectDirectoryZip(
  root: FileSystemDirectoryHandle,
  title: string
): Promise<void> {
  const entries = await listProjectFiles(root);
  const zipEntries: ZipEntry[] = [];
  for (const entry of entries) {
    zipEntries.push({
      path: entry.path,
      blob: await readFile(root, entry.path),
    });
  }
  const zip = await zipStore(zipEntries);
  triggerDownload(zip, `${safeFilename(title)}.zip`);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function markdownToHtml(markdown: string): string {
  const blocks = markdown.split(/\n{2,}/);
  return blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
      if (heading) {
        const level = heading[1].length;
        return `<h${level}>${escapeHtml(heading[2])}</h${level}>`;
      }
      const lines = trimmed.split(/\r?\n/).map(escapeHtml).join("<br>");
      return `<p>${lines}</p>`;
    })
    .filter(Boolean)
    .join("\n");
}

function previewHtml(model: ProjectPreviewModel): string {
  const sections = model.sections
    .map(
      (section) => `
        <section>
          <p class="path">${escapeHtml(section.path)}</p>
          <h2>${escapeHtml(section.title)}</h2>
          ${markdownToHtml(section.body)}
        </section>`
    )
    .join("\n");
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(model.title)}</title>
  <style>
    :root { color-scheme: light dark; font-family: ui-serif, "Times New Roman", "Noto Serif SC", serif; }
    body { margin: 0; background: Canvas; color: CanvasText; }
    main { max-width: 820px; margin: 0 auto; padding: 48px 24px; }
    h1 { font-size: 2.4rem; line-height: 1.15; margin: 0 0 2rem; }
    h2 { font-size: 1.45rem; margin: 0 0 1rem; }
    section { border-top: 1px solid color-mix(in srgb, CanvasText 18%, transparent); padding-top: 1.5rem; margin-top: 2rem; }
    p { line-height: 1.8; }
    .path { font: 12px ui-monospace, SFMono-Regular, Consolas, monospace; opacity: .65; margin: 0 0 .5rem; }
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(model.title)}</h1>
    ${sections || "<p>Empty project.</p>"}
  </main>
</body>
</html>`;
}

export async function exportReadableProjectZip(
  model: ProjectPreviewModel,
  title: string
): Promise<void> {
  const zip = await zipStore([
    {
      path: "index.html",
      blob: new Blob([previewHtml(model)], {
        type: "text/html; charset=utf-8",
      }),
    },
  ]);
  triggerDownload(zip, `${safeFilename(title)}-export.zip`);
}
