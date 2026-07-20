import { zipStore, type ZipEntry } from "./vn/zip.ts";

export function buildSourceZip(entries: ZipEntry[]): Promise<Blob> {
  return zipStore(entries).then(
    (blob) => new Blob([blob], { type: "application/zip" })
  );
}
