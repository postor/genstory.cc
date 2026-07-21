"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CloudDownload,
  CloudUpload,
  FileDown,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InteractionModal } from "@/components/ui/interaction-modal";
import {
  createCloudRemoteStore,
  type CloudRemoteStore,
} from "@/lib/cloud-sync/providers";
import { loadCloudSyncSettings } from "@/lib/cloud-sync/storage";
import {
  applyCloudDownloadPlan,
  prepareCloudDownloadPlan,
  prepareCloudUploadPlan,
  uploadLocalWorkspace,
  type LocalWorkspaceSnapshot,
} from "@/lib/cloud-sync/sync";
import type {
  CloudConflict,
  CloudDownloadPlan,
  CloudRemoteFile,
  CloudSyncPhase,
  CloudSyncProgress,
} from "@/lib/cloud-sync/types";
import { CLOUD_OAUTH_CONFIG, loadCloudToken } from "@/lib/cloud-sync/oauth";
import {
  deleteProject,
  listProjects,
  saveProject,
  type Project,
} from "@/lib/local-projects";
import {
  openProjectDirectory,
  removeProjectDirectory,
  restoreProjectDirectory,
  supportsFileSystemAccess,
} from "@/lib/file-system/browser";
import { exportProjectDirectoryZip } from "@/lib/project-export";
import { parseProjectSourceZip } from "@/lib/project-import";
import { useLang } from "@/lib/i18n";
import { languageInfo } from "@/lib/platform-i18n";
import { localizePlatformErrorMessage } from "@/lib/platform-errors";

type CloudAction = "upload" | "download" | "sync";

interface CloudUploadPlan {
  snapshot: LocalWorkspaceSnapshot;
  remoteFiles: CloudRemoteFile[];
  conflicts: CloudConflict[];
}

const CLOUD_PROGRESS_KEYS: Record<CloudSyncPhase, string> = {
  authorizing: "projects.cloudPreparing",
  listing: "projects.cloudPreparing",
  comparing: "projects.cloudComparing",
  downloading: "projects.cloudDownloading",
  writing: "projects.cloudWriting",
  uploading: "projects.cloudUploading",
};

