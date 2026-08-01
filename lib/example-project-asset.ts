import { normalizeRelativePath } from "@/lib/file-system/paths";

export interface ExampleProjectAssetFile {
  path: string;
  blob: Blob;
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
  throw new Error("The example asset ZIP is missing its central directory.");
}

function readString(bytes: Uint8Array, start: number, length: number): string {
  return new TextDecoder().decode(bytes.slice(start, start + length));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

async function inflateEntry(data: Uint8Array): Promise<Uint8Array> {
  try {
    const stream = new Blob([toArrayBuffer(data)])
      .stream()
      .pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    throw new Error("The example asset ZIP contains a corrupt compressed file.");
  }
}

export async function readExampleProjectAsset(
  blob: Blob
): Promise<ExampleProjectAssetFile[]> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocd = findEndOfCentralDirectory(bytes);
  const totalEntries = view.getUint16(eocd + 10, true);
  let cursor = view.getUint32(eocd + 16, true);
  const files: ExampleProjectAssetFile[] = [];

  for (let index = 0; index < totalEntries; index += 1) {
    if (view.getUint32(cursor, true) !== 0x02014b50) {
      throw new Error("The example asset ZIP directory is corrupt.");
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
    if (method !== 0 && method !== 8) {
      throw new Error("The example asset ZIP uses an unsupported compression method.");
    }
    if (view.getUint32(localOffset, true) !== 0x04034b50) {
      throw new Error("The example asset ZIP contains a corrupt file header.");
    }
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressedData = bytes.slice(dataStart, dataStart + compressedSize);
    const data = method === 0 ? compressedData : await inflateEntry(compressedData);
    files.push({
      path: rawPath.replaceAll("\\", "/"),
      blob: new Blob([toArrayBuffer(data)]),
    });
  }

  return files.map((file) => ({
    ...file,
    path: normalizeRelativePath(file.path),
  }));
}
