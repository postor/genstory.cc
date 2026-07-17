// The .ts suffix keeps the native Node strip-types test runner resolvable.
// @ts-expect-error TS5097: required by the native Node test runner.
import { normalizeRelativePath } from "./paths.ts";

type EntryKind = "file" | "directory";

function validateSingleSegmentName(name: string): string {
  const normalized = name.trim();
  if (
    !normalized ||
    normalized === "." ||
    normalized === ".." ||
    normalized.includes("/") ||
    normalized.includes("\\") ||
    /^[A-Za-z]:$/.test(normalized)
  ) {
    throw new Error("名称必须是单一路径段");
  }
  return normalized;
}

export function parentDirectoryPath(path: string): string {
  if (!path) return "";
  const normalized = normalizeRelativePath(path);
  const parts = normalized.split("/");
  parts.pop();
  return parts.join("/");
}

export function uploadTargetDirectory(selectedPath: string, selectedKind: EntryKind | null): string {
  if (!selectedPath) return "";
  if (selectedKind === "directory") return normalizeRelativePath(selectedPath);
  return parentDirectoryPath(selectedPath);
}

export function resolveNewEntryPath(
  selectedPath: string,
  selectedKind: EntryKind | null,
  name: string
): string {
  const entryName = validateSingleSegmentName(name);
  const directory = uploadTargetDirectory(selectedPath, selectedKind);
  return directory ? `${directory}/${entryName}` : entryName;
}
