import type { CloudConflict, CloudLocalFile, CloudRemoteFile } from "./types";

export async function blobsEqual(left: Blob | undefined, right: Blob): Promise<boolean> {
  if (!left || left.size !== right.size) return false;
  const [leftBuffer, rightBuffer] = await Promise.all([
    left.arrayBuffer(),
    right.arrayBuffer(),
  ]);
  const leftBytes = new Uint8Array(leftBuffer);
  const rightBytes = new Uint8Array(rightBuffer);
  for (let index = 0; index < leftBytes.length; index += 1) {
    if (leftBytes[index] !== rightBytes[index]) return false;
  }
  return true;
}

export async function findDownloadConflicts(
  remoteFiles: readonly CloudRemoteFile[],
  remoteBlobs: ReadonlyMap<string, Blob>,
  localFiles: ReadonlyMap<string, CloudLocalFile>
): Promise<CloudConflict[]> {
  const conflicts: CloudConflict[] = [];
  for (const file of remoteFiles) {
    const local = localFiles.get(file.path);
    const remoteBlob = remoteBlobs.get(file.path);
    if (!local || !remoteBlob || (await blobsEqual(local.blob, remoteBlob))) continue;
    conflicts.push({
      path: file.path,
      projectId: local.projectId,
      projectTitle: local.projectTitle ?? local.projectId,
      direction: "download-overwrites-local",
    });
  }
  return conflicts;
}

export function findUploadConflicts(
  localFiles: readonly CloudLocalFile[],
  remoteFiles: readonly CloudRemoteFile[]
): CloudConflict[] {
  const remotePaths = new Set(remoteFiles.map((file) => file.path));
  return localFiles
    .filter((file) => remotePaths.has(file.path))
    .map((file) => ({
      path: file.path,
      projectId: file.projectId,
      projectTitle: file.projectTitle ?? file.projectId,
      direction: "upload-overwrites-remote" as const,
    }));
}
