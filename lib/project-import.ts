import type { ContentTypeId } from "./content-types";
import { normalizeRelativePath } from "./file-system/paths.ts";

export interface ImportedProjectSource {
  id?: string;
  title: string;
  template: ContentTypeId;
  lang?: "zh" | "en";
  createdAt?: number;
  updatedAt?: number;
  lastOpenedPath?: string;
  files: { path: string; blob: Blob }[];
}

export type ImportedBackup =
  | { kind: "project"; project: ImportedProjectSource }
  | { kind: "workspace"; projects: ImportedProjectSource[] };

interface ZipFile {
  path: string;
  blob: Blob;
}

interface WorkspaceProjectRecord {
  id?: string;
  projectId?: string;
  template?: ContentTypeId;
  type?: ContentTypeId;
  title?: string;
  lang?: "zh" | "en";
  createdAt?: number;
  updatedAt?: number;
  lastOpenedPath?: string;
}

interface ProjectLike {
  id: string;
}

function findEndOfCentralDirectory(bytes: Uint8Array): number {
  const min = 22;
  const maxComment = 0xffff;
  const start = Math.max(0, bytes.length - min - maxComment);
  for (let index = bytes.length - min; index >= start; index -= 1) {
    if (
      bytes[index] === 0x50 &&
      bytes[index + 1] === 0x4b &&
      bytes[index + 2] === 0x05 &&
      bytes[index + 3] === 0x06
    ) {
      return index;
    }
  }
  throw new Error("未找到 ZIP 目录，无法导入项目备份");
}

function readString(bytes: Uint8Array, start: number, length: number): string {
  return new TextDecoder().decode(bytes.slice(start, start + length));
}

function stripCommonRoot(files: ZipFile[]): ZipFile[] {
  if (files.some((file) => file.path === "meta.md")) return files;
  const roots = new Set<string>();
  for (const file of files) {
    const [root] = file.path.split("/");
    if (root) roots.add(root);
  }
  if (files.every((file) => !file.path.includes("/")) || roots.size !== 1) {
    return files;
  }
  const [root] = [...roots];
  return files
    .map((file) => ({
      ...file,
      path: file.path.slice(root.length + 1),
    }))
    .filter((file) => file.path);
}

async function readZipFiles(blob: Blob): Promise<ZipFile[]> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocd = findEndOfCentralDirectory(bytes);
  const totalEntries = view.getUint16(eocd + 10, true);
  let cursor = view.getUint32(eocd + 16, true);
  const files: ZipFile[] = [];

  for (let index = 0; index < totalEntries; index += 1) {
    if (view.getUint32(cursor, true) !== 0x02014b50) {
      throw new Error("ZIP 目录损坏，无法导入项目备份");
    }
    const method = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const fileNameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const rawPath = readString(bytes, cursor + 46, fileNameLength);
    cursor += 46 + fileNameLength + extraLength + commentLength;

    if (
      !rawPath ||
      rawPath.endsWith("/") ||
      rawPath.startsWith("__MACOSX/") ||
      rawPath.endsWith("/.DS_Store") ||
      rawPath === ".DS_Store"
    ) {
      continue;
    }
    if (method !== 0) {
      throw new Error("只能导入 GenStory.cc 导出的项目备份 ZIP");
    }
    if (view.getUint32(localOffset, true) !== 0x04034b50) {
      throw new Error("ZIP 文件损坏，无法导入项目备份");
    }
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    files.push({
      path: rawPath.replaceAll("\\", "/"),
      blob: new Blob([bytes.slice(dataStart, dataStart + compressedSize)]),
    });
  }

  return stripCommonRoot(files).map((file) => ({
    ...file,
    path: normalizeRelativePath(file.path),
  }));
}

