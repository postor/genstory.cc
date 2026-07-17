"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileDown, Loader2, Play, RefreshCw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tree, type TreeViewElement } from "@/components/ui/file-tree";
import { CodeEditor } from "@/components/ui/code-editor";
import {
  ChatBox,
  type ChatBoxHandle,
} from "@/openroutermcp/chatbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { contentTypeById } from "@/lib/content-types";
import { loadTemplate } from "@/lib/templates";
import {
  downloadProject,
  getProject,
  listProjects,
  saveProject,
  type Project,
} from "@/lib/local-projects";
import { exportVNZip } from "@/lib/vn/export";
import { buildVNProjectFiles, type VNProjectFile } from "@/lib/vn/project-files";
import { VNEditor, VNSceneList } from "./vn-editor";
import { useLang } from "@/lib/i18n";

function buildTree(files: VNProjectFile[], rootName: string): {
  elements: TreeViewElement[];
  expanded: string[];
} {
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
      const isFile = index === parts.length - 1;
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

export default function EditorClient() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState("AGENTS.md");
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [guidanceOpen, setGuidanceOpen] = useState(false);
  // Onboarding flow after confirming guidance: "model" → "input" → null.
  const [onboardingStep, setOnboardingStep] = useState<"model" | "input" | null>(null);
  const [chatRect, setChatRect] = useState<DOMRect | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  const chatRef = useRef<ChatBoxHandle>(null);
  const chatContainerRef = useRef<HTMLElement>(null);

  function measureChat() {
    const el = chatContainerRef.current;
    if (!el) return;
    setChatRect(el.getBoundingClientRect());
    setViewport({ w: window.innerWidth, h: window.innerHeight });
  }

  async function loadProject(pid: string) {
    setLoading(true);
    setNotFound(false);
    setSaved(false);
    setDirty(false);
    setOnboardingStep(null);
    const p = await getProject(pid);
    if (!p) {
      setNotFound(true);
      setProject(null);
    } else {
      setProject(p);
      setSelectedFilePath(p.template === "visual-novel" ? "AGENTS.md" : "document");
      setSelectedSceneId(p.vn?.chapters[0]?.scenes[0]?.id ?? null);
      // Show the first-chapter guidance once per project (tracked in
      // localStorage) when entering the editor for an existing project.
      const shown = (() => {
        try {
          return window.localStorage.getItem(`genstory_guidance_${pid}`);
        } catch {
          return null;
        }
      })();
      if (!shown) setGuidanceOpen(true);
    }
    setLoading(false);
  }

  function dismissGuidance() {
    if (project) {
      try {
        window.localStorage.setItem(`genstory_guidance_${project.id}`, "1");
      } catch {
        /* ignore storage errors */
      }
    }
    setGuidanceOpen(false);
  }

  // Confirm guidance → start the onboarding overlay (model selection first).
  function startGuidance() {
    dismissGuidance();
    setOnboardingStep("model");
    measureChat();
  }

  // User picked a model during onboarding → move to the input step and prefill
  // the prompt without sending it.
  function handleModelSelected() {
    if (onboardingStep !== "model") return;
    setOnboardingStep("input");
    chatRef.current?.prefill(t("editor.firstChapterPrompt"));
  }

  // A message was sent → the onboarding hint is no longer needed.
  function handleChatSent() {
    setOnboardingStep(null);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await listProjects();
      if (cancelled) return;
      setProjects(list);
      const target = id ?? list[0]?.id;
      if (target) {
        await loadProject(target);
      } else {
        setLoading(false);
        setNotFound(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Keep the chat-area rectangle (used by the onboarding cutout mask) in sync
  // with layout and viewport changes while onboarding is active.
  useEffect(() => {
    if (!onboardingStep) return;
    measureChat();
    window.addEventListener("resize", measureChat);
    return () => window.removeEventListener("resize", measureChat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingStep]);

  function update(patch: Partial<Project>) {
    setProject((prev) => (prev ? { ...prev, ...patch } : prev));
    setSaved(false);
    setDirty(true);
  }

  async function handleSave() {
    if (!project) return;
    setSaving(true);
    try {
      const next: Project = { ...project, updatedAt: Date.now() };
      await saveProject(next);
      setProject(next);
      setSaved(true);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleLoadTemplate() {
    if (!project) return;
    try {
      const content = await loadTemplate(project.lang, project.template);
      update({ content });
    } catch (e) {
      window.alert(e instanceof Error ? e.message : String(e));
    }
  }

  function handleFileSelect(path: string) {
    setSelectedFilePath(path);
    const file = vnFiles.find((candidate) => candidate.path === path);
    if (file?.sceneId) setSelectedSceneId(file.sceneId);
  }

  const isVN = project?.template === "visual-novel";
  const vnFiles = useMemo(
    () =>
      project?.vn
        ? buildVNProjectFiles(project.vn, project.content)
        : [],
    [project?.content, project?.vn]
  );
  const vnTree = useMemo(
    () => buildTree(vnFiles, "source"),
    [vnFiles]
  );
  const singleDocumentTree = useMemo(
    () =>
      buildTree(
        [
          {
            path: project?.template === "book" ? "AGENTS.md" : "document",
            content: project?.content ?? "",
            kind: "metadata",
          },
        ],
        "project"
      ),
    [project?.content, project?.template]
  );
  const selectedVNFile = vnFiles.find((file) => file.path === selectedFilePath);

  async function handleExportVN() {
    if (!project?.vn) return;
    setExporting(true);
    try {
      await exportVNZip(project.vn);
    } finally {
      setExporting(false);
    }
  }

  // The file shown in the tree / editor. A book's document is its AGENTS.md
  // (seeded from the localized book.md), so it is named "AGENTS.md" rather
  // than falling back to the template label (e.g. "图书.md").
  function projectFileName(p: Project): string {
    if (p.template === "book") return "AGENTS.md";
    return `${p.title || t("editor.noProject")}.md`;
  }

  function addChapter() {
    if (!project?.vn) return;
    update({
      vn: {
        ...project.vn,
        chapters: [
          ...project.vn.chapters,
          { id: `chapter-${crypto.randomUUID().slice(0, 8)}`, title: "新章节", scenes: [] },
        ],
      },
    });
  }

  function addScene() {
    if (!project?.vn?.chapters[0]) return;
    const id = `scene-${crypto.randomUUID().slice(0, 8)}`;
    update({
      vn: {
        ...project.vn,
        chapters: project.vn.chapters.map((chapter, index) =>
          index === 0
            ? {
                ...chapter,
                scenes: [
                  ...chapter.scenes,
                  { id, title: "新场景", characters: [], script: "" },
                ],
              }
            : chapter
        ),
      },
    });
    setSelectedSceneId(id);
    setSelectedFilePath(`${project.vn.chapters[0].id}/scenes/${id}/script.md`);
  }

  // Build the chat context from AGENTS.md plus the current OpenWebGal source.
  function buildContext(p: Project): string {
    if (p.template === "visual-novel" && p.vn) {
      const sourceFiles = buildVNProjectFiles(p.vn, p.content)
        .map((file) => `## ${file.path}\n\n${file.content}`)
        .join("\n\n");
      return `# ${p.title}\n模板：视觉小说 / OpenWebGal\n\n## AGENTS.md 约束\n\n${p.content}\n\n## OpenWebGal 项目源文件\n\n${sourceFiles}`;
    }
    return `# ${p.title}\n模板：${contentTypeById[p.template]?.label[p.lang] ?? p.template}\n\n${p.content}`;
  }

  return (
    <main className="flex h-[calc(100svh-3.5rem)] flex-col">
      {/* workspace header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <Button
            render={<Link href="/projects" />}
            variant="ghost"
            size="icon"
            aria-label={t("editor.back")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-lg font-bold tracking-tight">{t("editor.title")}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {isVN ? (
            <>
              <Button
                render={<Link href={`/projects/preview?id=${project?.id}`} />}
                variant="outline"
                size="sm"
                disabled={!project}
              >
                <Play className="size-4" />
                {t("vn.preview")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleExportVN()}
                disabled={!project?.vn || exporting}
              >
                {exporting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileDown className="size-4" />
                )}
                {t("vn.exportOpenwebgal")}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleLoadTemplate()}
                disabled={!project}
              >
                <RefreshCw className="size-4" />
                {t("editor.loadTemplate")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => project && downloadProject(project)}
                disabled={!project}
              >
                <FileDown className="size-4" />
                {t("editor.export")}
              </Button>
            </>
          )}
          <Button size="sm" onClick={() => void handleSave()} disabled={!project || saving}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {t("editor.save")}
            {saved && !saving ? ` · ${t("editor.saved")}` : ""}
          </Button>
        </div>
      </div>

      {/* three-pane workspace */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[260px_1fr_360px]">
        {/* left: project file tree */}
        <aside className="min-h-0 overflow-auto border-b border-border lg:border-b-0 lg:border-r">
          {projects.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">{t("editor.noProjects")}</p>
          ) : (
            <div className="flex h-full min-h-0 flex-col">
              <div className="min-h-0 flex-1">
                <Tree
                  key={`${project?.id ?? "none"}-${isVN ? "vn" : "document"}`}
                  elements={isVN ? vnTree.elements : singleDocumentTree.elements}
                  initialExpandedItems={isVN ? vnTree.expanded : singleDocumentTree.expanded}
                  initialSelectedId={
                    isVN ? `source/${selectedFilePath}` : "project/document"
                  }
                  onSelect={(path) =>
                    isVN
                      ? handleFileSelect(path.replace(/^source\//, ""))
                      : setSelectedFilePath("document")
                  }
                  className="p-2"
                />
              </div>
              {isVN && project?.vn && (
                <div className="max-h-[45%] min-h-0 overflow-auto border-t border-border">
                  <VNSceneList
                    vn={project.vn}
                    selectedSceneId={selectedSceneId}
                    onSceneSelect={(sceneId) => {
                      setSelectedSceneId(sceneId);
                      const chapter = project.vn?.chapters.find((item) =>
                        item.scenes.some((scene) => scene.id === sceneId)
                      );
                      if (chapter) {
                        setSelectedFilePath(
                          `${chapter.id}/scenes/${sceneId}/script.md`
                        );
                      }
                    }}
                    onAddChapter={addChapter}
                    onAddScene={addScene}
                  />
                </div>
              )}
            </div>
          )}
        </aside>

        {/* center: VS Code-style file editor */}
        <section className="min-h-0 overflow-hidden p-0">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">…</p>
            </div>
          ) : notFound || !project ? (
            <div className="flex h-full items-center justify-center px-4">
              <p className="text-sm text-muted-foreground">
                {projects.length === 0 ? t("editor.noProjects") : t("editor.noProject")}
              </p>
            </div>
          ) : isVN ? (
            project.vn ? (
              selectedFilePath === "AGENTS.md" ? (
                <CodeEditor
                  value={project.content}
                  onChange={(value) => update({ content: value })}
                  filename="AGENTS.md"
                  dirty={dirty}
                />
              ) : selectedVNFile ? (
                <CodeEditor
                  value={selectedVNFile.content}
                  onChange={() => undefined}
                  filename={selectedVNFile.path}
                  readOnly
                  dirty={dirty}
                />
              ) : (
                <VNEditor
                  vn={project.vn}
                  onChange={(vn) => update({ vn })}
                  selectedSceneId={selectedSceneId}
                  onSceneSelect={setSelectedSceneId}
                  showSceneList={false}
                />
              )
            ) : (
              <div className="flex h-full items-center justify-center px-4">
                <p className="text-sm text-muted-foreground">{t("vn.noScenes")}</p>
              </div>
            )
          ) : (
            <CodeEditor
              value={project.content}
              onChange={(v) => update({ content: v })}
              filename={projectFileName(project)}
              dirty={dirty}
              onRename={(name) => update({ title: name })}
            />
          )}
        </section>

        {/* right: chat assistant */}
        <aside
          ref={chatContainerRef}
          className="min-h-0 overflow-auto border-t border-border lg:border-l lg:border-t-0"
        >
          <div className="flex h-full flex-col gap-3 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("editor.chat")}
            </p>
            <div className="min-h-0 flex-1 overflow-auto">
              <ChatBox
                ref={chatRef}
                chatId={project?.id}
                context={project ? buildContext(project) : undefined}
                onModelChange={handleModelSelected}
                onSend={handleChatSent}
              />
            </div>
          </div>
        </aside>
      </div>

      {/* Onboarding overlay: a frosted-glass SVG mask that reveals only the
          chat area (non-blocking), with hint bubbles for model + input. */}
      {onboardingStep && chatRect && viewport.w > 0 && (
        <OnboardingOverlay
          step={onboardingStep}
          rect={chatRect}
          viewport={viewport}
          pickModelText={t("editor.guidancePickModel")}
          pressEnterText={t("editor.guidancePressEnter")}
        />
      )}

      <Dialog open={guidanceOpen} onOpenChange={(o) => !o && dismissGuidance()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editor.guidanceTitle")}</DialogTitle>
            <DialogDescription>{t("editor.guidanceDesc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={dismissGuidance}>
              {t("editor.guidanceSkip")}
            </Button>
            <Button onClick={startGuidance}>{t("editor.guidanceStart")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

/** Frosted SVG mask with a cutout over the chat area + onboarding hint bubbles. */
function OnboardingOverlay({
  step,
  rect,
  viewport,
  pickModelText,
  pressEnterText,
}: {
  step: "model" | "input";
  rect: DOMRect;
  viewport: { w: number; h: number };
  pickModelText: string;
  pressEnterText: string;
}) {
  const maskId = "onboard-cutout";
  return (
    <>
      <svg className="pointer-events-none absolute h-0 w-0" aria-hidden>
        <defs>
          <mask
            id={maskId}
            maskUnits="userSpaceOnUse"
            x="0"
            y="0"
            width={viewport.w}
            height={viewport.h}
          >
            <rect x="0" y="0" width={viewport.w} height={viewport.h} fill="white" />
            <rect
              x={rect.x - 6}
              y={rect.y - 6}
              width={rect.width + 12}
              height={rect.height + 12}
              rx="14"
              fill="black"
            />
          </mask>
        </defs>
      </svg>

      <div
        className="pointer-events-none fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
        style={{ WebkitMaskImage: `url(#${maskId})`, maskImage: `url(#${maskId})` }}
      />

      {step === "model" && (
        <OnboardBubble
          x={rect.x + rect.width / 2}
          y={Math.max(16, rect.y - 92)}
          text={pickModelText}
        />
      )}
      {step === "input" && (
        <OnboardBubble
          x={rect.x + rect.width / 2}
          y={rect.y + rect.height - 130}
          text={pressEnterText}
        />
      )}
    </>
  );
}

/** A small non-interactive hint bubble with a downward arrow. */
function OnboardBubble({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <div
      className="pointer-events-none fixed z-50 w-64 -translate-x-1/2"
      style={{ top: y, left: x }}
    >
      <div className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground shadow-lg">
        {text}
      </div>
      <div className="mx-auto h-0 w-0 border-x-[8px] border-t-[10px] border-x-transparent border-t-primary" />
    </div>
  );
}
