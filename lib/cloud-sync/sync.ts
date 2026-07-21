import type { ContentTypeId } from "../content-types.ts";
import { contentTypeById } from "../content-types.ts";
import {
  listProjectFiles,
  openProjectDirectory,
  readFile,
  restoreProjectDirectory,
} from "../file-system/browser.ts";
import { listProjects, saveProject, type Project } from "../local-projects.ts";
import { parseRemoteProjectPath, remoteProjectPath } from "./paths.ts";
import { findDownloadConflicts, findUploadConflicts } from "./merge.ts";
import { filterRemoteFilesForProjects } from "./scope.ts";
import type {
  CloudDownloadPlan,
  CloudLocalFile,
  CloudRemoteFile,
  CloudSyncProgress,
} from "./types.ts";
import type { CloudRemoteStore } from "./providers.ts";

export interface LocalWorkspaceSnapshot {
  projects: Project[];
  files: CloudLocalFile[];
}

export type ProgressReporter = (progress: CloudSyncProgress) => void;

export async function collectLocalWorkspace(
  projects: readonly Project[],
  report?: ProgressReporter
): Promise<LocalWorkspaceSnapshot> {
  const files: CloudLocalFile[] = [];
  const total = projects.length;
  for (let index = 0; index < projects.length; index += 1) {
    const project = projects[index];
    const root = await openProjectDirectory(project.template, project.id);
    const entries = await listProjectFiles(root);
    for (const entry of entries) {
      if (entry.kind !== "file") continue;
      files.push({
        path: remoteProjectPath(project, entry.path),
        projectId: project.id,
        projectTitle: project.title,
        blob: await readFile(root, entry.path),
      });
    }
    report?.({ phase: "listing", completed: index + 1, total });
  }
  return { projects: [...projects], files };
}

export async function prepareCloudDownloadPlan(
  store: CloudRemoteStore,
  projects: readonly Project[],
  report?: ProgressReporter,
  options?: { remoteProjectScope?: readonly Pick<Project, "id">[] }
): Promise<CloudDownloadPlan> {
  const local = await collectLocalWorkspace(projects, report);
  const listedRemoteFiles = await store.listFiles();
  const remoteFiles = options?.remoteProjectScope
    ? filterRemoteFilesForProjects(listedRemoteFiles, options.remoteProjectScope)
    : listedRemoteFiles;
  const remoteBlobs = new Map<string, Blob>();
  for (let index = 0; index < remoteFiles.length; index += 1) {
    const file = remoteFiles[index];
    remoteBlobs.set(
      file.path,
      await store.downloadFile(file, (percentage) => {
        report?.({
          phase: "downloading",
          completed: index + percentage / 100,
          total: remoteFiles.length,
        });
      })
    );
    report?.({ phase: "downloading", completed: index + 1, total: remoteFiles.length });
  }
  const localMap = new Map(local.files.map((file) => [file.path, file]));
  const conflicts = await findDownloadConflicts(remoteFiles, remoteBlobs, localMap);
  const uploadConflicts = findUploadConflicts(local.files, remoteFiles);
  report?.({ phase: "comparing", completed: remoteFiles.length, total: remoteFiles.length });
  return { remoteFiles, remoteBlobs, localFiles: localMap, conflicts, uploadConflicts };
}

export async function prepareCloudUploadPlan(
  store: CloudRemoteStore,
  projects: readonly Project[],
  report?: ProgressReporter
): Promise<{ snapshot: LocalWorkspaceSnapshot; remoteFiles: CloudRemoteFile[]; conflicts: ReturnType<typeof findUploadConflicts> }> {
  const snapshot = await collectLocalWorkspace(projects, report);
  const remoteFiles = await store.listFiles();
  return {
    snapshot,
    remoteFiles,
    conflicts: findUploadConflicts(snapshot.files, remoteFiles),
  };
}

export async function uploadLocalWorkspace(
  store: CloudRemoteStore,
  snapshot: LocalWorkspaceSnapshot,
  remoteFiles: readonly CloudRemoteFile[],
  report?: ProgressReporter
): Promise<void> {
  const existing = new Map(remoteFiles.map((file) => [file.path, file]));
  const total = snapshot.files.length;
  for (let index = 0; index < snapshot.files.length; index += 1) {
    const file = snapshot.files[index];
    await store.uploadFile(
      file.path,
      file.blob,
      existing.get(file.path),
      (percentage) =>
        report?.({
          phase: "uploading",
          completed: index + percentage / 100,
          total,
        })
    );
    report?.({ phase: "uploading", completed: index + 1, total });
  }
}

function parseTitle(meta: string, fallback: string): string {
  const frontmatter = meta.match(/^title:\s*(?:"([^"]+)"|'([^']+)'|(.+?))\s*$/m);
  return frontmatter?.[1] ?? frontmatter?.[2] ?? frontmatter?.[3]?.trim() ?? fallback;
}

function isContentType(value: string): value is ContentTypeId {
  return value in contentTypeById;
}

export async function applyCloudDownloadPlan(
  plan: CloudDownloadPlan,
  projects: readonly Project[],
  lang: Project["lang"],
  report?: ProgressReporter
): Promise<Project[]> {
  const localById = new Map(projects.map((project) => [project.id, project]));
  const grouped = new Map<
    string,
    { template: ContentTypeId; projectId: string; files: { path: string; blob: Blob }[] }
  >();
  for (const remote of plan.remoteFiles) {
    const blob = plan.remoteBlobs.get(remote.path);
    if (!blob) continue;
    const parsed = parseRemoteProjectPath(remote.path);
    if (!isContentType(parsed.template)) {
      throw new Error(`云端文件包含未知作品类型：${parsed.template}`);
    }
    const current = grouped.get(parsed.projectId) ?? {
      template: parsed.template,
      projectId: parsed.projectId,
      files: [],
    };
    if (current.template !== parsed.template) {
      throw new Error(`云端项目类型不一致：${parsed.projectId}`);
    }
    current.files.push({ path: parsed.filePath, blob });
    grouped.set(parsed.projectId, current);
  }

  const total = plan.remoteFiles.length;
  let completed = 0;
  for (const group of grouped.values()) {
    const local = localById.get(group.projectId);
    if (local && local.template !== group.template) {
      throw new Error(`项目类型不一致，无法合并：${group.projectId}`);
    }
    await restoreProjectDirectory(group.template, group.projectId, group.files);
    const remoteMeta = group.files.find((file) => file.path === "meta.md");
    const title = remoteMeta
      ? parseTitle(await remoteMeta.blob.text(), group.projectId)
      : local?.title ?? group.projectId;
    const now = Date.now();
    await saveProject({
      id: group.projectId,
      template: group.template,
      title: local?.title ?? title,
      lang: local?.lang ?? lang,
      createdAt: local?.createdAt ?? now,
      updatedAt: Math.max(local?.updatedAt ?? 0, now),
      lastOpenedPath: local?.lastOpenedPath,
    });
    completed += group.files.length;
    report?.({ phase: "writing", completed, total });
  }
  return listProjects();
}
