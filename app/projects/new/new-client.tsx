"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Feather,
  FolderOpen,
  Loader2,
  Plus,
  Sparkles,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InteractionModal } from "@/components/ui/interaction-modal";
import { contentTypes, type ContentTypeId } from "@/lib/content-types";
import {
  listProjects,
  saveProject,
  type Project,
} from "@/lib/local-projects";
import {
  initializeProjectDirectory,
  supportsFileSystemAccess,
} from "@/lib/file-system/browser";
import { nextDefaultProjectTitle } from "@/lib/project-naming";
import { useLang } from "@/lib/i18n";
import { localizePlatformErrorMessage } from "@/lib/platform-errors";
import { trackProjectCreated } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const typeImages: Record<ContentTypeId, string> = {
  book: "/home/type-icons/book.png",
  "picture-book": "/home/type-icons/book.png",
  comic: "/home/type-icons/comic.png",
  "visual-novel": "/home/type-icons/visual-novel.png",
  "interactive-video": "/home/type-icons/video.png",
  "phaser-game": "/home/type-icons/game.png",
};

const assistantNotes: Record<ContentTypeId, { title: string; body: string }> = {
  book: {
    title: "从灵感开始写下第一章",
    body: "先确定作品名，CC 会帮你把长篇内容整理成清晰的章节结构。",
  },
  "picture-book": {
    title: "让每一页都成为一个画面",
    body: "从故事和插画开始，逐步组织适合阅读与分享的绘本作品。",
  },
  comic: {
    title: "把分镜变成完整故事",
    body: "管理页面、角色和对话，让漫画创作从灵感走向可编辑的作品。",
  },
  "visual-novel": {
    title: "从剧本走进故事世界",
    body: "用场景、角色和分支搭建沉浸式互动叙事，随时预览你的选择。",
  },
  "interactive-video": {
    title: "让视频拥有更多可能",
    body: "把片段、时间线和选择点组合起来，规划可播放的分支体验。",
  },
  "phaser-game": {
    title: "从想法开始做一款游戏",
    body: "使用 Phaser 场景、脚本和资源管理，逐步搭建可运行的浏览器游戏。",
  },
};

