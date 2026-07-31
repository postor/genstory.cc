"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CloudDownload,
  CloudUpload,
  Clapperboard,
  Ellipsis,
  FileImage,
  FileDown,
  FolderOpen,
  Gamepad2,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Share2,
  Sparkles,
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
  Popover,
  PopoverPopup,
  PopoverPortal,
  PopoverPositioner,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import {
  CLOUD_PROVIDER_LABELS,
  type CloudConflict,
  type CloudDownloadPlan,
  type CloudRemoteFile,
  type CloudSyncPhase,
  type CloudSyncProgress,
} from "@/lib/cloud-sync/types";
import {
  beginCloudOAuth,
  CLOUD_OAUTH_CONFIG,
  loadCloudToken,
  requestGoogleToken,
} from "@/lib/cloud-sync/oauth";
import { contentTypeById, type ContentTypeId } from "@/lib/content-types";
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
import {
  findProjectImportConflicts,
  parseBackupZip,
  type ImportedBackup,
  type ImportedProjectSource,
} from "@/lib/project-import";
import {
  hasProjectCoverUrl,
  readProjectCoverUrl,
} from "@/lib/project-cover";
import { useLang } from "@/lib/i18n";
import { languageInfo } from "@/lib/platform-i18n";
import { localizePlatformErrorMessage } from "@/lib/platform-errors";
import { ProjectTypeCover } from "@/components/project-cover";

type CloudAction = "upload" | "download";

interface CloudUploadPlan {
  snapshot: LocalWorkspaceSnapshot;
  remoteFiles: CloudRemoteFile[];
  conflicts: CloudConflict[];
}

interface PendingProjectImport {
  backup: ImportedBackup;
  conflicts: ImportedProjectSource[];
}

const CLOUD_PROGRESS_KEYS: Record<CloudSyncPhase, string> = {
  authorizing: "projects.cloudPreparing",
  listing: "projects.cloudPreparing",
  comparing: "projects.cloudComparing",
  downloading: "projects.cloudDownloading",
  writing: "projects.cloudWriting",
  uploading: "projects.cloudUploading",
};

const projectTypeIcons: Record<ContentTypeId, typeof BookOpen> = {
  book: BookOpen,
  "picture-book": BookOpen,
  comic: FileImage,
  "visual-novel": MessageCircle,
  "interactive-video": Clapperboard,
  "phaser-game": Gamepad2,
};

