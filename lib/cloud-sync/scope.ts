import { parseRemoteProjectPath } from "./paths.ts";
import type { CloudRemoteFile } from "./types.ts";

export function filterRemoteFilesForProjects(
  remoteFiles: readonly CloudRemoteFile[],
  projects: readonly { id: string }[]
): CloudRemoteFile[] {
  const projectIds = new Set(projects.map((project) => project.id));
  return remoteFiles.filter((file) => {
    try {
      return projectIds.has(parseRemoteProjectPath(file.path).projectId);
    } catch {
      return false;
    }
  });
}
