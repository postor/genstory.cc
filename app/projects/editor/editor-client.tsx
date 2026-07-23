"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CloudUpload, Ellipsis, FileDown, FilePlus, FolderPlus, Loader2, Menu, Pencil, Play, RefreshCw, Save, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InteractionModal, PromptModal } from "@/components/ui/interaction-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tree, type TreeViewElement } from "@/components/ui/file-tree";
import { CodeEditor } from "@/components/ui/code-editor";
import {
  Popover,
  PopoverPopup,
  PopoverPortal,
  PopoverPositioner,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChatBox,
  type ChatBoxHandle,
  type ChatFileChange,
  type ChatProjectTool,
} from "@/openroutermcp/chatbox";
import { contentTypeById } from "@/lib/content-types";
import type { ProjectFileEntry } from "@/lib/file-system/types";
import { parentDirectoryPath, resolveNewEntryPath, uploadTargetDirectory } from "@/lib/file-system/ops";
import { normalizeRelativePath } from "@/lib/file-system/paths";
import {
  collectMarkdownMediaSources,
  mediaKindForSource,
  resolveMarkdownMediaPath,
} from "@/lib/markdown/image-paths";
import {
  createDirectory,
  deleteEntry,
  ensurePermission,
  listProjectFiles,
  openProjectDirectory,
  readFile,
  readTextFile,
  supportsFileSystemAccess,
  writeFilesToDirectory,
  writeTextFile,
} from "@/lib/file-system/browser";
import {
  getProject,
  saveProject,
  updateProjectState,
  type Project,
} from "@/lib/local-projects";
import { exportVNZipFromDirectory } from "@/lib/vn/export";
import { exportPhaserProjectZip } from "@/lib/phaser/export";
import { exportInteractiveVideoProjectZip } from "@/lib/interactive-video/export";
import {
  exportProjectDirectoryZip,
  exportReadableProjectZip,
} from "@/lib/project-export";
import { readProjectPreview } from "@/lib/project-source";
import { buildVNProjectFiles } from "@/lib/vn/project-files";
import { readVNProjectFromDirectory } from "@/lib/vn/source-reader";
import type { VNProject } from "@/lib/vn/types";
import {
  createCloudRemoteStore,
  type CloudRemoteStore,
} from "@/lib/cloud-sync/providers";
import { loadCloudSyncSettings } from "@/lib/cloud-sync/storage";
import {
  prepareCloudUploadPlan,
  uploadLocalWorkspace,
  type LocalWorkspaceSnapshot,
} from "@/lib/cloud-sync/sync";
import {
  CLOUD_PROVIDER_LABELS,
  type CloudConflict,
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
import { VNEditor } from "./vn-editor";
import { useLang } from "@/lib/i18n";
import { localizePlatformErrorMessage } from "@/lib/platform-errors";
import { cn } from "@/lib/utils";

function isTextPath(path: string): boolean {
  return /\.(md|markdown|ya?ml|txt|json|js|ts|tsx|jsx|css|html|svg)$/i.test(path);
}

function isImagePath(path: string): boolean {
  return /\.(png|jpe?g|gif|webp|avif|bmp|ico)$/i.test(path);
}

function mediaKindForPath(path: string): "image" | "video" | "audio" | null {
  if (isImagePath(path)) return "image";
  if (/\.(mp4|webm|ogv|mov|m4v)$/i.test(path)) return "video";
  if (/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(path)) return "audio";
  return null;
}

function buildTree(
  files: ProjectFileEntry[],
  rootName: string
): { elements: TreeViewElement[]; expanded: string[] } {
  const root: TreeViewElement = {
    id: rootName,
    name: rootName,
    type: "folder",
    children: [],
  };
  const expanded = [rootName];

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;
    let prefix = rootName;
    for (let index = 0; index < parts.length; index += 1) {
      const part = parts[index];
      const path = `${prefix}/${part}`;
      const isLast = index === parts.length - 1;
      const isFile = isLast && file.kind === "file";
      const children = current.children ?? (current.children = []);
      let next = children.find((child) => child.id === path);
      if (!next) {
        next = {
          id: path,
          name: part,
          type: isFile ? "file" : "folder",
          ...(isFile ? {} : { children: [] }),
        };
        children.push(next);
      }
      current = next;
      prefix = path;
      if (!isFile) expanded.push(path);
    }
  }

  return { elements: [root], expanded };
}

type EditorStatus = "loading" | "ready" | "missing" | "error";
type EntryKind = "file" | "directory" | null;
type EditorMobileTab = "chat" | "files" | "editor";

interface EntryDialogState {
  path: string;
  kind: EntryKind;
}

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

function entryDialogStateFromTreeElement(element: TreeViewElement): EntryDialogState {
  if (element.id === "root") return { path: "", kind: "directory" };
  const path = element.id.startsWith("root/") ? element.id.replace("root/", "") : "";
  return {
    path,
    kind: element.type === "folder" ? "directory" : "file",
  };
}

