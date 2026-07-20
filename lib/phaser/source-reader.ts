import { listProjectFiles, readTextFile } from "../file-system/browser";

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
