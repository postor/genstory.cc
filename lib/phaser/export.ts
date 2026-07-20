import { listProjectFiles, readFile } from "../file-system/browser";
import { zipStore, type ZipEntry } from "../vn/zip";
import { buildPhaserStandaloneHtml } from "./preview";

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function safeFilename(value: string): string {
  return value.trim().replace(/[\\/:*?"<>|]+/g, "-") || "phaser-game";
}

export async function exportPhaserProjectZip(
  root: FileSystemDirectoryHandle,
  title: string
): Promise<void> {
  const entries = await listProjectFiles(root);
  const zipEntries: ZipEntry[] = [];
  for (const entry of entries) {
    if (entry.kind !== "file") continue;
    const blob = await readFile(root, entry.path);
    if (entry.path === "index.html") {
      zipEntries.push({
        path: entry.path,
        blob: new Blob([buildPhaserStandaloneHtml(await blob.text())], {
          type: "text/html; charset=utf-8",
        }),
      });
    } else {
      zipEntries.push({ path: entry.path, blob });
    }
  }

  const runtime = await fetch("/phaser/phaser.min.js");
  if (!runtime.ok) throw new Error("Phaser 运行时尚未准备好，请重新加载应用后再导出");
  zipEntries.push({ path: "vendor/phaser.min.js", blob: await runtime.blob() });
  const zip = await zipStore(zipEntries);
  triggerDownload(zip, `${safeFilename(title)}-phaser.zip`);
}