export default function ProjectsPage() {
  const { lang, t } = useLang();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectCoverImages, setProjectCoverImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [pendingProjectImport, setPendingProjectImport] =
    useState<PendingProjectImport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [projectPendingDelete, setProjectPendingDelete] =
    useState<Project | null>(null);
  const [cloudOperation, setCloudOperation] = useState<CloudAction | null>(null);
  const [cloudProgress, setCloudProgress] =
    useState<CloudSyncProgress | null>(null);
  const [cloudFeedback, setCloudFeedback] = useState<string | null>(null);
  const [cloudAuthorizationExpired, setCloudAuthorizationExpired] = useState(false);
  const [reconnectingCloud, setReconnectingCloud] = useState(false);
  const [openProjectMenuId, setOpenProjectMenuId] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
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

  useEffect(() => {
    let cancelled = false;
    const coverUrls: string[] = [];

    if (projects.length === 0) {
      return () => {
        coverUrls.forEach((url) => URL.revokeObjectURL(url));
      };
    }

    void Promise.all(
      projects.map(async (project) => {
        const coverUrl = await readProjectCoverUrl(project);
        if (coverUrl) coverUrls.push(coverUrl);
        return [project.id, coverUrl] as const;
      }),
    )
      .then((entries) => {
        if (cancelled) {
          coverUrls.forEach((url) => URL.revokeObjectURL(url));
          return;
        }
        setProjectCoverImages(Object.fromEntries(entries.filter(hasProjectCoverUrl)));
      })
      .catch(() => {
        if (!cancelled) setProjectCoverImages({});
      });

    return () => {
      cancelled = true;
      coverUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [projects]);

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

  async function handleShareProject(project: Project) {
    const url = new URL(
      `/projects/editor?id=${encodeURIComponent(project.id)}`,
      window.location.origin
    ).toString();

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: project.title,
          text: t("projects.shareText", { title: project.title }),
          url,
        });
        return;
      }

      if (typeof navigator.clipboard?.writeText === "function") {
        await navigator.clipboard.writeText(url);
        setShareFeedback(t("projects.shareCopied"));
        return;
      }

      setError(t("projects.shareUnsupported"));
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
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

  async function ensureCloudAuthorization(): Promise<void> {
    const settings = loadCloudSyncSettings();
    if (!CLOUD_OAUTH_CONFIG[settings.provider].clientId) {
      throw new Error(t("projects.cloudProviderNotConfigured"));
    }
    if (loadCloudToken(settings.provider)) return;

    if (settings.provider === "google-drive") {
      await requestGoogleToken(settings.rememberAuthorization);
      return;
    }

    await beginCloudOAuth(settings.provider, settings.rememberAuthorization);
  }

  function resetCloudState() {
    setCloudProgress(null);
    setCloudFeedback(null);
    setCloudAuthorizationExpired(false);
    setError(null);
  }

  function isCloudAuthorizationExpired(reason: unknown): boolean {
    const message = reason instanceof Error ? reason.message : String(reason);
    return message.includes("云端授权已过期") || message.includes("Cloud authorization has expired");
  }

  function setCloudError(reason: unknown) {
    const message = reason instanceof Error ? reason.message : String(reason);
    setCloudAuthorizationExpired(isCloudAuthorizationExpired(reason));
    setError(t("projects.cloudOperationFailed", { message }));
  }

  async function handleCloudReconnect() {
    const settings = loadCloudSyncSettings();
    setReconnectingCloud(true);
    setError(null);
    setCloudFeedback(null);
    try {
      if (settings.provider === "google-drive") {
        await requestGoogleToken(settings.rememberAuthorization, true);
      } else {
        await beginCloudOAuth(settings.provider, settings.rememberAuthorization);
      }
      setCloudAuthorizationExpired(false);
      setCloudFeedback(
        t("settings.cloud.connected", {
          provider: CLOUD_PROVIDER_LABELS[settings.provider][lang],
        })
      );
    } catch (reason) {
      setCloudError(reason);
    } finally {
      setReconnectingCloud(false);
    }
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
      await ensureCloudAuthorization();
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

  async function prepareCloudDownload(project?: Project) {
    resetCloudState();
    setCloudConfirm(null);
    setDownloadPlan(null);
    setUploadPlan(null);
    setCloudTargetProject(project ?? null);
    setCloudOperation("download");
    try {
      const targetProjects = project ? [project] : projects;
      await ensureCloudAuthorization();
      const store = requireCloudStore();
      const plan = await prepareCloudDownloadPlan(
        store,
        targetProjects,
        setCloudProgress,
        project ? { remoteProjectScope: targetProjects } : undefined
      );
      setDownloadPlan(plan);
      setCloudConfirm("download");
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

  async function restoreImportedBackup(
    backup: ImportedBackup,
    overwriteConflicts: boolean
  ) {
    const incoming =
      backup.kind === "workspace" ? backup.projects : [backup.project];
    const currentById = new Map(projects.map((project) => [project.id, project]));
    const conflictIds = new Set(
      findProjectImportConflicts(incoming, projects).map((project) => project.id)
    );

    for (const imported of incoming) {
      const id = imported.id || crypto.randomUUID();
      const existing = currentById.get(id);
      if (existing && overwriteConflicts && conflictIds.has(id)) {
        await removeProjectDirectory(existing.template, existing.id);
      }

      const now = Date.now();
      await restoreProjectDirectory(imported.template, id, imported.files);
      await saveProject({
        id,
        template: imported.template,
        title: imported.title,
        lang: imported.lang ?? existing?.lang ?? lang,
        createdAt: imported.createdAt ?? existing?.createdAt ?? now,
        updatedAt: Math.max(imported.updatedAt ?? 0, existing?.updatedAt ?? 0, now),
        lastOpenedPath: imported.lastOpenedPath ?? existing?.lastOpenedPath,
      });
    }
    await refresh();
  }

  async function confirmProjectImportOverwrite() {
    const pending = pendingProjectImport;
    if (!pending) return;
    setPendingProjectImport(null);
    setImporting(true);
    setError(null);
    try {
      await restoreImportedBackup(pending.backup, true);
    } catch (e) {
      setError(localizePlatformErrorMessage(e instanceof Error ? e.message : String(e), lang));
    } finally {
      setImporting(false);
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
      const backup = await parseBackupZip(file);
      const incoming =
        backup.kind === "workspace" ? backup.projects : [backup.project];
      const conflicts = findProjectImportConflicts(incoming, projects);
      if (conflicts.length > 0) {
        setPendingProjectImport({ backup, conflicts });
        return;
      }
      await restoreImportedBackup(backup, false);
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
  return (
    <main className="min-h-full bg-[linear-gradient(180deg,#f8f6ff_0%,#ffffff_34%,#fbfaff_100%)] text-[#121331]">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t("projects.title")}
              </h1>
              <Sparkles className="size-5 text-[#8c5aff]" aria-hidden="true" />
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6b6a89] sm:text-base">
              {t("projects.storageNote")}
            </p>
            <p className="mt-2 text-xs text-[#8986a3]">
              {t("settings.cloud.title")} ·{" "}
              <Link
                href="/settings"
                className="font-medium text-[#6f45dc] underline decoration-[#cfc0ff] underline-offset-4 hover:text-[#4c27ba]"
              >
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
              className="border-[#ddd3ff] bg-white/75 text-[#5e469c] shadow-[0_8px_18px_rgba(92,75,160,0.05)] hover:border-[#cfc0ff] hover:bg-[#f3efff] hover:text-[#4f35a2]"
              onClick={() => importInputRef.current?.click()}
              disabled={importing}
            >
              <Upload className="size-4" />
              {importing ? t("projects.importing") : t("projects.import")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-[#ddd3ff] bg-white/75 text-[#5e469c] shadow-[0_8px_18px_rgba(92,75,160,0.05)] hover:border-[#cfc0ff] hover:bg-[#f3efff] hover:text-[#4f35a2]"
              onClick={() => void prepareCloudDownload()}
              disabled={cloudOperation !== null || importing}
            >
              <CloudDownload className="size-4" />
              {t("projects.cloudDownload")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-[#ddd3ff] bg-white/75 text-[#5e469c] shadow-[0_8px_18px_rgba(92,75,160,0.05)] hover:border-[#cfc0ff] hover:bg-[#f3efff] hover:text-[#4f35a2]"
              onClick={() => void prepareCloudUpload()}
              disabled={cloudOperation !== null || importing}
            >
              <CloudUpload className="size-4" />
              {t("projects.cloudUpload")}
            </Button>
            <Button
              render={<Link href="/projects/new" />}
              className="bg-[#8754ff] text-white shadow-[0_12px_30px_rgba(95,44,255,0.24)] hover:bg-[#7642ef]"
            >
              <Plus className="size-4" />
              {t("projects.new")}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-[#f0b8c5] bg-[#fff4f6] p-4 text-sm text-[#a23a54] shadow-[0_10px_24px_rgba(176,69,100,0.06)]">
            <p className="min-w-0 flex-1 break-words">{error}</p>
            {cloudAuthorizationExpired ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-[#efb8c5] bg-white/75 text-[#9f3752] hover:bg-[#ffe7ec] hover:text-[#8d2d47]"
                onClick={() => void handleCloudReconnect()}
                disabled={reconnectingCloud}
              >
                <RefreshCw className={reconnectingCloud ? "size-4 animate-spin" : "size-4"} />
                {reconnectingCloud
                  ? t("settings.cloud.connecting")
                  : t("settings.cloud.reconnect")}
              </Button>
            ) : null}
          </div>
        )}
        {cloudFeedback && (
          <p className="mb-5 rounded-2xl border border-[#b8e6cf] bg-[#f1fff6] p-4 text-sm text-[#28764a] shadow-[0_10px_24px_rgba(52,150,92,0.06)]">
            {cloudFeedback}
          </p>
        )}
        {shareFeedback && (
          <p className="mb-5 rounded-2xl border border-[#b8e6cf] bg-[#f1fff6] p-4 text-sm text-[#28764a] shadow-[0_10px_24px_rgba(52,150,92,0.06)]">
            {shareFeedback}
          </p>
        )}

        {loading ? (
          <div className="rounded-2xl border border-[#e9e5fb] bg-white/75 p-10 text-center text-sm text-[#8986a3] shadow-[0_12px_30px_rgba(89,76,133,0.05)]">
            …
          </div>
        ) : projects.length === 0 ? (
          <Card className="border-[#e9e5fb] bg-white/80 shadow-[0_18px_45px_rgba(88,67,166,0.08)]">
            <CardContent className="flex flex-col items-center p-10 text-center sm:p-16">
              <span className="grid size-16 place-items-center rounded-2xl bg-[#f0eaff] text-[#7951dd] shadow-[0_10px_24px_rgba(92,75,160,0.08)]">
                <FolderOpen className="size-8" />
              </span>
              <p className="mt-5 max-w-md text-sm leading-6 text-[#777592]">
                {t("projects.emptyBeforeNew")}
                <Link href="/projects/new" className="font-semibold text-[#6f45dc] underline decoration-[#cfc0ff] underline-offset-4 hover:text-[#4c27ba]">
                  {t("projects.new")}
                </Link>
                {t("projects.emptyAfterNew")}
              </p>
              <Button
                render={<Link href="/projects/new" />}
                size="lg"
                className="mt-6 bg-[#8754ff] text-white shadow-[0_12px_30px_rgba(95,44,255,0.24)] hover:bg-[#7642ef]"
              >
                <Plus className="size-4" />
                {t("projects.new")}
                <ArrowRight className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                  project={project}
                  coverImage={projectCoverImages[project.id]}
                editingProjectId={editingProjectId}
                titleDraft={titleDraft}
                openProjectMenuId={openProjectMenuId}
                cloudOperation={cloudOperation}
                importing={importing}
                lang={lang}
                t={t}
                startTitleEditing={startTitleEditing}
                onTitleDraftChange={setTitleDraft}
                commitTitleChange={commitTitleChange}
                onCancelTitleEditing={cancelTitleEditing}
                handleShareProject={handleShareProject}
                onProjectMenuChange={(open) =>
                  setOpenProjectMenuId(open ? project.id : null)
                }
                handleDownloadSource={handleDownloadSource}
                onPrepareCloudDownload={() => void prepareCloudDownload(project)}
                onPrepareCloudUpload={() => void prepareCloudUpload(project)}
                onDeleteProject={() => setProjectPendingDelete(project)}
              />
            ))}
          </div>
        )}
      </div>

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
        open={pendingProjectImport !== null}
        onOpenChange={(open) => {
          if (!open) setPendingProjectImport(null);
        }}
        title={t("projects.importConflictTitle")}
        description={
          pendingProjectImport
            ? t("projects.importConflictDescription", {
                count: pendingProjectImport.conflicts.length,
              })
            : ""
        }
        confirmLabel={t("projects.importConflictConfirm")}
        confirmVariant="destructive"
        confirmDisabled={importing}
        cancelLabel={t("common.cancel")}
        onConfirm={() => void confirmProjectImportOverwrite()}
      >
        {pendingProjectImport ? (
          <div className="rounded-lg border bg-muted/40 p-3 text-xs">
            <p className="mb-2 font-medium">
              {t("projects.importConflictList")}
            </p>
            <ul className="space-y-1 text-muted-foreground">
              {pendingProjectImport.conflicts
                .slice(0, 5)
                .map((project) => (
                  <li key={project.id} className="break-all">
                    {project.title} · {project.id} ·{" "}
                    {contentTypeById[project.template]?.label[lang] ??
                      project.template}
                  </li>
                ))}
            </ul>
            {pendingProjectImport.conflicts.length > 5 ? (
              <p className="mt-2 text-muted-foreground">
                {t("projects.importConflictMore", {
                  count: pendingProjectImport.conflicts.length - 5,
                })}
              </p>
            ) : null}
          </div>
        ) : null}
      </InteractionModal>
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
      <Dialog open={cloudOperation !== null}>
        <DialogContent className="max-w-sm border-[#e9e5fb] bg-white/95 shadow-[0_24px_60px_rgba(65,45,133,0.18)]">
          <DialogHeader>
            <DialogTitle className="text-[#252047]">{t("settings.cloud.title")}</DialogTitle>
            <DialogDescription>{progressText()}</DialogDescription>
          </DialogHeader>
          <progress
            role="progressbar"
            className="h-2 w-full accent-[#8754ff]"
            max={100}
            value={progressValue}
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}

function ProjectCard({
  project,
  coverImage,
  editingProjectId,
  titleDraft,
  openProjectMenuId,
  cloudOperation,
  importing,
  lang,
  t,
  startTitleEditing,
  onTitleDraftChange,
  commitTitleChange,
  onCancelTitleEditing,
  handleShareProject,
  onProjectMenuChange,
  handleDownloadSource,
  onPrepareCloudDownload,
  onPrepareCloudUpload,
  onDeleteProject,
}: {
  project: Project;
  coverImage?: string;
  editingProjectId: string | null;
  titleDraft: string;
  openProjectMenuId: string | null;
  cloudOperation: CloudAction | null;
  importing: boolean;
  lang: "zh" | "en";
  t: (key: string, vars?: Record<string, string | number>) => string;
  startTitleEditing: (project: Project) => void;
  onTitleDraftChange: (value: string) => void;
  commitTitleChange: (project: Project) => void;
  onCancelTitleEditing: () => void;
  handleShareProject: (project: Project) => void;
  onProjectMenuChange: (open: boolean) => void;
  handleDownloadSource: (project: Project) => void;
  onPrepareCloudDownload: () => void;
  onPrepareCloudUpload: () => void;
  onDeleteProject: () => void;
}) {
  const projectType = contentTypeById[project.template];
  const TypeIcon = projectTypeIcons[project.template];

  return (
      <Card className="group flex h-full flex-col border-[#e9e5fb] bg-white/90 shadow-[0_10px_24px_rgba(92,75,160,0.06)] transition-all duration-200 hover:-translate-y-1 hover:border-[#cfc0ff] hover:shadow-[0_18px_36px_rgba(92,75,160,0.12)]">
      <ProjectTypeCover
        coverImage={coverImage}
        template={project.template}
        sizes="(max-width: 640px) 100vw, 33vw"
      />
      <CardHeader className="gap-4 p-5 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex min-w-0 items-center gap-2 rounded-full bg-[#f2edff] px-2.5 py-1 text-xs font-medium text-[#7148db]">
            <TypeIcon className="size-3.5" aria-hidden="true" />
            <span className="truncate">{projectType.label[lang]}</span>
          </div>
          <Sparkles className="size-4 shrink-0 text-[#c0a9ff]" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <CardTitle className="min-w-0 text-lg text-[#252047]">
            {editingProjectId === project.id ? (
              <Input
                autoFocus
                value={titleDraft}
                onChange={(event) => onTitleDraftChange(event.target.value)}
                onFocus={(event) => event.currentTarget.select()}
                onBlur={() => void commitTitleChange(project)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void commitTitleChange(project);
                  } else if (event.key === "Escape") {
                    event.preventDefault();
                    onCancelTitleEditing();
                  }
                }}
                aria-label={t("editor.name")}
                className="h-9 border-[#d8caff] bg-white text-base font-semibold text-[#252047] focus-visible:border-[#9e7bff] focus-visible:ring-[#9e7bff]/30"
              />
            ) : (
              <div className="flex min-w-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => startTitleEditing(project)}
                  className="min-w-0 truncate text-left hover:text-[#6f45dc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9e7bff]/50"
                >
                  {project.title}
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="text-[#aaa3c3] hover:bg-[#f2edff] hover:text-[#7148db]"
                  onClick={() => startTitleEditing(project)}
                  aria-label={t("projects.editTitle")}
                >
                  <Pencil className="size-3.5" />
                </Button>
              </div>
            )}
          </CardTitle>
          <p className="mt-2 text-xs text-[#8986a3]">
            {t("projects.updatedAt")}{" "}
            {new Date(project.updatedAt).toLocaleString(
              languageInfo[lang].dateLocale
            )}
          </p>
        </div>
      </CardHeader>
      <CardContent className="mt-auto flex items-center justify-between gap-2 px-5 pb-5">
        <Button
          render={<Link href={`/projects/editor?id=${project.id}`} />}
          size="sm"
          className="bg-[#8754ff] text-white shadow-[0_8px_18px_rgba(95,44,255,0.2)] hover:bg-[#7642ef]"
          aria-label={t("projects.open")}
          title={t("projects.open")}
        >
          <FolderOpen className="size-4" />
          {t("projects.open")}
        </Button>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-[#827ca5] hover:bg-[#f2edff] hover:text-[#7148db]"
                onClick={() => void handleShareProject(project)}
            aria-label={t("projects.share")}
            title={t("projects.share")}
          >
            <Share2 className="size-4" />
          </Button>
          <Popover
            open={openProjectMenuId === project.id}
            onOpenChange={onProjectMenuChange}
          >
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-[#827ca5] hover:bg-[#f2edff] hover:text-[#7148db]"
                  aria-label={t("projects.more")}
                  aria-haspopup="menu"
                  aria-expanded={openProjectMenuId === project.id}
                  title={t("projects.more")}
                />
              }
            >
              <Ellipsis className="size-4" />
            </PopoverTrigger>
            <PopoverPortal>
              <PopoverPositioner side="bottom" align="end">
                <PopoverPopup className="min-w-48 border-[#e9e5fb] bg-white shadow-[0_18px_36px_rgba(65,45,133,0.14)]">
                  <div aria-label={t("projects.more")} className="grid gap-1" role="menu">
                    <Button
                      type="button"
                      variant="ghost"
                      className="justify-start text-[#4f466f] hover:bg-[#f5f1ff] hover:text-[#7148db]"
                      role="menuitem"
                      onClick={() => {
                        onProjectMenuChange(false);
                            void handleDownloadSource(project);
                      }}
                    >
                      <FileDown className="size-4" />
                      {t("editor.downloadSource")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="justify-start text-[#4f466f] hover:bg-[#f5f1ff] hover:text-[#7148db]"
                      role="menuitem"
                      onClick={() => {
                        onProjectMenuChange(false);
                        onPrepareCloudDownload();
                      }}
                      disabled={cloudOperation !== null || importing}
                    >
                      <CloudDownload className="size-4" />
                      {t("projects.cloudDownloadProject")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="justify-start text-[#4f466f] hover:bg-[#f5f1ff] hover:text-[#7148db]"
                      role="menuitem"
                      onClick={() => {
                        onProjectMenuChange(false);
                        onPrepareCloudUpload();
                      }}
                      disabled={cloudOperation !== null || importing}
                    >
                      <CloudUpload className="size-4" />
                      {t("projects.cloudUploadProject")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="justify-start text-[#b3435b] hover:bg-[#fff0f3] hover:text-[#a4314b]"
                      role="menuitem"
                      onClick={() => {
                        onProjectMenuChange(false);
                        onDeleteProject();
                      }}
                    >
                      <Trash2 className="size-4" />
                      {t("projects.delete")}
                    </Button>
                  </div>
                </PopoverPopup>
              </PopoverPositioner>
            </PopoverPortal>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
}
