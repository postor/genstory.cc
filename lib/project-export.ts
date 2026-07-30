import { listProjectFiles, readFile } from "@/lib/file-system/browser";
import { buildSourceZip } from "@/lib/project-zip";
import type { ProjectPreviewModel } from "@/lib/project-source";
import { zipStore } from "@/lib/vn/zip";

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
  const zip = await buildProjectDirectoryZip(root);
  triggerDownload(zip, `${safeFilename(title)}.zip`);
}

export async function buildProjectDirectoryZip(
  root: FileSystemDirectoryHandle
): Promise<Blob> {
  const entries = await listProjectFiles(root);
  const zipEntries = [];
  for (const entry of entries) {
    if (entry.kind !== "file") continue;
    zipEntries.push({
      path: entry.path,
      blob: await readFile(root, entry.path),
    });
  }
  return buildSourceZip(zipEntries);
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

function plainMarkdown(value: string): string {
  return value
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .trim();
}

function pictureBookRuntimeHtml(model: ProjectPreviewModel, lang: "zh" | "en"): string {
  const pages = JSON.stringify(model.sections.map((section) => ({
    title: section.title,
    body: plainMarkdown(section.body.replace(/^---[\s\S]*?---\s*/m, "")).replace(/<|>/g, ""),
    image: section.pageImagePath ?? "",
    voice: section.pageVoicePath ?? "",
  }))).replace(/</g, "\\u003c");
  const labels = lang === "zh" ? { previous: "上一页", next: "下一页", play: "播放配音", pause: "暂停配音" } : { previous: "Previous", next: "Next", play: "Play narration", pause: "Pause narration" };
  return `<!doctype html><html lang="${lang === "zh" ? "zh-CN" : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(model.title)}</title><style>:root{font-family:ui-serif,"Noto Serif SC",serif;color:#30271f;background:#151311}*{box-sizing:border-box}body{margin:0}main{min-height:100vh;display:grid;place-items:center;padding:24px}.reader{width:min(1120px,100%);color:#fff}.top{display:flex;justify-content:space-between;margin-bottom:12px;opacity:.75}.page{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(240px,.8fr);background:#fbf6e9;color:#30271f}.art{aspect-ratio:16/9;background:#fff}.art img{width:100%;height:100%;object-fit:cover}.copy{padding:32px;display:flex;flex-direction:column;justify-content:space-between;gap:24px}.copy h2{font-size:1rem;color:#876b52}.copy p{font-size:1.15rem;line-height:1.8}.controls{display:flex;justify-content:center;align-items:center;gap:12px;margin-top:16px}.controls button{border:1px solid #ffffff55;background:transparent;color:#fff;padding:8px 14px;cursor:pointer}.controls button:disabled{opacity:.35;cursor:default}@media(max-width:700px){.page{grid-template-columns:1fr}.copy{padding:24px}.copy p{font-size:1rem}}</style></head><body><main><div class="reader"><div class="top"><span>${escapeHtml(model.title)}</span><span id="count"></span></div><section class="page"><div class="art"><img id="image" alt=""></div><div class="copy"><div><h2 id="title"></h2><p id="body"></p></div><audio id="voice" controls></audio></div></section><div class="controls"><button id="prev">${labels.previous}</button><button id="play">${labels.play}</button><button id="next">${labels.next}</button></div></div></main><script>const pages=${pages};const labels=${JSON.stringify(labels)};let i=0;const $=id=>document.getElementById(id);function render(){const p=pages[i];$('count').textContent=(i+1)+' / '+pages.length;$('title').textContent=p.title;$('body').textContent=p.body;$('image').src=p.image;$('image').alt=p.title;$('voice').src=p.voice;$('voice').hidden=!p.voice;$('prev').disabled=i===0;$('next').disabled=i===pages.length-1;$('play').textContent=labels.play;}$('prev').onclick=()=>{if(i>0){i--;render()}};$('next').onclick=()=>{if(i<pages.length-1){i++;render()}};$('play').onclick=()=>{const a=$('voice');if(!a.src)return;if(a.paused){a.play();$('play').textContent=labels.pause}else{a.pause();$('play').textContent=labels.play}};$('voice').onended=()=>$('play').textContent=labels.play;render();</script></body></html>`;
}

export async function exportPictureBookZip(root: FileSystemDirectoryHandle, model: ProjectPreviewModel, title: string, lang: "zh" | "en"): Promise<void> {
  const entries = [{ path: "index.html", blob: new Blob([pictureBookRuntimeHtml(model, lang)], { type: "text/html; charset=utf-8" }) }];
  const files = await listProjectFiles(root);
  for (const entry of files) {
    if (entry.kind !== "file" || (!entry.path.startsWith("assets/") && entry.path !== "meta.md")) continue;
    entries.push({ path: entry.path, blob: await readFile(root, entry.path) });
  }
  const zip = await zipStore(entries);
  triggerDownload(zip, `${safeFilename(title)}-picture-book.zip`);
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
