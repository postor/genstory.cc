import { compile } from "./compile";
import { zipStore } from "./zip";
import { ORIGINAL_SW } from "./original-sw";
import type { VNProject } from "./types";
import { readVNProjectFromDirectory } from "./source-reader";

const ENGINE_BASE = "/webgal";
const MANIFEST_URL = `${ENGINE_BASE}/engine-manifest.json`;

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

/**
 * Build a self-contained, runnable OpenWebGal project zip:
 * vendored engine (with the ORIGINAL SW restored) + compiled game files.
 */
export async function exportVNZip(
  vn: VNProject,
  filename = "redhood-openwebgal.zip"
): Promise<void> {
  const game = await compile(vn);

  let manifest: string[] = [];
  try {
    manifest = await (await fetch(MANIFEST_URL)).json();
  } catch {
    manifest = [];
  }

  const entries: { path: string; blob: Blob }[] = [];
  for (const rel of manifest) {
    if (rel === "webgal-serviceworker.js") {
      // Restore the original engine SW (the bridge SW would 404 on disk deploys).
      entries.push({
        path: rel,
        blob: new Blob([ORIGINAL_SW], { type: "application/javascript" }),
      });
      continue;
    }
    if (rel.startsWith("game/")) continue;
    try {
      const blob = await (await fetch(`${ENGINE_BASE}/${rel}`)).blob();
      entries.push({ path: rel, blob });
    } catch {
      /* skip missing engine file */
    }
  }

  for (const [path, blob] of Object.entries(game)) {
    entries.push({ path: `game/${path}`, blob });
  }

  const zip = await zipStore(entries);
  triggerDownload(zip, filename);
}

export async function exportVNZipFromDirectory(
  root: FileSystemDirectoryHandle,
  filename = "openwebgal-project.zip"
): Promise<void> {
  const project = await readVNProjectFromDirectory(root);
  await exportVNZip(project, filename);
}