function TreeNodeActions({
  target,
  t,
  onRefresh,
  onUpload,
  onCreateFile,
  onCreateDirectory,
  onDelete,
}: {
  target: EntryDialogState;
  t: (key: string, values?: Record<string, string | number>) => string;
  onRefresh: () => void;
  onUpload: () => void;
  onCreateFile: () => void;
  onCreateDirectory: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  const actions: { label: string; icon: ReactNode; onSelect: () => void }[] = [
    { label: t("editor.refreshFiles"), icon: <RefreshCw />, onSelect: onRefresh },
    { label: t("editor.uploadFiles"), icon: <Upload />, onSelect: onUpload },
    { label: t("editor.newFile"), icon: <FilePlus />, onSelect: onCreateFile },
    { label: t("editor.newFolder"), icon: <FolderPlus />, onSelect: onCreateDirectory },
  ];
  if (target.path) {
    actions.push({ label: t("editor.deleteEntry"), icon: <Trash2 />, onSelect: onDelete });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            title={t("editor.nodeActions")}
            aria-label={t("editor.nodeActions")}
          />
        }
      >
        <Ellipsis className="size-3.5" />
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverPositioner side="left" align="start">
          <PopoverPopup className="min-w-44">
            <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">
              {t("editor.nodeActions")}
            </p>
            <div className="flex flex-col gap-0.5">
              {/* Each menu item pairs an icon + action label. */}
              {actions.map((action) => (
                <Button
                  key={action.label}
                  type="button"
                  variant={action.label === t("editor.deleteEntry") ? "destructive" : "ghost"}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => run(action.onSelect)}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          </PopoverPopup>
        </PopoverPositioner>
      </PopoverPortal>
    </Popover>
  );
}

function MobileProjectActions({
  project,
  hasRoot,
  vn,
  exporting,
  cloudOperation,
  saving,
  saved,
  dirty,
  status,
  t,
  onPreview,
  onExport,
  onDownloadSource,
  onCloudUpload,
  onToggleScene,
  onSave,
}: {
  project: Project | null;
  hasRoot: boolean;
  vn: VNProject | null;
  exporting: boolean;
  cloudOperation: "upload" | null;
  saving: boolean;
  saved: boolean;
  dirty: boolean;
  status: EditorStatus;
  t: (key: string, values?: Record<string, string | number>) => string;
  onPreview: () => void;
  onExport: () => void;
  onDownloadSource: () => void;
  onCloudUpload: () => void;
  onToggleScene: () => void;
  onSave: () => void;
}) {
  const [open, setOpen] = useState(false);

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  const projectReady = Boolean(project && hasRoot);
  const exportLabel =
    project?.template === "visual-novel"
      ? t("vn.exportOpenwebgal")
      : project?.template === "phaser-game"
        ? t("phaser.export")
        : t("editor.export");
  const actions: {
    label: string;
    icon: ReactNode;
    disabled?: boolean;
    onSelect: () => void;
  }[] = [
    {
      label: t("editor.preview"),
      icon: <Play />,
      disabled: !projectReady,
      onSelect: onPreview,
    },
    {
      label: exportLabel,
      icon: exporting ? <Loader2 className="animate-spin" /> : <FileDown />,
      disabled: !projectReady || exporting,
      onSelect: onExport,
    },
    {
      label: t("editor.downloadSource"),
      icon: exporting ? <Loader2 className="animate-spin" /> : <FileDown />,
      disabled: !projectReady || exporting,
      onSelect: onDownloadSource,
    },
    {
      label: t("projects.cloudUploadProject"),
      icon:
        cloudOperation === "upload" ? (
          <Loader2 className="animate-spin" />
        ) : (
          <CloudUpload />
        ),
      disabled: !projectReady || exporting || cloudOperation !== null,
      onSelect: onCloudUpload,
    },
  ];

  if (project?.template === "visual-novel") {
    actions.push({
      label: t("vn.structuredEditor"),
      icon: <Pencil />,
      disabled: !vn,
      onSelect: onToggleScene,
    });
  }

  actions.push({
    label: saved && !saving ? `${t("editor.save")} · ${t("editor.saved")}` : t("editor.save"),
    icon: saving ? <Loader2 className="animate-spin" /> : <Save />,
    disabled: !dirty || saving || status !== "ready",
    onSelect: onSave,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="lg:hidden"
            title={t("editor.actions")}
            aria-label={t("editor.actions")}
          />
        }
      >
        <Menu className="size-4" />
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverPositioner side="bottom" align="end">
          <PopoverPopup className="min-w-56">
            <p className="px-2 py-1 text-xs font-semibold text-muted-foreground">
              {t("editor.actions")}
            </p>
            <div className="flex flex-col gap-0.5">
              {actions.map((action) => (
                <Button
                  key={action.label}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  disabled={action.disabled}
                  onClick={() => run(action.onSelect)}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          </PopoverPopup>
        </PopoverPositioner>
      </PopoverPortal>
    </Popover>
  );
}

export default function EditorClient() {
  const { lang, t } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [project, setProject] = useState<Project | null>(null);
  const [root, setRoot] = useState<FileSystemDirectoryHandle | null>(null);
  const [files, setFiles] = useState<ProjectFileEntry[]>([]);
  const [contents, setContents] = useState<Record<string, string>>({});
  const [mediaPreview, setMediaPreview] = useState<{
    path: string;
    url: string;
    size: number;
    type: string;
    kind: "image" | "video" | "audio";
  } | null>(null);
  const mediaUrlRef = useRef<string | null>(null);
  const [markdownMediaUrls, setMarkdownMediaUrls] = useState<Record<string, string>>({});
  const markdownMediaUrlsRef = useRef<Record<string, string>>({});
  const [dirtyPaths, setDirtyPaths] = useState<Set<string>>(new Set());
  const [vn, setVn] = useState<VNProject | null>(null);
  const [selectedPath, setSelectedPath] = useState("AGENTS.md");
  const [selectedKind, setSelectedKind] = useState<"file" | "directory" | null>("file");
  const [mode, setMode] = useState<"source" | "scene">("source");
  const [mobileTab, setMobileTab] = useState<EditorMobileTab>("chat");
  const [status, setStatus] = useState<EditorStatus>(id ? "loading" : "missing");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [cloudOperation, setCloudOperation] = useState<"upload" | null>(null);
  const [cloudProgress, setCloudProgress] = useState<CloudSyncProgress | null>(null);
  const [cloudFeedback, setCloudFeedback] = useState<string | null>(null);
  const [cloudAuthorizationExpired, setCloudAuthorizationExpired] = useState(false);
  const [reconnectingCloud, setReconnectingCloud] = useState(false);
  const [cloudConfirm, setCloudConfirm] = useState(false);
  const [uploadPlan, setUploadPlan] = useState<CloudUploadPlan | null>(null);
  const chatRef = useRef<ChatBoxHandle>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const uploadTargetRef = useRef<EntryDialogState | null>(null);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [createFileState, setCreateFileState] = useState<EntryDialogState | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [createDirectoryState, setCreateDirectoryState] = useState<EntryDialogState | null>(null);
  const [newDirectoryName, setNewDirectoryName] = useState("");
  const [deleteEntryState, setDeleteEntryState] = useState<EntryDialogState | null>(null);

  useEffect(() => {
    document.title = t("meta.editorTitle");
  }, [t]);

  async function loadProject(pid: string) {
    setStatus("loading");
    setError("");
    setSaved(false);
    setDirtyPaths(new Set());
    try {
      if (!supportsFileSystemAccess()) {
        throw new Error(t("editor.fileSystemUnsupported"));
      }
      const nextProject = await getProject(pid);
      if (!nextProject) {
        setStatus("missing");
        return;
      }
      const nextRoot = await openProjectDirectory(
        nextProject.template,
        nextProject.id
      );
      const entries = await listProjectFiles(nextRoot);
      const textFiles: Record<string, string> = {};
      for (const entry of entries) {
        if (entry.kind === "file" && isTextPath(entry.path)) {
          textFiles[entry.path] = await readTextFile(nextRoot, entry.path);
        }
      }
      setProject(nextProject);
      setRoot(nextRoot);
      setFiles(entries);
      setContents(textFiles);
      const preferred =
        nextProject.lastOpenedPath &&
        entries.some((entry) => entry.kind === "file" && entry.path === nextProject.lastOpenedPath)
          ? nextProject.lastOpenedPath
          : entries.find((entry) => entry.path === "AGENTS.md")?.path ??
            entries.find((entry) => entry.kind === "file" && isTextPath(entry.path))?.path ??
            entries[0]?.path ??
            "";
      setSelectedPath(preferred);
      setSelectedKind(entries.find((entry) => entry.path === preferred)?.kind ?? (preferred ? "file" : "directory"));
      if (nextProject.template === "visual-novel") {
        setVn(await readVNProjectFromDirectory(nextRoot));
      } else {
        setVn(null);
      }
      setStatus("ready");
      await updateProjectState(pid, {
        lastOpenedPath: preferred,
        updatedAt: nextProject.updatedAt,
      });
    } catch (e) {
      setStatus("error");
      setError(localizePlatformErrorMessage(e instanceof Error ? e.message : String(e), lang));
    }
  }

  useEffect(() => {
    if (!id) return;
    void (async () => {
      await loadProject(id);
    })();
    // The project id is the route's stable input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const tree = useMemo(() => buildTree(files, "root"), [files]);
  const selectedContent = selectedPath ? contents[selectedPath] : undefined;
  const visibleMediaPreview =
    mediaPreview?.path === selectedPath ? mediaPreview : null;
  const dirty = dirtyPaths.size > 0;

  function replaceMarkdownMediaUrls(nextUrls: Record<string, string>) {
    for (const url of Object.values(markdownMediaUrlsRef.current)) URL.revokeObjectURL(url);
    markdownMediaUrlsRef.current = nextUrls;
    queueMicrotask(() => setMarkdownMediaUrls(nextUrls));
  }

  useEffect(() => {
    const kind = selectedPath ? mediaKindForPath(selectedPath) : null;
    if (!root || !selectedPath || !kind) {
      if (mediaUrlRef.current) {
        URL.revokeObjectURL(mediaUrlRef.current);
        mediaUrlRef.current = null;
      }
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const file = await readFile(root, selectedPath);
        const url = URL.createObjectURL(file);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        if (mediaUrlRef.current) URL.revokeObjectURL(mediaUrlRef.current);
        mediaUrlRef.current = url;
        setMediaPreview({
          path: selectedPath,
          url,
          size: file.size,
          type: file.type || "image",
          kind,
        });
      } catch {
        /* Keep the binary fallback visible. */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [root, selectedPath]);

  useEffect(() => {
    if (!root || !selectedPath || selectedContent === undefined || !isTextPath(selectedPath)) {
      replaceMarkdownMediaUrls({});
      return;
    }

    const sources = collectMarkdownMediaSources(selectedContent);
    if (sources.length === 0) {
      replaceMarkdownMediaUrls({});
      return;
    }

    let cancelled = false;
    void (async () => {
      const nextUrls: Record<string, string> = {};
      const createdUrls: string[] = [];
      for (const source of sources) {
        const mediaPath = resolveMarkdownMediaPath(selectedPath, source);
        if (!mediaPath || !mediaKindForPath(mediaPath)) continue;
        try {
          const file = await readFile(root, mediaPath);
          const url = URL.createObjectURL(file);
          createdUrls.push(url);
          nextUrls[source] = url;
        } catch {
          /* Leave missing images as their original markdown paths. */
        }
      }
      if (cancelled) {
        for (const url of createdUrls) URL.revokeObjectURL(url);
        return;
      }
      replaceMarkdownMediaUrls(nextUrls);
    })();

    return () => {
      cancelled = true;
    };
  }, [root, selectedPath, selectedContent]);

  useEffect(() => {
    return () => {
      if (mediaUrlRef.current) URL.revokeObjectURL(mediaUrlRef.current);
      for (const url of Object.values(markdownMediaUrlsRef.current)) URL.revokeObjectURL(url);
    };
  }, []);

  function updateContent(path: string, value: string) {
    setContents((previous) => ({ ...previous, [path]: value }));
    setDirtyPaths((previous) => new Set(previous).add(path));
    setSaved(false);
  }

  function startTitleEditing() {
    if (!project) return;
    setTitleDraft(project.title);
    setIsTitleEditing(true);
  }

  function cancelTitleEditing() {
    setTitleDraft(project?.title ?? "");
    setIsTitleEditing(false);
  }

  async function commitTitleChange() {
    if (!project) {
      setIsTitleEditing(false);
      return;
    }

    const nextTitle = titleDraft.trim() || project.title;
    setTitleDraft(nextTitle);
    setIsTitleEditing(false);
    if (nextTitle === project.title) return;

    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const now = Math.max(project.updatedAt + 1, project.createdAt);
      await saveProject({
        ...project,
        title: nextTitle,
        updatedAt: now,
        lastOpenedPath: selectedPath || project.lastOpenedPath,
      });
      setProject((previous) =>
        previous
          ? {
              ...previous,
              title: nextTitle,
              updatedAt: now,
              lastOpenedPath: selectedPath || previous.lastOpenedPath,
            }
          : previous
      );
      setSaved(true);
    } catch (e) {
      setError(
        t("editor.saveFailed") +
          localizePlatformErrorMessage(e instanceof Error ? e.message : String(e), lang)
      );
    } finally {
      setSaving(false);
    }
  }

  function selectPath(path: string) {
    if (path === "root") {
      setSelectedPath("");
      setSelectedKind("directory");
      setMode("source");
      setMobileTab("editor");
      return;
    }
    if (!path.startsWith("root/")) return;
    const nextPath = path.replace("root/", "");
    const entry = files.find((item) => item.path === nextPath);
    setSelectedPath(nextPath);
    setSelectedKind(entry?.kind ?? null);
    setMode("source");
    setMobileTab("editor");
  }

  function selectMobileTab(value: unknown) {
    if (value === "chat" || value === "files" || value === "editor") {
      setMobileTab(value);
    }
  }

  function updateStructuredVN(next: VNProject) {
    const agents = contents["AGENTS.md"] ?? "";
    const generated = buildVNProjectFiles(next, agents).filter(
      (file) => file.kind !== "asset"
    );
    setVn(next);
    setContents((previous) => {
      const nextContents = { ...previous };
      for (const file of generated) nextContents[file.path] = file.content;
      return nextContents;
    });
    setDirtyPaths((previous) => {
      const nextDirty = new Set(previous);
      for (const file of generated) nextDirty.add(file.path);
      return nextDirty;
    });
    setSaved(false);
  }

  async function handleSave(): Promise<boolean> {
    if (!project || !root) return false;
    setSaving(true);
    try {
      await ensurePermission(root, true);
      for (const path of dirtyPaths) {
        const value = contents[path];
        if (value !== undefined) await writeTextFile(root, path, value);
      }
      const now = Math.max(project.updatedAt + 1, project.createdAt);
      await updateProjectState(project.id, {
        updatedAt: now,
        lastOpenedPath: selectedPath,
      });
      setProject((previous) => (previous ? { ...previous, updatedAt: now } : previous));
      setDirtyPaths(new Set());
      setSaved(true);
      return true;
    } catch (e) {
      setError(
        t("editor.saveFailed") +
          localizePlatformErrorMessage(e instanceof Error ? e.message : String(e), lang)
      );
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function reloadFiles(preferredPath = selectedPath, preferredKind: "file" | "directory" | null = selectedKind) {
    if (!root) return;
    const entries = await listProjectFiles(root);
    const textFiles: Record<string, string> = {};
    for (const entry of entries) {
      if (entry.kind === "file" && isTextPath(entry.path)) {
        textFiles[entry.path] = await readTextFile(root, entry.path);
      }
    }
    if (preferredPath === "" && preferredKind === "directory") {
      setFiles(entries);
      setContents(textFiles);
      setSelectedPath("");
      setSelectedKind("directory");
      if (project?.template === "visual-novel") {
        setVn(await readVNProjectFromDirectory(root));
      }
      return;
    }
    const preferredEntry = preferredPath
      ? entries.find((entry) => entry.path === preferredPath && (!preferredKind || entry.kind === preferredKind))
      : undefined;
    const fallback =
      preferredEntry ??
      entries.find((entry) => entry.kind === "file" && entry.path === "AGENTS.md") ??
      entries.find((entry) => entry.kind === "file" && isTextPath(entry.path)) ??
      entries[0];

    setFiles(entries);
    setContents(textFiles);
    setSelectedPath(fallback?.path ?? "");
    setSelectedKind(fallback?.kind ?? "directory");
    if (project?.template === "visual-novel") {
      setVn(await readVNProjectFromDirectory(root));
    }
  }

  async function handleRefreshEntry(target: EntryDialogState) {
    if (!root) return;
    setError("");
    try {
      if (dirty) {
        const ok = await handleSave();
        if (!ok) return;
      }
      await reloadFiles(target.path, target.kind);
    } catch (e) {
      setError(localizePlatformErrorMessage(e instanceof Error ? e.message : String(e), lang));
    }
  }

  function handleUploadIntoEntry(target: EntryDialogState) {
    uploadTargetRef.current = target;
    uploadInputRef.current?.click();
  }

  async function handleUploadFiles(fileList: FileList | null) {
    if (!root || !fileList?.length) return;
    setError("");
    try {
      if (dirty) {
        const ok = await handleSave();
        if (!ok) return;
      }
      const targetEntry = uploadTargetRef.current ?? { path: selectedPath, kind: selectedKind };
      const target = uploadTargetDirectory(targetEntry.path, targetEntry.kind);
      const written = await writeFilesToDirectory(root, target, Array.from(fileList));
      await reloadFiles(written.at(-1) ?? targetEntry.path, "file");
    } catch (e) {
      setError(localizePlatformErrorMessage(e instanceof Error ? e.message : String(e), lang));
    } finally {
      uploadTargetRef.current = null;
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    }
  }

  async function handleCreateFile() {
    if (!root) return;
    const dialogState = createFileState;
    if (!dialogState) return;
    const name = newFileName.trim();
    if (!name) return;
    setError("");
    try {
      if (dirty) {
        const ok = await handleSave();
        if (!ok) return;
      }
      const path = resolveNewEntryPath(dialogState.path, dialogState.kind, name);
      await ensurePermission(root, true);
      await writeTextFile(root, path, "");
      setCreateFileState(null);
      setNewFileName("");
      await reloadFiles(path, "file");
    } catch (e) {
      setError(localizePlatformErrorMessage(e instanceof Error ? e.message : String(e), lang));
    }
  }

  async function handleCreateDirectory() {
    if (!root) return;
    const dialogState = createDirectoryState;
    if (!dialogState) return;
    const name = newDirectoryName.trim();
    if (!name) return;
    setError("");
    try {
      if (dirty) {
        const ok = await handleSave();
        if (!ok) return;
      }
      const path = resolveNewEntryPath(dialogState.path, dialogState.kind, name);
      await ensurePermission(root, true);
      await createDirectory(root, path);
      setCreateDirectoryState(null);
      setNewDirectoryName("");
      await reloadFiles(path, "directory");
    } catch (e) {
      setError(localizePlatformErrorMessage(e instanceof Error ? e.message : String(e), lang));
    }
  }

  async function handleDeleteSelected() {
    if (!root) return;
    const dialogState = deleteEntryState;
    if (!dialogState?.path) return;
    setError("");
    try {
      if (dirty) {
        const ok = await handleSave();
        if (!ok) return;
      }
      const targetPath = dialogState.path;
      setDeleteEntryState(null);
      if (dirtyPaths.has(targetPath)) {
        setDirtyPaths((previous) => {
          const next = new Set(previous);
          next.delete(targetPath);
          return next;
        });
      }
      await ensurePermission(root, true);
      await deleteEntry(root, targetPath, true);
      setContents((previous) => {
        const next = { ...previous };
        for (const path of Object.keys(next)) {
          if (path === targetPath || path.startsWith(`${targetPath}/`)) delete next[path];
        }
        return next;
      });
      setDirtyPaths((previous) => {
        const next = new Set(previous);
        for (const path of [...next]) {
          if (path === targetPath || path.startsWith(`${targetPath}/`)) next.delete(path);
        }
        return next;
      });
      await reloadFiles(parentDirectoryPath(targetPath), "directory");
    } catch (e) {
      setError(localizePlatformErrorMessage(e instanceof Error ? e.message : String(e), lang));
    }
  }

  async function handlePreview() {
    if (!project) return;
    if (dirty) {
      const ok = await handleSave();
      if (!ok) return;
    }
    router.push(`/projects/preview?id=${project.id}`);
  }

  async function applyChatFileChanges(changes: ChatFileChange[]) {
    if (!project || !root) return;
    const normalized = changes.map((change) => {
      const path = normalizeRelativePath(change.path);
      if (!isTextPath(path)) {
        throw new Error(t("editor.chatChangeTextOnly", { path }));
      }
      return { ...change, path };
    });

    await ensurePermission(root, true);
    for (const change of normalized) {
      await writeTextFile(root, change.path, change.content);
    }
    const entries = await listProjectFiles(root);
    setFiles(entries);
    setContents((previous) => {
      const next = { ...previous };
      for (const change of normalized) next[change.path] = change.content;
      return next;
    });
    setDirtyPaths((previous) => {
      const next = new Set(previous);
      for (const change of normalized) next.delete(change.path);
      return next;
    });
    if (project.template === "visual-novel") {
      setVn(await readVNProjectFromDirectory(root));
    }
    const now = Math.max(project.updatedAt + 1, project.createdAt);
    await updateProjectState(project.id, {
      updatedAt: now,
      lastOpenedPath: normalized.at(-1)?.path ?? selectedPath,
    });
    setProject((previous) => (previous ? { ...previous, updatedAt: now } : previous));
    setSelectedPath(normalized.at(-1)?.path ?? selectedPath);
    setSelectedKind("file");
    setSaved(true);
  }

  async function handleDownloadSource() {
    if (!project || !root) return;
    setExporting(true);
    try {
      await exportProjectDirectoryZip(root, `${project.title || "project"}-source`);
    } catch (e) {
      setError(localizePlatformErrorMessage(e instanceof Error ? e.message : String(e), lang));
    } finally {
      setExporting(false);
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
    setError("");
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

  async function prepareCloudUpload() {
    if (!project || !root) return;
    setCloudProgress(null);
    setCloudFeedback(null);
    setCloudAuthorizationExpired(false);
    setCloudConfirm(false);
    setUploadPlan(null);
    setError("");
    setCloudOperation("upload");
    try {
      if (dirty) {
        const ok = await handleSave();
        if (!ok) return;
      }
      await ensureCloudAuthorization();
      const store = requireCloudStore();
      const plan = await prepareCloudUploadPlan(
        store,
        [project],
        setCloudProgress
      );
      setUploadPlan(plan);
      setCloudConfirm(true);
    } catch (reason) {
      setCloudError(reason);
    } finally {
      setCloudOperation(null);
    }
  }

  async function handleCloudUpload() {
    const plan = uploadPlan;
    if (!plan || !project) return;
    setCloudConfirm(false);
    setCloudOperation("upload");
    setCloudProgress(null);
    setError("");
    try {
      const store = requireCloudStore();
      await uploadLocalWorkspace(
        store,
        plan.snapshot,
        plan.remoteFiles,
        setCloudProgress
      );
      setCloudFeedback(
        t("projects.cloudSuccessUploadProject", {
          title: project.title,
        })
      );
      setUploadPlan(null);
    } catch (reason) {
      setCloudError(reason);
    } finally {
      setCloudOperation(null);
      setCloudProgress(null);
    }
  }

  function progressText() {
    if (!cloudProgress) return t("projects.cloudPreparing");
    return t(CLOUD_PROGRESS_KEYS[cloudProgress.phase], {
      completed: Math.min(cloudProgress.total, Math.floor(cloudProgress.completed)),
      total: cloudProgress.total,
    });
  }

  function conflictPreview(conflicts: CloudConflict[]) {
    if (conflicts.length === 0) return null;
    const preview = conflicts.slice(0, 5);
    const moreCount = Math.max(0, conflicts.length - preview.length);
    return (
      <div className="rounded-lg border bg-muted/40 p-3 text-xs">
        <p className="mb-2 font-medium">
          {t("projects.cloudUploadConflictCount", { count: conflicts.length })}
        </p>
        <ul className="space-y-1 text-muted-foreground">
          {preview.map((conflict) => (
            <li key={`${conflict.direction}:${conflict.path}`} className="break-all">
              {conflict.path}
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

  async function handleExport() {
    if (!project || !root) return;
    setExporting(true);
    try {
      if (project.template === "visual-novel") {
        await exportVNZipFromDirectory(root, `${project.title || "openwebgal"}.zip`);
      } else if (project.template === "phaser-game") {
        await exportPhaserProjectZip(root, project.title);
      } else if (project.template === "interactive-video") {
        await exportInteractiveVideoProjectZip(root, project.title);
      } else {
        const preview = await readProjectPreview(root, project.template);
        await exportReadableProjectZip(preview, project.title);
      }
    } catch (e) {
      setError(localizePlatformErrorMessage(e instanceof Error ? e.message : String(e), lang));
    } finally {
      setExporting(false);
    }
  }

  const context = useMemo(() => {
    if (!project) return undefined;
    const templateName = contentTypeById[project.template]?.label[lang] ?? project.template;
    return [
      t("editor.contextProject", { title: project.title }),
      t("editor.contextTemplate", { template: templateName }),
      selectedPath
        ? t("editor.contextSelected", { path: selectedPath })
        : t("editor.contextSelectedNone"),
      t("editor.contextTextFileCount", { count: Object.keys(contents).length }),
    ].join("\n");
  }, [contents, lang, project, selectedPath, t]);

  const projectTools = useMemo<ChatProjectTool[]>(() => {
    const sortedEntries = Object.entries(contents).sort(([a], [b]) => a.localeCompare(b));
    return [
      {
        name: "genstory_list_project_files",
        description: t("editor.toolListFilesDesc"),
        inputSchema: {
          type: "object",
          properties: {},
        },
        call: () => ({
          selectedPath,
          files: sortedEntries.map(([path, content]) => ({
            path,
            characters: content.length,
          })),
        }),
      },
      {
        name: "genstory_read_project_file",
        description: t("editor.toolReadFileDesc"),
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: t("editor.toolReadFilePathDesc") },
          },
          required: ["path"],
        },
        call: (args) => {
          const path = normalizeRelativePath(String(args.path ?? ""));
          const content = contents[path];
          if (content === undefined) throw new Error(t("editor.toolMissingTextFile", { path }));
          return { path, content };
        },
      },
      {
        name: "genstory_search_project_files",
        description: t("editor.toolSearchFilesDesc"),
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: t("editor.toolSearchQueryDesc") },
          },
          required: ["query"],
        },
        call: (args) => {
          const query = String(args.query ?? "").trim().toLowerCase();
          if (!query) return { query, matches: [] };
          const matches = sortedEntries.flatMap(([path, content]) => {
            const index = content.toLowerCase().indexOf(query);
            if (index < 0) return [];
            const start = Math.max(0, index - 120);
            const end = Math.min(content.length, index + query.length + 120);
            return [{ path, excerpt: content.slice(start, end) }];
          });
          return { query, matches: matches.slice(0, 20) };
        },
      },
    ];
  }, [contents, selectedPath, t]);

  const createDirectoryTarget = createDirectoryState
    ? uploadTargetDirectory(createDirectoryState.path, createDirectoryState.kind) ||
      t("editor.projectRoot")
    : t("editor.projectRoot");
  const createFileTarget = createFileState
    ? uploadTargetDirectory(createFileState.path, createFileState.kind) ||
      t("editor.projectRoot")
    : t("editor.projectRoot");
  const uploadConflictCount = uploadPlan?.conflicts.length ?? 0;
  const uploadDescription = [
    t("projects.cloudUploadProjectDescription"),
    uploadConflictCount > 0
      ? t("projects.cloudUploadConflictCount", { count: uploadConflictCount })
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return (
    <main className="flex h-svh flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Button render={<Link href="/projects" />} variant="ghost" size="icon" aria-label={t("editor.back")}>
            <ArrowLeft className="size-4" />
          </Button>
          {project ? (
            isTitleEditing ? (
              <Input
                autoFocus
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                onFocus={(event) => event.currentTarget.select()}
                onBlur={() => void commitTitleChange()}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void commitTitleChange();
                  } else if (event.key === "Escape") {
                    event.preventDefault();
                    cancelTitleEditing();
                  }
                }}
                aria-label={t("editor.name")}
                className="h-9 w-full max-w-80 text-lg font-bold tracking-tight sm:w-80"
              />
            ) : (
              <div className="flex min-w-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startTitleEditing()}
                  disabled={saving}
                  className="h-9 max-w-80 justify-start px-2 text-left text-lg font-bold tracking-tight"
                >
                  <span className="truncate">{project.title}</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => startTitleEditing()}
                  disabled={saving}
                  aria-label={t("projects.editTitle")}
                >
                  <Pencil className="size-4" />
                </Button>
              </div>
            )
          ) : (
            <h1 className="text-lg font-bold tracking-tight">{t("editor.title")}</h1>
          )}
        </div>
        <input
          ref={uploadInputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={(event) => void handleUploadFiles(event.currentTarget.files)}
        />
        <div className="hidden gap-2 lg:flex">
          {project && root && (
            <>
              <Button variant="outline" size="sm" onClick={() => void handlePreview()}>
                <Play className="size-4" />
                {t("editor.preview")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => void handleExport()} disabled={exporting}>
                {exporting ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
                {project.template === "visual-novel"
                  ? t("vn.exportOpenwebgal")
                  : project.template === "phaser-game"
                    ? t("phaser.export")
                    : t("editor.export")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => void handleDownloadSource()} disabled={exporting}>
                {exporting ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
                {t("editor.downloadSource")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void prepareCloudUpload()}
                disabled={exporting || cloudOperation !== null}
              >
                {cloudOperation === "upload" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CloudUpload className="size-4" />
                )}
                {t("projects.cloudUploadProject")}
              </Button>
              {project.template === "visual-novel" && (
                <Button
                  variant={mode === "scene" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode((previous) => (previous === "scene" ? "source" : "scene"))}
                  disabled={!vn}
                >
                  {t("vn.structuredEditor")}
                </Button>
              )}
            </>
          )}
          <Button size="sm" onClick={() => void handleSave()} disabled={!dirty || saving || status !== "ready"}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {t("editor.save")}
            {saved && !saving ? ` · ${t("editor.saved")}` : ""}
          </Button>
        </div>
        <MobileProjectActions
          project={project}
          hasRoot={root !== null}
          vn={vn}
          exporting={exporting}
          cloudOperation={cloudOperation}
          saving={saving}
          saved={saved}
          dirty={dirty}
          status={status}
          t={t}
          onPreview={() => void handlePreview()}
          onExport={() => void handleExport()}
          onDownloadSource={() => void handleDownloadSource()}
          onCloudUpload={() => void prepareCloudUpload()}
          onToggleScene={() =>
            setMode((previous) => (previous === "scene" ? "source" : "scene"))
          }
          onSave={() => void handleSave()}
        />
      </div>

      {error && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          <span className="min-w-0">{error}</span>
          <div className="flex shrink-0 gap-2">
            {cloudAuthorizationExpired ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleCloudReconnect()}
                disabled={reconnectingCloud}
              >
                <RefreshCw className={reconnectingCloud ? "size-4 animate-spin" : "size-4"} />
                {reconnectingCloud
                  ? t("settings.cloud.connecting")
                  : t("settings.cloud.reconnect")}
              </Button>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => id && void loadProject(id)}>
              {t("projects.reconnect")}
            </Button>
          </div>
        </div>
      )}
      {cloudFeedback && (
        <p className="flex shrink-0 items-center border-b border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-300">
          {cloudFeedback}
        </p>
      )}

      <Tabs value={mobileTab} onValueChange={selectMobileTab} className="shrink-0 border-b p-2 lg:hidden">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">{t("editor.chat")}</TabsTrigger>
          <TabsTrigger value="files">{t("editor.files")}</TabsTrigger>
          <TabsTrigger value="editor">{t("editor.content")}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[260px_1fr_360px]">
        <aside
          className={cn(
            "min-h-0 overflow-auto border-b border-border lg:border-b-0 lg:border-r",
            mobileTab === "files" ? "block" : "hidden",
            "lg:block"
          )}
        >
          {status === "ready" ? (
            <Tree
              key={`${project?.id ?? "none"}-${files.length}`}
              elements={tree.elements}
              initialExpandedItems={tree.expanded}
              initialSelectedId={selectedPath ? `root/${selectedPath}` : "root"}
              onSelect={selectPath}
              renderActions={(element) => {
                const target = entryDialogStateFromTreeElement(element);

                return (
                  <TreeNodeActions
                    target={target}
                    t={t}
                    onRefresh={() => void handleRefreshEntry(target)}
                    onUpload={() => handleUploadIntoEntry(target)}
                    onCreateFile={() => {
                      setNewFileName("");
                      setCreateFileState(target);
                    }}
                    onCreateDirectory={() => {
                      setNewDirectoryName("");
                      setCreateDirectoryState(target);
                    }}
                    onDelete={() => setDeleteEntryState(target)}
                  />
                );
              }}
              className="p-2"
            />
          ) : (
            <p className="p-4 text-sm text-muted-foreground">
              {status === "loading" ? "…" : t("editor.noProject")}
            </p>
          )}
        </aside>

        <section
          className={cn(
            "min-h-0 min-w-0 overflow-hidden",
            mobileTab === "editor" ? "block" : "hidden",
            "lg:block"
          )}
        >
          {status === "loading" ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              {t("create.loading")}
            </div>
          ) : status !== "ready" || !project ? (
            <div className="flex h-full items-center justify-center px-4 text-sm text-muted-foreground">
              {status === "missing" ? t("editor.notFound") : t("editor.noBoundProject")}
            </div>
          ) : mode === "scene" && vn ? (
            <VNEditor
              vn={vn}
              onChange={updateStructuredVN}
              showSceneList
            />
          ) : selectedContent !== undefined ? (
            <CodeEditor
              value={selectedContent}
              onChange={(value) => updateContent(selectedPath, value)}
              filename={selectedPath}
              dirty={dirtyPaths.has(selectedPath)}
              readOnly={selectedPath === "AGENTS.md" && false}
              resolveImageSrc={(src) => markdownMediaUrls[src] ?? src}
              mediaKindForSrc={mediaKindForSource}
            />
          ) : visibleMediaPreview ? (
            <div className="flex h-full min-h-0 flex-col bg-muted/20">
              <div className="flex items-center justify-between gap-3 border-b bg-background px-4 py-2 text-sm">
                <span className="truncate font-medium">{visibleMediaPreview.path}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {visibleMediaPreview.type} · {Math.ceil(visibleMediaPreview.size / 1024)} KB
                </span>
              </div>
              <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4">
                {visibleMediaPreview.kind === "image" ? (
                  <>
                    {/* Local OPFS previews use blob URLs; Next Image can render those as broken images. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={visibleMediaPreview.url}
                      alt={visibleMediaPreview.path}
                      className="max-h-full max-w-full rounded-md border bg-background object-contain"
                    />
                  </>
                ) : visibleMediaPreview.kind === "video" ? (
                  <video
                    src={visibleMediaPreview.url}
                    controls
                    className="max-h-full max-w-full rounded-md border bg-black"
                  />
                ) : (
                  <audio src={visibleMediaPreview.url} controls className="w-full max-w-2xl" />
                )}
              </div>
            </div>
          ) : selectedKind === "directory" ? (
            <div className="flex h-full items-center justify-center px-4 text-sm text-muted-foreground">
              {t("editor.folderSelected")}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center px-4 text-sm text-muted-foreground">
              {t("editor.binaryFile")}
            </div>
          )}
        </section>

        <aside
          className={cn(
            "min-h-0 overflow-hidden border-t border-border lg:border-l lg:border-t-0",
            mobileTab === "chat" ? "block" : "hidden",
            "lg:block"
          )}
        >
          <div className="flex h-full min-h-0 flex-col gap-3 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("editor.chat")}
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
              {t("editor.chatDataNote")}
            </p>
            <div className="min-h-0 flex-1">
              <ChatBox
                ref={chatRef}
                chatId={project?.id}
                context={context}
                projectTools={projectTools}
                onFileChanges={applyChatFileChanges}
                className="h-full max-w-none"
              />
            </div>
          </div>
        </aside>
      </div>

      <PromptModal
        open={createFileState !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreateFileState(null);
            setNewFileName("");
          }
        }}
        title={t("editor.newFileTitle")}
        description={t("editor.newFileDescription")}
        inputLabel={t("editor.newFileNameLabel")}
        inputPlaceholder={t("editor.newFileNamePlaceholder")}
        value={newFileName}
        onValueChange={setNewFileName}
        confirmLabel={t("editor.newFileConfirm")}
        confirmDisabled={!newFileName.trim()}
        cancelLabel={t("common.cancel")}
        onConfirm={() => void handleCreateFile()}
      >
        <p className="text-xs text-muted-foreground">
          {t("editor.newFileLocation", { path: createFileTarget })}
        </p>
      </PromptModal>

      <PromptModal
        open={createDirectoryState !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDirectoryState(null);
            setNewDirectoryName("");
          }
        }}
        title={t("editor.newFolderTitle")}
        description={t("editor.newFolderDescription")}
        inputLabel={t("editor.newFolderNameLabel")}
        inputPlaceholder={t("editor.newFolderNamePlaceholder")}
        value={newDirectoryName}
        onValueChange={setNewDirectoryName}
        confirmLabel={t("editor.newFolderConfirm")}
        confirmDisabled={!newDirectoryName.trim()}
        cancelLabel={t("common.cancel")}
        onConfirm={() => void handleCreateDirectory()}
      >
        <p className="text-xs text-muted-foreground">
          {t("editor.newFolderLocation", { path: createDirectoryTarget })}
        </p>
      </PromptModal>

      <InteractionModal
        open={deleteEntryState !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteEntryState(null);
        }}
        title={t("editor.deleteEntryTitle")}
        description={
          deleteEntryState
            ? t("editor.deleteEntryDescription", { path: deleteEntryState.path })
            : ""
        }
        confirmLabel={t("editor.deleteEntryConfirm")}
        confirmVariant="destructive"
        cancelLabel={t("common.cancel")}
        onConfirm={() => void handleDeleteSelected()}
      />
      <InteractionModal
        open={cloudConfirm}
        onOpenChange={(open) => {
          if (!open) setCloudConfirm(false);
        }}
        title={t("projects.cloudUploadTitle")}
        description={uploadDescription}
        confirmLabel={t("projects.cloudUploadConfirm")}
        confirmVariant="destructive"
        confirmDisabled={!uploadPlan}
        cancelLabel={t("common.cancel")}
        onConfirm={() => void handleCloudUpload()}
      >
        {uploadPlan ? conflictPreview(uploadPlan.conflicts) : null}
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
            value={
              cloudProgress && cloudProgress.total > 0
                ? Math.min(
                    100,
                    Math.round(
                      (cloudProgress.completed / cloudProgress.total) * 100
                    )
                  )
                : 0
            }
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}