export default function NewClient() {
  const { lang, t } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();

  const prefill = searchParams.get("template");
  const [template, setTemplate] = useState<ContentTypeId | "">(
    prefill && contentTypes.some((c) => c.id === prefill)
      ? (prefill as ContentTypeId)
      : (contentTypes[0]?.id ?? "")
  );
  const [title, setTitle] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{
    title: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    document.title = t("meta.newTitle");
  }, [t]);

  useEffect(() => {
    void listProjects().then(setProjects).catch(() => setProjects([]));
  }, []);

  const defaultTitle = template ? nextDefaultProjectTitle(template, lang, projects) : "";

  async function handleSubmit() {
    if (!template) {
      setNotice({
        title: t("create.noTemplateTitle"),
        description: t("create.noTemplateDescription"),
      });
      return;
    }
    setSubmitting(true);
    try {
      if (!supportsFileSystemAccess()) {
        throw new Error(t("create.browserUnsupported"));
      }
      const now = Date.now();
      const id = crypto.randomUUID();
      const latestProjects = await listProjects().catch(() => projects);
      const projectTitle =
        title.trim() || nextDefaultProjectTitle(template, lang, latestProjects);
      await initializeProjectDirectory(
        template,
        id,
        lang,
        projectTitle
      );
      const project: Project = {
        id,
        template,
        title: projectTitle,
        lang,
        createdAt: now,
        updatedAt: now,
      };
      await saveProject(project);
      trackProjectCreated({
        template,
        lang,
        customTitle: title.trim().length > 0,
      });
      router.push(`/projects/editor?id=${id}`);
    } catch (e) {
      setSubmitting(false);
      if (e instanceof DOMException && e.name === "AbortError") return;
      setNotice({
        title: t("create.createFailedTitle"),
        description: t("create.createFailedDescription", {
          message: localizePlatformErrorMessage(
            e instanceof Error ? e.message : String(e),
            lang
          ),
        }),
      });
    }
  }

  const selectedType = template ? contentTypes.find((c) => c.id === template) : undefined;
  const assistantNote = template ? assistantNotes[template] : undefined;

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[linear-gradient(180deg,#f7f3ff_0%,#ffffff_38%,#fbfaff_100%)] font-[var(--font-geist-sans)] text-[#121331]">
      <Image
        src="/home/pc-banner-bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none absolute inset-0 object-cover object-top opacity-[0.09]"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(190,162,255,0.28),transparent_40%)]" />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-8 pb-12 sm:px-6 sm:py-10 lg:px-8 lg:pb-16">
        <div className="mb-8 flex items-start justify-between gap-4 sm:mb-10">
          <div className="flex items-start gap-3 sm:gap-4">
            <Feather
              aria-hidden="true"
              className="mt-1 size-9 shrink-0 text-[#9f7aff] sm:size-12"
            />
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t("create.title")}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#6b6a89] sm:text-base">
                {lang === "zh"
                  ? "选择创作类型，开启你的故事世界之旅"
                  : "Choose a creation type and start your story world."}
              </p>
            </div>
          </div>
          <Button
            render={<Link href="/projects" />}
            variant="outline"
            size="lg"
            className="shrink-0 border-[#d8cdf9] bg-white/75 text-[#6844c7] shadow-[0_8px_20px_rgba(92,75,160,0.06)] hover:border-[#bba7f4] hover:bg-white hover:text-[#4c27ba]"
          >
            {t("create.cancel")}
          </Button>
        </div>

        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-2xl border border-[#e9e5fb] bg-white/80 p-4 shadow-[0_18px_45px_rgba(88,67,166,0.08)] backdrop-blur-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <Label className="text-base font-semibold text-[#252047] sm:text-lg">
                  {t("create.template")}
                </Label>
                <p className="mt-1 text-sm text-[#8b88a4]">
                  {lang === "zh"
                    ? "选择一个适合你当前创作方式的类型"
                    : "Choose the format that fits your idea."}
                </p>
              </div>
              <Sparkles aria-hidden="true" className="size-5 text-[#9a75f5]" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {contentTypes.map((c) => {
                const selected = template === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setTemplate(c.id)}
                    className="group min-w-0 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#9f7aff]/35"
                  >
                    <Card
                      className={cn(
                        "h-full overflow-hidden border-[#e9e5fb] bg-white/90 shadow-[0_10px_24px_rgba(92,75,160,0.06)] transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:border-[#cfc0ff] group-hover:shadow-[0_16px_32px_rgba(92,75,160,0.12)]",
                        selected &&
                          "border-[#9f7aff] bg-[#f8f5ff] shadow-[0_12px_28px_rgba(122,81,220,0.18)] ring-2 ring-[#9f7aff]/25"
                      )}
                    >
                      <div className="hidden sm:block">
                        <CardHeader className="gap-0 p-3 pb-1 sm:p-4 sm:pb-1">
                          <div className="relative flex h-24 w-full items-center justify-center overflow-hidden rounded-lg bg-[#f3efff]">
                            <Image
                              src={typeImages[c.id]}
                              alt=""
                              fill
                              sizes="(max-width: 1024px) 30vw, 220px"
                              className="object-contain object-center transition-transform duration-300 group-hover:scale-[1.03]"
                            />
                            <span
                              className={cn(
                                "absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-white/80 text-[#ab9fc9] shadow-sm transition-colors",
                                selected && "bg-[#8754ff] text-white"
                              )}
                            >
                              <CheckCircle2 className="size-4" aria-hidden="true" />
                            </span>
                          </div>
                          <CardTitle className="mt-3 text-base text-[#242044]">
                            {c.label[lang]}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-1">
                          <CardDescription className="text-xs leading-5 text-[#7a7897]">
                            {c.description[lang]}
                          </CardDescription>
                        </CardContent>
                      </div>

                      <div className="flex min-h-20 items-center gap-3 px-3 py-2.5 sm:hidden">
                        <div
                          className={cn(
                            "relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-[#f3efff]",
                            selected && "h-24 w-28"
                          )}
                        >
                          <Image
                            src={typeImages[c.id]}
                            alt=""
                            fill
                            sizes="112px"
                            className="object-contain object-center"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base text-[#242044]">
                            {c.label[lang]}
                          </CardTitle>
                          <CardDescription
                            className={cn(
                              "mt-1 text-xs leading-5 text-[#7a7897]",
                              !selected && "hidden"
                            )}
                          >
                            {c.description[lang]}
                          </CardDescription>
                        </div>
                        <span
                          className={cn(
                            "grid size-8 shrink-0 place-items-center rounded-full text-[#8754ff]",
                            selected ? "bg-[#8754ff] text-white" : "bg-[#f0eaff]"
                          )}
                        >
                          {selected ? (
                            <CheckCircle2 className="size-4" aria-hidden="true" />
                          ) : (
                            <Plus className="size-5" aria-hidden="true" />
                          )}
                        </span>
                      </div>
                    </Card>
                  </button>
                );
              })}
            </div>

            <div className="mt-7 border-t border-[#eeeafd] pt-6 sm:mt-8 sm:pt-7">
              <Label htmlFor="project-name" className="text-base font-semibold text-[#252047] sm:text-lg">
                {t("create.name")}
              </Label>
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-[#b79cff] bg-white/85 px-3 shadow-[0_8px_22px_rgba(122,81,220,0.08)] transition-colors focus-within:border-[#8754ff] focus-within:ring-3 focus-within:ring-[#9f7aff]/20 sm:px-4">
                <Feather aria-hidden="true" className="size-5 shrink-0 text-[#a78af0]" />
                <Input
                  id="project-name"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={defaultTitle || t("create.namePlaceholder")}
                  className="h-12 border-0 bg-transparent px-0 text-base shadow-none focus-visible:border-0 focus-visible:ring-0 sm:text-lg"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
              <Button
                onClick={() => void handleSubmit()}
                disabled={submitting}
                size="lg"
                className="min-h-12 w-full border-0 bg-[#8754ff] px-6 text-base text-white shadow-[0_12px_30px_rgba(95,44,255,0.28)] hover:bg-[#7642ef] sm:w-auto"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles data-icon="inline-start" />
                )}
                {t("create.submit")}
              </Button>
              <Link
                href="/projects"
                className="inline-flex items-center justify-center gap-2 text-sm font-medium text-[#7b6ca2] transition-colors hover:text-[#5c34ce]"
              >
                <FolderOpen className="size-4" />
                {lang === "zh" ? "创建后稍后编辑" : "Create and edit later"}
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </section>

          <AssistantCard
            lang={lang}
            selectedType={selectedType}
            note={assistantNote}
          />
        </div>
      </div>

      <InteractionModal
        open={notice !== null}
        onOpenChange={(open) => {
          if (!open) setNotice(null);
        }}
        title={notice?.title ?? ""}
        description={notice?.description}
        confirmLabel={t("common.ok")}
        onConfirm={() => setNotice(null)}
      />
    </main>
  );
}

