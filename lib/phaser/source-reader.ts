import { listProjectFiles, readFile, readTextFile } from "../file-system/browser";

function isTextPath(path: string): boolean {
  return /\.(html?|css|js|json|ya?ml|md|txt)$/i.test(path);
}

export async function readPhaserProjectFromDirectory(
  root: FileSystemDirectoryHandle
): Promise<Record<string, string>> {
  const entries = await listProjectFiles(root);
  const files: Record<string, string> = {};
  for (const entry of entries) {
    if (entry.kind !== "file" || !/\.(html?|css|js|json|ya?ml|md)$/i.test(entry.path)) continue;
    files[entry.path] = await readTextFile(root, entry.path);
  }
  return files;
}

export async function readPhaserProjectAssetUrlsFromDirectory(
  root: FileSystemDirectoryHandle
): Promise<Record<string, string>> {
  const entries = await listProjectFiles(root);
  const urls: Record<string, string> = {};
  for (const entry of entries) {
    if (
      entry.kind !== "file" ||
      !entry.path.toLowerCase().startsWith("assets/") ||
      isTextPath(entry.path)
    ) {
      continue;
    }
    urls[entry.path] = URL.createObjectURL(await readFile(root, entry.path));
  }
  return urls;
}

export function revokePhaserProjectAssetUrls(assetUrls: Record<string, string>): void {
  for (const url of Object.values(assetUrls)) URL.revokeObjectURL(url);
}
