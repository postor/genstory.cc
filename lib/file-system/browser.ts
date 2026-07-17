"use client";

import type { ContentTypeId } from "../content-types";
import { getProjectTemplate } from "../project-templates";
import { normalizeRelativePath, projectRelativePath, type ProjectPath } from "./paths";
import type { ProjectFileEntry } from "./types";

type StorageManagerWithDirectory = StorageManager & {
  getDirectory?: () => Promise<FileSystemDirectoryHandle>;
};

type DirectoryEntry = FileSystemFileHandle | FileSystemDirectoryHandle;

type DirectoryHandleWithEntries = FileSystemDirectoryHandle & {
  entries(): AsyncIterableIterator<[string, DirectoryEntry]>;
};

export function supportsFileSystemAccess(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    typeof (navigator.storage as StorageManagerWithDirectory | undefined)
      ?.getDirectory === "function"
  );
}

export async function getBrowserFileSystemRoot(): Promise<FileSystemDirectoryHandle> {
  if (!supportsFileSystemAccess()) {
    throw new Error("当前浏览器不支持 Origin Private File System");
  }
  const storage = navigator.storage as StorageManagerWithDirectory;
  return storage.getDirectory!();
}

export async function ensurePermission(
  ..._args: [FileSystemHandle, boolean?]
): Promise<void> {
  void _args;
  // OPFS is scoped to this origin and does not require a user permission prompt.
}

async function getDirectory(
  root: FileSystemDirectoryHandle,
  segments: readonly string[],
  create = false
): Promise<FileSystemDirectoryHandle> {
  let current = root;
  for (const segment of segments) {
    current = await current.getDirectoryHandle(segment, { create });
  }
  return current;
}

export async function getProjectDirectory(
  path: ProjectPath,
  create = false
): Promise<FileSystemDirectoryHandle> {
  return getDirectory(await getBrowserFileSystemRoot(), path, create);
}

export async function initializeProjectDirectory(
  template: ContentTypeId,
  projectId: string,
  lang: "zh" | "en",
  title: string
): Promise<FileSystemDirectoryHandle> {
  const projectPath = projectRelativePath(template, projectId);
  const root = await getProjectDirectory(projectPath, true);
  const files = await getProjectTemplate(template, lang, title);

  for (const file of files) {
    const path = normalizeRelativePath(file.path);
    const parts = path.split("/");
    const filename = parts.pop()!;
    const parent = await getDirectory(root, parts, true);
    const handle = await parent.getFileHandle(filename, { create: true });
    const writable = await handle.createWritable();
    try {
      if (file.kind === "text") {
        await writable.write(file.content ?? "");
      } else if (file.sourceUrl) {
        const response = await fetch(file.sourceUrl);
        if (!response.ok) throw new Error(`模板资产加载失败: ${file.path}`);
        await writable.write(await response.blob());
      } else {
        throw new Error(`模板二进制文件缺少来源: ${file.path}`);
      }
    } finally {
      await writable.close();
    }
  }

  return root;
}

export async function openProjectDirectory(
  template: ContentTypeId,
  projectId: string
): Promise<FileSystemDirectoryHandle> {
  return getProjectDirectory(projectRelativePath(template, projectId));
}

export async function readFile(
  root: FileSystemDirectoryHandle,
  path: string
): Promise<File> {
  const normalized = normalizeRelativePath(path);
  const parts = normalized.split("/");
  const filename = parts.pop()!;
  const parent = await getDirectory(root, parts);
  return parent.getFileHandle(filename).then((handle) => handle.getFile());
}

export async function readTextFile(
  root: FileSystemDirectoryHandle,
  path: string
): Promise<string> {
  return (await readFile(root, path)).text();
}

export async function writeFile(
  root: FileSystemDirectoryHandle,
  path: string,
  data: Blob | BufferSource | string
): Promise<void> {
  const normalized = normalizeRelativePath(path);
  const parts = normalized.split("/");
  const filename = parts.pop()!;
  const parent = await getDirectory(root, parts, true);
  const handle = await parent.getFileHandle(filename, { create: true });
  const writable = await handle.createWritable();
  try {
    await writable.write(data);
  } finally {
    await writable.close();
  }
}

export async function writeTextFile(
  root: FileSystemDirectoryHandle,
  path: string,
  content: string
): Promise<void> {
  await ensurePermission(root, true);
  await writeFile(root, path, content);
}

export async function listProjectFiles(
  root: FileSystemDirectoryHandle
): Promise<ProjectFileEntry[]> {
  const files: ProjectFileEntry[] = [];

  async function visit(directory: FileSystemDirectoryHandle, prefix: string) {
    const iterable = directory as DirectoryHandleWithEntries;
    for await (const [name, entry] of iterable.entries()) {
      const path = prefix ? `${prefix}/${name}` : name;
      if (entry.kind === "file") {
        const file = await entry.getFile();
        files.push({
          path,
          kind: "file",
          size: file.size,
          lastModified: file.lastModified,
        });
      } else {
        await visit(entry, path);
      }
    }
  }

  await visit(root, "");
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

export async function fileExists(
  root: FileSystemDirectoryHandle,
  path: string
): Promise<boolean> {
  try {
    await readFile(root, path);
    return true;
  } catch {
    return false;
  }
}