function AssistantCard({
  lang,
  selectedType,
  note,
}: {
  lang: "zh" | "en";
  selectedType?: (typeof contentTypes)[number];
  note?: { title: string; body: string };
}) {
  return (
    <Card className="overflow-hidden border-[#e8e3ff] bg-white/85 shadow-[0_18px_45px_rgba(88,67,166,0.1)]">
      <div className="relative overflow-hidden bg-[linear-gradient(145deg,#efe8ff_0%,#ffffff_82%)] px-5 pb-3 pt-5 sm:px-6">
        <div className="absolute -right-8 -top-10 size-32 rounded-full bg-[#d7c7ff]/45 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <Image
            src="/home/assistant-bust.png"
            alt=""
            width={110}
            height={116}
            className="size-20 shrink-0 object-contain sm:size-24"
          />
          <div>
            <p className="text-sm font-semibold text-[#7653db]">
              {lang === "zh" ? "CC 创作助手" : "CC creative assistant"}
            </p>
            <h2 className="mt-1 text-lg font-bold leading-6 text-[#252047]">
              {note?.title ?? (lang === "zh" ? "从一个想法开始" : "Start with an idea")}
            </h2>
          </div>
        </div>
      </div>
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="rounded-xl border border-[#e8e0ff] bg-[#f8f5ff] px-4 py-3">
          <p className="text-sm leading-6 text-[#6d5d9b]">
            {note?.body ??
              (lang === "zh"
                ? "选一个创作类型，CC 会陪你把灵感整理成真正可编辑的作品。"
                : "Choose a format and CC will help turn the idea into an editable work.")}
          </p>
        </div>
        <div className="space-y-4">
          <AssistantPoint
            title={lang === "zh" ? "结构化创作" : "Structured making"}
            body={lang === "zh" ? "把灵感整理成清晰的项目文件" : "Turn ideas into clear project files"}
          />
          <AssistantPoint
            title={lang === "zh" ? "多类型支持" : "Many formats"}
            body={lang === "zh" ? "文字、漫画、游戏等类型都能从这里开始" : "Start with books, comics, games, and more"}
          />
          <AssistantPoint
            title={lang === "zh" ? "本地保存" : "Local-first"}
            body={lang === "zh" ? "作品默认保存在当前浏览器中" : "Your work stays in this browser by default"}
          />
        </div>
        {selectedType ? (
          <div className="flex items-center gap-2 border-t border-[#eeeafd] pt-4 text-xs text-[#8b88a4]">
            <span className="size-2 rounded-full bg-[#8754ff]" />
            {lang === "zh" ? `当前选择：${selectedType.label[lang]}` : `Selected: ${selectedType.label[lang]}`}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function AssistantPoint({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[#eee7ff] text-[#7951dd]">
        <Sparkles className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#372272]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[#8b88a4]">{body}</p>
      </div>
    </div>
  );
}
