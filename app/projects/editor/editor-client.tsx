"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileDown, FolderPlus, Loader2, Play, RefreshCw, Save, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tree, type TreeViewElement } from "@/components/ui/file-tree";
import { CodeEditor } from "@/components/ui/code-editor";
import {
  ChatBox,
  type ChatBoxHandle,
  type ChatFileChange,
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
  updateProjectState,
  type Project,
} from "@/lib/local-projects";
import { exportVNZipFromDirectory } from "@/lib/vn/export";
import {
  exportProjectDirectoryZip,
  exportReadableProjectZip,
} from "@/lib/project-export";
import { readProjectPreview } from "@/lib/project-source";
import { buildVNProjectFiles } from "@/lib/vn/project-files";
import { readVNProjectFromDirectory } from "@/lib/vn/source-reader";
import type { VNProject } from "@/lib/vn/types";
import { VNEditor } from "./vn-editor";
import { useLang } from "@/lib/i18n";

function isTextPath(path: string): boolean {
  return /\.(md|markdown|ya?ml|txt|json|js|ts|tsx|jsx|css|html|svg)$/i.test(path);
}

function isImagePath(path: string): boolean {
  return /\.(png|jpe?g|gif|webp|avif|bmp|ico)$/i.test(path);
}

function mediaKindForPath(path: string): "image" | "video" | "audio" | null {
  if (isImagePath(path)) return "image";
  if (/\.(mp4|webm|ogg|mov|m4v)$/i.test(path)) return "video";
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

export default function EditorClient() {
  const { t } = useLang();
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
  const [status, setStatus] = useState<EditorStatus>(id ? "loading" : "missing");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const chatRef = useRef<ChatBoxHandle>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

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
      setError(e instanceof Error ? e.message : String(e));
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

  function selectPath(path: string) {
    if (path === "root") {
      setSelectedPath("");
      setSelectedKind("directory");
      setMode("source");
      return;
    }
    if (!path.startsWith("root/")) return;
    const nextPath = path.replace("root/", "");
    const entry = files.find((item) => item.path === nextPath);
    setSelectedPath(nextPath);
    setSelectedKind(entry?.kind ?? null);
    setMode("source");
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
      setError(t("editor.saveFailed") + (e instanceof Error ? e.message : String(e)));
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

  async function handleUploadFiles(fileList: FileList | null) {
    if (!root || !fileList?.length) return;
    setError("");
    try {
      if (dirty) {
        const ok = await handleSave();
        if (!ok) return;
      }
      const target = uploadTargetDirectory(selectedPath, selectedKind);
      const written = await writeFilesToDirectory(root, target, Array.from(fileList));
      await reloadFiles(written.at(-1) ?? selectedPath, "file");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    }
  }

  async function handleCreateDirectory() {
    if (!root) return;
    const name = window.prompt(t("editor.enterFolderName"));
    if (!name) return;
    setError("");
    try {
      const path = resolveNewEntryPath(selectedPath, selectedKind, name);
      await ensurePermission(root, true);
      await createDirectory(root, path);
      await reloadFiles(path, "directory");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleDeleteSelected() {
    if (!root || !selectedPath) return;
    if (!window.confirm(t("editor.confirmDeleteEntry"))) return;
    setError("");
    try {
      if (dirtyPaths.has(selectedPath)) {
        setDirtyPaths((previous) => {
          const next = new Set(previous);
          next.delete(selectedPath);
          return next;
        });
      }
      await ensurePermission(root, true);
      await deleteEntry(root, selectedPath, true);
      setContents((previous) => {
        const next = { ...previous };
        for (const path of Object.keys(next)) {
          if (path === selectedPath || path.startsWith(`${selectedPath}/`)) delete next[path];
        }
        return next;
      });
      setDirtyPaths((previous) => {
        const next = new Set(previous);
        for (const path of [...next]) {
          if (path === selectedPath || path.startsWith(`${selectedPath}/`)) next.delete(path);
        }
        return next;
      });
      await reloadFiles(parentDirectoryPath(selectedPath), "directory");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
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
        throw new Error(`聊天变更只能写入文本文件：${path}`);
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
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  }

  async function handleExport() {
    if (!project || !root) return;
    setExporting(true);
    try {
      if (project.template === "visual-novel") {
        await exportVNZipFromDirectory(root, `${project.title || "openwebgal"}.zip`);
      } else {
        const preview = await readProjectPreview(root, project.template);
        await exportReadableProjectZip(preview, project.title);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  }

  const context = useMemo(() => {
    if (!project) return undefined;
    const source = Object.entries(contents)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([path, content]) => `## ${path}\n\n${content}`)
      .join("\n\n");
    return `# ${project.title}\n模板：${contentTypeById[project.template]?.label[project.lang] ?? project.template}\n\n${source}`;
  }, [contents, project]);

  return (
    <main className="flex h-svh flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <Button render={<Link href="/projects" />} variant="ghost" size="icon" aria-label={t("editor.back")}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-lg font-bold tracking-tight">
            {project?.title ?? t("editor.title")}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={uploadInputRef}
            type="file"
            multiple
            className="sr-only"
            onChange={(event) => void handleUploadFiles(event.currentTarget.files)}
          />
          <Button variant="outline" size="sm" onClick={() => id && void loadProject(id)} disabled={status === "loading"}>
            <RefreshCw className="size-4" />
            {t("editor.refreshFiles")}
          </Button>
          {project && root && (
            <>
              <Button variant="outline" size="sm" onClick={() => uploadInputRef.current?.click()}>
                <Upload className="size-4" />
                {t("editor.uploadFiles")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => void handleCreateDirectory()}>
                <FolderPlus className="size-4" />
                {t("editor.newFolder")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleDeleteSelected()}
                disabled={!selectedPath}
              >
                <Trash2 className="size-4" />
                {t("editor.deleteEntry")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => void handlePreview()}>
                <Play className="size-4" />
                {t("editor.preview")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => void handleExport()} disabled={exporting}>
                {exporting ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
                {project.template === "visual-novel" ? t("vn.exportOpenwebgal") : t("editor.export")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => void handleDownloadSource()} disabled={exporting}>
                {exporting ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
                {t("editor.downloadSource")}
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
      </div>

      {error && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => id && void loadProject(id)}>
            {t("projects.reconnect")}
          </Button>
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[260px_1fr_360px]">
        <aside className="min-h-0 overflow-auto border-b border-border lg:border-b-0 lg:border-r">
          {status === "ready" ? (
            <Tree
              key={`${project?.id ?? "none"}-${files.length}`}
              elements={tree.elements}
              initialExpandedItems={tree.expanded}
              initialSelectedId={selectedPath ? `root/${selectedPath}` : "root"}
              onSelect={selectPath}
              className="p-2"
            />
          ) : (
            <p className="p-4 text-sm text-muted-foreground">
              {status === "loading" ? "…" : t("editor.noProject")}
            </p>
          )}
        </aside>

        <section className="min-h-0 overflow-hidden">
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

        <aside className="min-h-0 overflow-hidden border-t border-border lg:border-l lg:border-t-0">
          <div className="flex h-full min-h-0 flex-col gap-3 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("editor.chat")}
            </p>
            <div className="min-h-0 flex-1">
              <ChatBox
                ref={chatRef}
                chatId={project?.id}
                context={context}
                onFileChanges={applyChatFileChanges}
                className="h-full max-w-none"
              />
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