function parseTitle(meta: string): string {
  const quoted = meta.match(/^title:\s*"([^"]+)"\s*$/m);
  if (quoted) return quoted[1];
  const singleQuoted = meta.match(/^title:\s*'([^']+)'\s*$/m);
  if (singleQuoted) return singleQuoted[1];
  const plain = meta.match(/^title:\s*(.+?)\s*$/m);
  if (plain) return plain[1].replace(/^['"]|['"]$/g, "").trim();
  const heading = meta.match(/^#\s+(.+)$/m);
  return heading?.[1]?.trim() || "Imported project";
}

function isContentType(value: unknown): value is ContentTypeId {
  return (
    value === "book" ||
    value === "picture-book" ||
    value === "comic" ||
    value === "visual-novel" ||
    value === "interactive-video" ||
    value === "phaser-game"
  );
}

function inferTemplate(paths: string[], meta: string): ContentTypeId {
  const type = meta.match(/^type:\s*([a-z-]+)\s*$/m)?.[1];
  if (isContentType(type)) return type;
  if (paths.some((path) => /chapter-[^/]+\/scenes\/[^/]+\/stage\.ya?ml$/i.test(path))) {
    return "visual-novel";
  }
  if (paths.some((path) => /chapter-[^/]+\/pages\/[^/]+\/script\.md$/i.test(path))) {
    return "comic";
  }
  if (paths.some((path) => /chapter-[^/]+\/pages\/[^/]+\/story\.md$/i.test(path))) {
    return "picture-book";
  }
  if (paths.some((path) => /chapter-[^/]+\/segments\/[^/]+\/script\.md$/i.test(path))) {
    return "interactive-video";
  }
  if (
    paths.includes("index.html") &&
    paths.some((path) => /^src\/scenes\/[^/]+\.js$/i.test(path))
  ) {
    return "phaser-game";
  }
  return "book";
}

async function buildImportedProject(
  files: ZipFile[],
  record?: WorkspaceProjectRecord
): Promise<ImportedProjectSource> {
  const projectFiles = files.filter((file) => !file.path.startsWith(".genstory/"));
  const metaFile = projectFiles.find((file) => file.path === "meta.md");
  if (!metaFile) throw new Error("项目备份缺少作品信息（meta.md），无法恢复作品");
  if (!projectFiles.some((file) => file.path === "AGENTS.md")) {
    throw new Error("项目备份缺少创作规则文件，无法恢复作品");
  }

  const meta = await metaFile.blob.text();
  const template = isContentType(record?.template)
    ? record.template
    : inferTemplate(projectFiles.map((file) => file.path), meta);
  return {
    id: record?.id,
    title: record?.title || parseTitle(meta),
    template,
    lang: record?.lang,
    createdAt: record?.createdAt,
    updatedAt: record?.updatedAt,
    lastOpenedPath: record?.lastOpenedPath,
    files: projectFiles.map((file) => ({
      path: normalizeRelativePath(file.path),
      blob: file.blob,
    })),
  };
}

function parseWorkspaceRecords(value: unknown): WorkspaceProjectRecord[] {
  if (!value || typeof value !== "object") return [];
  const root = value as {
    projects?: unknown;
    catalog?: { projects?: unknown };
  };
  const rawProjects = root.projects ?? root.catalog?.projects;
  if (Array.isArray(rawProjects)) {
    return rawProjects.filter(
      (project): project is WorkspaceProjectRecord =>
        Boolean(project && typeof project === "object")
    ).map((project) => ({
      ...project,
      id: project.id || project.projectId,
      template: project.template || project.type,
    }));
  }
  if (rawProjects && typeof rawProjects === "object") {
    return Object.entries(rawProjects).map(([id, project]) => ({
      ...(project && typeof project === "object"
        ? (project as WorkspaceProjectRecord)
        : {}),
      id:
        (project as WorkspaceProjectRecord | undefined)?.id ||
        (project as WorkspaceProjectRecord | undefined)?.projectId ||
        id,
      template:
        (project as WorkspaceProjectRecord | undefined)?.template ||
        (project as WorkspaceProjectRecord | undefined)?.type,
    }));
  }
  return [];
}

async function readWorkspaceRecords(files: ZipFile[]): Promise<{
  marker: boolean;
  records: WorkspaceProjectRecord[];
}> {
  const markerFile = files.find(
    (file) =>
      file.path === "genstory-workspace.json" ||
      file.path === "workspace.json" ||
      file.path === "catalog.json" ||
      file.path === ".genstory/catalog.json"
  );
  if (!markerFile) return { marker: false, records: [] };
  try {
    return {
      marker: true,
      records: parseWorkspaceRecords(JSON.parse(await markerFile.blob.text())),
    };
  } catch {
    throw new Error("整站备份的工作区清单损坏，无法导入");
  }
}

function collectWorkspaceProjects(
  files: ZipFile[],
  records: WorkspaceProjectRecord[]
): Map<string, { files: ZipFile[]; record: WorkspaceProjectRecord }> {
  const recordsById = new Map(
    records.filter((record) => record.id).map((record) => [record.id!, record])
  );
  const groups = new Map<
    string,
    { files: ZipFile[]; record: WorkspaceProjectRecord }
  >();

  for (const file of files) {
    const parts = file.path.split("/");
    if (parts[0] === "projects") parts.shift();
    if (parts.length < 3) {
      if (parts.length < 2 || !recordsById.has(parts[0])) continue;
      const id = parts[0];
      const record = recordsById.get(id)!;
      const current = groups.get(id) ?? { files: [], record };
      current.files.push({ ...file, path: parts.slice(1).join("/") });
      groups.set(id, current);
      continue;
    }

    const pathTemplate = parts[0];
    const pathId = parts[1];
    const record =
      recordsById.get(pathId) ||
      (isContentType(pathTemplate)
        ? { id: pathId, template: pathTemplate }
        : undefined);
    if (!record?.id) continue;

    const current = groups.get(record.id) ?? { files: [], record };
    if (!current.record.template && record.template) {
      current.record.template = record.template;
    }
    current.files.push({ ...file, path: parts.slice(2).join("/") });
    groups.set(record.id, current);
  }
  return groups;
}

export async function parseBackupZip(blob: Blob): Promise<ImportedBackup> {
  const files = await readZipFiles(blob);
  const workspace = await readWorkspaceRecords(files);
  const workspaceProjects = collectWorkspaceProjects(files, workspace.records);

  if (workspace.marker || workspaceProjects.size > 0) {
    if (workspaceProjects.size === 0) {
      throw new Error("整站备份中没有可恢复的作品");
    }
    const projects = [];
    for (const group of workspaceProjects.values()) {
      projects.push(await buildImportedProject(group.files, group.record));
    }
    return { kind: "workspace", projects };
  }

  return {
    kind: "project",
    project: await buildImportedProject(files),
  };
}

export async function parseProjectSourceZip(
  blob: Blob
): Promise<ImportedProjectSource> {
  const imported = await parseBackupZip(blob);
  if (imported.kind === "workspace") {
    throw new Error("这是整站备份，请从项目列表导入整站备份");
  }
  return imported.project;
}

export function findProjectImportConflicts(
  incoming: readonly ImportedProjectSource[],
  existing: readonly ProjectLike[]
): ImportedProjectSource[] {
  const existingIds = new Set(existing.map((project) => project.id));
  return incoming.filter(
    (project) => Boolean(project.id && existingIds.has(project.id))
  );
}
