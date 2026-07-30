import type { ContentTypeId } from "./content-types";
import { normalizeRelativePath } from "./file-system/paths.ts";


export interface ImportedProjectSource {
  title: string;
  template: ContentTypeId;
  files: { path: string; blob: Blob }[];
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

function stripCommonRoot(paths: string[]): string[] {
  if (paths.includes("meta.md")) return paths;
  const roots = new Set<string>();
  for (const path of paths) {
    const [root] = path.split("/");
    if (root) roots.add(root);
  }
  if (paths.every((path) => !path.includes("/"))) return paths;
  if (roots.size !== 1) return paths;
  const [root] = [...roots];
  return paths.map((path) => path.slice(root.length + 1)).filter(Boolean);
}

function parseTitle(meta: string): string {
  const quoted = meta.match(/^title:\s*"([^"]+)"\s*$/m);
  if (quoted) return quoted[1];
  const plain = meta.match(/^title:\s*(.+?)\s*$/m);
  if (plain) return plain[1].replace(/^['"]|['"]$/g, "").trim();
  const heading = meta.match(/^#\s+(.+)$/m);
  return heading?.[1]?.trim() || "Imported project";
}

function inferTemplate(paths: string[], meta: string): ContentTypeId {
  const type = meta.match(/^type:\s*([a-z-]+)\s*$/m)?.[1];
  if (
   type === "book" ||
    type === "picture-book" ||
    type === "comic" ||
    type === "visual-novel" ||
    type === "interactive-video" ||
    type === "phaser-game"
  ) {
    return type;
  }
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

export async function parseProjectSourceZip(blob: Blob): Promise<ImportedProjectSource> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocd = findEndOfCentralDirectory(bytes);
  const totalEntries = view.getUint16(eocd + 10, true);
  let cursor = view.getUint32(eocd + 16, true);
  const rawFiles: { path: string; blob: Blob }[] = [];


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
    if (!rawPath || rawPath.endsWith("/") || rawPath.startsWith("__MACOSX/")) continue;
    if (method !== 0) {
      throw new Error("只能导入 GenStory.cc 导出的项目备份 ZIP");
    }
    if (view.getUint32(localOffset, true) !== 0x04034b50) {
      throw new Error("ZIP 文件损坏，无法导入项目备份");
    }
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    rawFiles.push({
      path: rawPath.replaceAll("\\", "/"),
      blob: new Blob([bytes.slice(dataStart, dataStart + compressedSize)]),
    });
  }


  const strippedPaths = stripCommonRoot(rawFiles.map((file) => file.path));
  const files = rawFiles.map((file, index) => {
    const path = strippedPaths[index];
    if (!path) throw new Error("项目备份包含空路径，无法恢复作品");
    return {
      path: normalizeRelativePath(path),
      blob: file.blob,
    };
  });
  const metaFile = files.find((file) => file.path === "meta.md");
  if (!metaFile) throw new Error("项目备份缺少作品信息（meta.md），无法恢复作品");
  const meta = await metaFile.blob.text();
  if (!files.some((file) => file.path === "AGENTS.md")) {
    throw new Error("项目备份缺少创作规则文件，无法恢复作品");
  }
  return {
    title: parseTitle(meta),
    template: inferTemplate(files.map((file) => file.path), meta),
    files,
  };
}
