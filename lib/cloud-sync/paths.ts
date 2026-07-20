import type { CloudProjectMetadata } from "./types";
import { normalizeRelativePath } from "../file-system/paths.ts";

export function remoteProjectPath(project: CloudProjectMetadata, filePath: string): string {
  return normalizeRelativePath(`${project.template}/${project.id}/${normalizeRelativePath(filePath)}`);
}

export function parseRemoteProjectPath(path: string): {
  template: CloudProjectMetadata["template"];
  projectId: string;
  filePath: string;
} {
  const normalized = normalizeRelativePath(path);
  const parts = normalized.split("/");
  if (parts.length < 3) throw new Error(`云端文件路径无效：${path}`);
  return {
    template: parts[0] as CloudProjectMetadata["template"],
    projectId: parts[1],
    filePath: parts.slice(2).join("/"),
  };
}

export function cloudPathSegments(path: string): string[] {
  return normalizeRelativePath(path).split("/");
}