export default function ProjectsPage() {
  const { lang, t } = useLang();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [projectPendingDelete, setProjectPendingDelete] =
    useState<Project | null>(null);
  const [cloudOperation, setCloudOperation] = useState<CloudAction | null>(null);
  const [cloudProgress, setCloudProgress] =
    useState<CloudSyncProgress | null>(null);
  const [cloudFeedback, setCloudFeedback] = useState<string | null>(null);
  const [cloudConfirm, setCloudConfirm] = useState<CloudAction | null>(null);
  const [downloadPlan, setDownloadPlan] = useState<CloudDownloadPlan | null>(
    null
  );
  const [uploadPlan, setUploadPlan] = useState<CloudUploadPlan | null>(null);
  const [cloudTargetProject, setCloudTargetProject] = useState<Project | null>(
    null
  );

  useEffect(() => {
    document.title = t("meta.projectsTitle");
  }, [t]);

  async function refresh() {
    try {
      const nextProjects = await listProjects();
      setProjects(nextProjects);
    } catch (e) {
      setError(localizePlatformErrorMessage(e instanceof Error ? e.message : String(e), lang));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listProjects();
        if (!cancelled) setProjects(list);
      } catch (e) {
        if (!cancelled) {
          setError(localizePlatformErrorMessage(e instanceof Error ? e.message : String(e), lang));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  async function confirmDeleteProject() {
    if (!projectPendingDelete) return;
    const project = projectPendingDelete;
    setProjectPendingDelete(null);
    try {
      await removeProjectDirectory(project.template, project.id);
      await deleteProject(project.id);
      await refresh();
    } catch (e) {
      setError(localizePlatformErrorMessage(e instanceof Error ? e.message : String(e), lang));
    }
  }

  async function handleDownloadSource(project: Project) {
    try {
      const root = await openProjectDirectory(project.template, project.id);
      await exportProjectDirectoryZip(root, `${project.title || "project"}-source`);
    } catch (e) {
      setError(localizePlatformErrorMessage(e instanceof Error ? e.message : String(e), lang));
    }
  }

  function requireCloudStore(): CloudRemoteStore {
    const settings = loadCloudSyncSettings();
    if (!CLOUD_OAUTH_CONFIG[settings.provider].clientId) {
      throw new Error(t("projects.cloudProviderNotConfigured"));
    }
    if (!loadCloudToken(settings.provider)) {
      throw new Error(t("projects.cloudProviderMissing"));
    }
    return createCloudRemoteStore(settings.provider);
  }

  function resetCloudState() {
    setCloudProgress(null);
    setCloudFeedback(null);
    setError(null);
  }

  function setCloudError(reason: unknown) {
    const message = reason instanceof Error ? reason.message : String(reason);
    setError(t("projects.cloudOperationFailed", { message }));
  }

  async function prepareCloudUpload(project?: Project) {
    resetCloudState();
    setCloudConfirm(null);
    setDownloadPlan(null);
    setUploadPlan(null);
    setCloudTargetProject(project ?? null);
    setCloudOperation("upload");
    try {
      const targetProjects = project ? [project] : projects;
      if (targetProjects.length === 0) throw new Error(t("projects.cloudNoProjects"));
      const store = requireCloudStore();
      const plan = await prepareCloudUploadPlan(store, targetProjects, setCloudProgress);
      setUploadPlan(plan);
      setCloudConfirm("upload");
    } catch (e) {
      setCloudError(e);
    } finally {
      setCloudOperation(null);
    }
  }

  async function prepareCloudDownload(
    project?: Project,
    nextConfirm: "download" | "sync" = "download"
  ) {
    resetCloudState();
    setCloudConfirm(null);
    setDownloadPlan(null);
    setUploadPlan(null);
    setCloudTargetProject(project ?? null);
    setCloudOperation(nextConfirm);
    try {
      const targetProjects = project ? [project] : projects;
      const store = requireCloudStore();
      const plan = await prepareCloudDownloadPlan(
        store,
        targetProjects,
        setCloudProgress,
        project ? { remoteProjectScope: targetProjects } : undefined
      );
      setDownloadPlan(plan);
      setCloudConfirm(nextConfirm);
    } catch (e) {
      setCloudError(e);
    } finally {
      setCloudOperation(null);
    }
  }

  async function handleCloudUpload() {
    const plan = uploadPlan;
    if (!plan) return;
    setCloudConfirm(null);
    setCloudOperation("upload");
    setCloudProgress(null);
    setError(null);
    try {
      const store = requireCloudStore();
      await uploadLocalWorkspace(
        store,
        plan.snapshot,
        plan.remoteFiles,
        setCloudProgress
      );
      setCloudFeedback(
        cloudTargetProject
          ? t("projects.cloudSuccessUploadProject", {
              title: cloudTargetProject.title,
            })
          : t("projects.cloudSuccessUpload")
      );
      setUploadPlan(null);
    } catch (e) {
      setCloudError(e);
    } finally {
      setCloudOperation(null);
      setCloudProgress(null);
    }
  }

  async function applyCloudDownload(): Promise<Project[]> {
    const plan = downloadPlan;
    if (!plan) return projects;
    const nextProjects = await applyCloudDownloadPlan(
      plan,
      projects,
      lang,
      setCloudProgress
    );
    setProjects(nextProjects);
    setLoading(false);
    return nextProjects;
  }

  async function handleCloudDownload() {
    if (!downloadPlan) return;
    setCloudConfirm(null);
    setCloudOperation("download");
    setCloudProgress(null);
    setError(null);
    try {
      await applyCloudDownload();
      setCloudFeedback(
        cloudTargetProject
          ? t("projects.cloudSuccessDownloadProject", {
              title: cloudTargetProject.title,
            })
          : t("projects.cloudSuccessDownload")
      );
      setDownloadPlan(null);
    } catch (e) {
      setCloudError(e);
    } finally {
      setCloudOperation(null);
      setCloudProgress(null);
    }
  }

  async function handleCloudSync() {
    if (!downloadPlan) return;
    setCloudConfirm(null);
    setCloudOperation("sync");
    setCloudProgress(null);
    setCloudFeedback(null);
    setError(null);
    try {
      const store = requireCloudStore();
      const nextProjects = await applyCloudDownload();
      if (nextProjects.length === 0) throw new Error(t("projects.cloudNoProjects"));
      const plan = await prepareCloudUploadPlan(
        store,
        nextProjects,
        setCloudProgress
      );
      await uploadLocalWorkspace(
        store,
        plan.snapshot,
        plan.remoteFiles,
        setCloudProgress
      );
      setCloudFeedback(t("projects.cloudSuccessSync"));
      setDownloadPlan(null);
    } catch (e) {
      setCloudError(e);
    } finally {
      setCloudOperation(null);
      setCloudProgress(null);
    }
  }

  function startTitleEditing(project: Project) {
    setEditingProjectId(project.id);
    setTitleDraft(project.title);
  }

  function cancelTitleEditing() {
    setEditingProjectId(null);
    setTitleDraft("");
  }

  async function commitTitleChange(project: Project) {
    const nextTitle = titleDraft.trim() || project.title;
    setEditingProjectId(null);
    setTitleDraft("");
    if (nextTitle === project.title) return;

    const now = Math.max(project.updatedAt + 1, project.createdAt);
    try {
      await saveProject({ ...project, title: nextTitle, updatedAt: now });
      setProjects((previous) =>
        previous.map((item) =>
          item.id === project.id
            ? { ...item, title: nextTitle, updatedAt: now }
            : item
        )
      );
    } catch (e) {
      setError(localizePlatformErrorMessage(e instanceof Error ? e.message : String(e), lang));
    }
  }

  async function handleImportSource(file: File | undefined) {
    if (!file) return;
    setImporting(true);
    setError(null);
    try {
      if (!supportsFileSystemAccess()) {
        throw new Error(t("create.browserUnsupported"));
      }
      const imported = await parseProjectSourceZip(file);
      const id = crypto.randomUUID();
      const now = Date.now();
      await restoreProjectDirectory(imported.template, id, imported.files);
      await saveProject({
        id,
        template: imported.template,
        title: imported.title,
        lang,
        createdAt: now,
        updatedAt: now,
      });
      await refresh();
    } catch (e) {
      setError(localizePlatformErrorMessage(e instanceof Error ? e.message : String(e), lang));
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  function progressText() {
    if (!cloudProgress) return t("projects.cloudPreparing");
    const completed = Math.min(
      cloudProgress.total,
      Math.floor(cloudProgress.completed)
    );
    const total = cloudProgress.total;
    return t(CLOUD_PROGRESS_KEYS[cloudProgress.phase], { completed, total });
  }

  function conflictPreview(conflicts: CloudConflict[], label: string) {
    const preview = conflicts.slice(0, 5);
    const moreCount = Math.max(0, conflicts.length - preview.length);
    if (preview.length === 0) return null;
    return (
      <div className="rounded-lg border bg-muted/40 p-3 text-xs">
        <p className="mb-2 font-medium">{label}</p>
        <ul className="space-y-1 text-muted-foreground">
          {preview.map((conflict) => (
            <li key={`${conflict.direction}:${conflict.path}`} className="break-all">
              {conflict.projectTitle} / {conflict.path}
            </li>
          ))}
        </ul>
        {moreCount > 0 ? (
          <p className="mt-2 text-muted-foreground">
            {t("projects.cloudConflictMore", { count: moreCount })}
          </p>
        ) : null}
      </div>
    );
  }

  const progressValue =
    cloudProgress && cloudProgress.total > 0
      ? Math.min(100, Math.round((cloudProgress.completed / cloudProgress.total) * 100))
      : 0;
  const downloadConflictCount = downloadPlan?.conflicts.length ?? 0;
  const uploadConflictCount = uploadPlan?.conflicts.length ?? 0;
  const syncUploadConflictCount = downloadPlan?.uploadConflicts.length ?? 0;
  const downloadDescription = downloadPlan
    ? downloadConflictCount > 0
      ? t(
          cloudTargetProject
            ? "projects.cloudDownloadProjectDescription"
            : "projects.cloudDownloadDescription",
          { count: downloadConflictCount }
        )
      : t(
          cloudTargetProject
            ? "projects.cloudDownloadProjectNoConflict"
            : "projects.cloudDownloadNoConflict"
        )
    : "";
  const uploadDescription = [
    t(
      cloudTargetProject
        ? "projects.cloudUploadProjectDescription"
        : "projects.cloudUploadDescription"
    ),
    uploadConflictCount > 0
      ? t("projects.cloudUploadConflictCount", { count: uploadConflictCount })
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  const syncDescription = [
    downloadDescription,
    t("projects.cloudSyncDescription"),
    syncUploadConflictCount > 0
      ? t("projects.cloudUploadConflictCount", { count: syncUploadConflictCount })
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{t("projects.title")}</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            {t("projects.storageNote")}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("settings.cloud.title")} ·{" "}
            <Link href="/settings" className="underline underline-offset-4">
              {t("nav.settings")}
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".zip,application/zip"
            className="sr-only"
            onChange={(event) => void handleImportSource(event.currentTarget.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
          >
            <Upload className="size-4" />
            {importing ? t("projects.importing") : t("projects.import")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void prepareCloudDownload()}
            disabled={cloudOperation !== null || importing}
          >
            <CloudDownload className="size-4" />
            {t("projects.cloudDownload")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void prepareCloudUpload()}
            disabled={cloudOperation !== null || importing}
          >
            <CloudUpload className="size-4" />
            {t("projects.cloudUpload")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void prepareCloudDownload(undefined, "sync")}
            disabled={cloudOperation !== null || importing}
          >
            <RefreshCw className="size-4" />
            {t("projects.cloudSync")}
          </Button>
          <Button render={<Link href="/projects/new" />}>
            <Plus className="size-4" />
            {t("projects.new")}
          </Button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {cloudFeedback && (
        <p className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
          {cloudFeedback}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">…</p>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            <p>
              {t("projects.emptyBeforeNew")}
              <Link href="/projects/new" className="font-medium text-primary underline underline-offset-4">
                {t("projects.new")}
              </Link>
              {t("projects.emptyAfterNew")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader className="gap-1">
                <CardTitle className="min-w-0">
                  {editingProjectId === project.id ? (
                    <Input
                      autoFocus
                      value={titleDraft}
                      onChange={(event) => setTitleDraft(event.target.value)}
                      onFocus={(event) => event.currentTarget.select()}
                      onBlur={() => void commitTitleChange(project)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void commitTitleChange(project);
                        } else if (event.key === "Escape") {
                          event.preventDefault();
                          cancelTitleEditing();
                        }
                      }}
                      aria-label={t("editor.name")}
                      className="h-8 text-base font-semibold"
                    />
                  ) : (
                    <div className="flex min-w-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startTitleEditing(project)}
                        className="min-w-0 truncate text-left hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        {project.title}
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => startTitleEditing(project)}
                        aria-label={t("projects.editTitle")}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {t("projects.updatedAt")}{" "}
                  {new Date(project.updatedAt).toLocaleString(
                    languageInfo[lang].dateLocale
                  )}
                </p>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button
                  render={<Link href={`/projects/editor?id=${project.id}`} />}
                  size="sm"
                >
                  {t("projects.open")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void handleDownloadSource(project)}
                >
                  <FileDown className="size-4" />
                  {t("editor.downloadSource")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void prepareCloudDownload(project)}
                  disabled={cloudOperation !== null || importing}
                >
                  <CloudDownload className="size-4" />
                  {t("projects.cloudDownloadProject")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void prepareCloudUpload(project)}
                  disabled={cloudOperation !== null || importing}
                >
                  <CloudUpload className="size-4" />
                  {t("projects.cloudUploadProject")}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setProjectPendingDelete(project)}
                >
                  <Trash2 className="size-4" />
                  {t("projects.delete")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <InteractionModal
        open={projectPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setProjectPendingDelete(null);
        }}
        title={t("projects.deleteTitle")}
        description={
          projectPendingDelete
            ? t("projects.deleteDescription", { title: projectPendingDelete.title })
            : ""
        }
        confirmLabel={t("projects.deleteConfirm")}
        confirmVariant="destructive"
        cancelLabel={t("common.cancel")}
        onConfirm={() => void confirmDeleteProject()}
      />
      <InteractionModal
        open={cloudConfirm === "upload"}
        onOpenChange={(open) => {
          if (!open) setCloudConfirm(null);
        }}
        title={t("projects.cloudUploadTitle")}
        description={uploadDescription}
        confirmLabel={t("projects.cloudUploadConfirm")}
        confirmVariant="destructive"
        confirmDisabled={!uploadPlan}
        cancelLabel={t("common.cancel")}
        onConfirm={() => void handleCloudUpload()}
      >
        {uploadPlan
          ? conflictPreview(
              uploadPlan.conflicts,
              t("projects.cloudUploadConflictCount", {
                count: uploadPlan.conflicts.length,
              })
            )
          : null}
      </InteractionModal>
      <InteractionModal
        open={cloudConfirm === "download"}
        onOpenChange={(open) => {
          if (!open) setCloudConfirm(null);
        }}
        title={t("projects.cloudDownloadTitle")}
        description={downloadDescription}
        confirmLabel={t("projects.cloudDownloadConfirm")}
        confirmVariant={downloadConflictCount > 0 ? "destructive" : "default"}
        confirmDisabled={!downloadPlan}
        cancelLabel={t("common.cancel")}
        onConfirm={() => void handleCloudDownload()}
      >
        {downloadPlan
          ? conflictPreview(downloadPlan.conflicts, t("projects.cloudConflictPreview"))
          : null}
      </InteractionModal>
      <InteractionModal
        open={cloudConfirm === "sync"}
        onOpenChange={(open) => {
          if (!open) setCloudConfirm(null);
        }}
        title={t("projects.cloudSyncTitle")}
        description={syncDescription}
        confirmLabel={t("projects.cloudSyncConfirm")}
        confirmVariant="destructive"
        confirmDisabled={!downloadPlan}
        cancelLabel={t("common.cancel")}
        onConfirm={() => void handleCloudSync()}
      >
        {downloadPlan
          ? conflictPreview(downloadPlan.conflicts, t("projects.cloudConflictPreview"))
          : null}
      </InteractionModal>
      <Dialog open={cloudOperation !== null}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("settings.cloud.title")}</DialogTitle>
            <DialogDescription>{progressText()}</DialogDescription>
          </DialogHeader>
          <progress
            role="progressbar"
            className="h-2 w-full"
            max={100}
            value={progressValue}
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}
