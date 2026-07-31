"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Feather,
  Loader2,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  hasAcceptedLegalTerms,
  recordLegalTermsAcceptance,
} from "@/lib/legal-consent";
import { LegalConsentCheckbox } from "@/components/legal-consent-checkbox";

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

  const [createTemplate, setCreateTemplate] = useState<ContentTypeId | null>(null);
  const [title, setTitle] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [legalConsentState, setLegalConsentState] = useState<
    "checking" | "required" | "accepted"
  >("checking");
  const [legalConsentChecked, setLegalConsentChecked] = useState(false);
  const [notice, setNotice] = useState<{
    title: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    document.title = t("meta.newTitle");
  }, [t]);

  useEffect(() => {
    setLegalConsentState(hasAcceptedLegalTerms() ? "accepted" : "required");
  }, []);

  useEffect(() => {
    let cancelled = false;

    void listProjects()
      .then((items) => {
        if (cancelled) return;
        setProjects(items);
      })
      .catch(() => {
        if (cancelled) return;
        setProjects([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const createType = createTemplate
    ? contentTypes.find((c) => c.id === createTemplate)
    : undefined;
  const createNote = createTemplate ? assistantNotes[createTemplate] : undefined;

  function openCreateDialog(nextTemplate: ContentTypeId) {
    setCreateTemplate(nextTemplate);
    setTitle(nextDefaultProjectTitle(nextTemplate, lang, projects));
  }

  function closeCreateDialog() {
    setCreateTemplate(null);
    setTitle("");
    setLegalConsentChecked(false);
  }

  async function handleSubmit() {
    if (!createTemplate) {
      setNotice({
        title: t("create.noTemplateTitle"),
        description: t("create.noTemplateDescription"),
      });
      return;
    }
    if (legalConsentState !== "accepted" && !legalConsentChecked) {
      setNotice({
        title: t("legal.consentRequiredTitle"),
        description: t("legal.consentRequiredDescription"),
      });
      return;
    }
    setSubmitting(true);
    try {
      if (!supportsFileSystemAccess()) {
        throw new Error(t("create.browserUnsupported"));
      }
      if (legalConsentState !== "accepted") {
        recordLegalTermsAcceptance();
        setLegalConsentState("accepted");
      }
      const now = Date.now();
      const id = crypto.randomUUID();
      const latestProjects = await listProjects().catch(() => projects);
      const defaultTitle = nextDefaultProjectTitle(createTemplate, lang, latestProjects);
      const projectTitle = title.trim() || defaultTitle;
      await initializeProjectDirectory(
        createTemplate,
        id,
        lang,
        projectTitle
      );
      const project: Project = {
        id,
        template: createTemplate,
        title: projectTitle,
        lang,
        createdAt: now,
        updatedAt: now,
      };
      await saveProject(project);
      trackProjectCreated({
        template: createTemplate,
        lang,
        customTitle: projectTitle !== defaultTitle,
      });
      router.push(`/projects/editor?id=${id}`);
    } catch (e) {
      setSubmitting(false);
      if (e instanceof DOMException && e.name === "AbortError") return;
      closeCreateDialog();
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

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[linear-gradient(180deg,rgba(247,243,255,0.84)_0%,rgba(255,255,255,0.82)_38%,rgba(251,250,255,0.84)_100%)] font-[var(--font-geist-sans)] text-[#121331]">
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
                    ? "选择一种类型后，为作品命名并开始编辑"
                    : "Choose a format, name it, and start editing."}
                </p>
              </div>
              <Sparkles aria-hidden="true" className="size-5 text-[#9a75f5]" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {contentTypes.map((type) => (
                <CreateTypeCard
                  key={type.id}
                  lang={lang}
                  type={type}
                  onOpen={() => openCreateDialog(type.id)}
                />
              ))}
            </div>
          </section>

          <AssistantCard lang={lang} />
        </div>
      </div>

      <CreateProjectDialog
        lang={lang}
        titleValue={title}
        createType={createType}
        createNote={createNote}
        submitting={submitting}
        submitLabel={t("create.submit")}
        cancelLabel={t("create.cancel")}
        inputLabel={t("create.name")}
        inputPlaceholder={t("create.namePlaceholder")}
        onTitleChange={setTitle}
        requiresLegalConsent={legalConsentState !== "accepted"}
        legalConsentChecked={legalConsentChecked}
        onLegalConsentChange={setLegalConsentChecked}
        onSubmit={() => void handleSubmit()}
        onClose={closeCreateDialog}
      />

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

function CreateTypeCard({
  lang,
  type,
  onOpen,
}: {
  lang: "zh" | "en";
  type: (typeof contentTypes)[number];
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group min-w-0 rounded-xl text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#9f7aff]/35"
    >
      <Card className="h-full overflow-hidden border-[#e9e5fb] bg-white/90 shadow-[0_10px_24px_rgba(92,75,160,0.06)] transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:border-[#cfc0ff] group-hover:shadow-[0_16px_32px_rgba(92,75,160,0.12)]">
        <CardHeader className="gap-0 p-3 pb-1 sm:p-4 sm:pb-1">
          <div className="relative flex h-24 w-full items-center justify-center overflow-hidden rounded-lg bg-[#f3efff] sm:h-28">
            <Image
              src={typeImages[type.id]}
              alt=""
              fill
              sizes="(max-width: 640px) 82vw, (max-width: 1024px) 30vw, 220px"
              className="object-contain object-center transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 p-3 pt-2 sm:p-4 sm:pt-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="min-w-0 text-base text-[#242044]">
              {type.label[lang]}
            </CardTitle>
            <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-[#f2edff] px-2.5 text-xs font-semibold text-[#7148db] transition-colors group-hover:bg-[#8754ff] group-hover:text-white">
              Go
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </span>
          </div>
          <CardDescription className="text-xs leading-5 text-[#7a7897]">
            {type.description[lang]}
          </CardDescription>
        </CardContent>
      </Card>
    </button>
  );
}

function CreateProjectDialog({
  lang,
  titleValue,
  createType,
  createNote,
  submitting,
  submitLabel,
  cancelLabel,
  inputLabel,
  inputPlaceholder,
  onTitleChange,
  requiresLegalConsent,
  legalConsentChecked,
  onLegalConsentChange,
  onSubmit,
  onClose,
}: {
  lang: "zh" | "en";
  titleValue: string;
  createType?: (typeof contentTypes)[number];
  createNote?: { title: string; body: string };
  submitting: boolean;
  submitLabel: string;
  cancelLabel: string;
  inputLabel: string;
  inputPlaceholder: string;
  onTitleChange: (value: string) => void;
  requiresLegalConsent: boolean;
  legalConsentChecked: boolean;
  onLegalConsentChange: (checked: boolean) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={createType !== undefined}
      onOpenChange={(open) => {
        if (!open && !submitting) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="border-[#e8e0ff] bg-white/95 p-0 text-[#121331] shadow-[0_24px_70px_rgba(61,45,120,0.2)] sm:max-w-md"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="space-y-5 p-5 sm:p-6">
            <DialogHeader>
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eee7ff] text-[#7951dd]">
                  <Sparkles className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <DialogTitle className="text-lg font-bold text-[#252047]">
                    {createType
                      ? lang === "zh"
                        ? `创建${createType.label[lang]}`
                        : `Create ${createType.label[lang]}`
                      : submitLabel}
                  </DialogTitle>
                  <DialogDescription className="mt-2 leading-6 text-[#7a7897]">
                    {createNote?.body ??
                      (lang === "zh"
                        ? "给作品一个名字，然后进入编辑器。"
                        : "Name the work, then open the editor.")}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {createType ? (
              <div className="flex items-center gap-3 rounded-xl border border-[#eeeafd] bg-[#f8f5ff] px-3 py-2">
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-[#f3efff]">
                  <Image
                    src={typeImages[createType.id]}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-contain object-center"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#372272]">
                    {createNote?.title ?? createType.label[lang]}
                  </p>
                  <p className="mt-1 text-xs text-[#8b88a4]">
                    {createType.label[lang]}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="create-project-name" className="font-semibold text-[#252047]">
                {inputLabel}
              </Label>
              <div className="flex items-center gap-3 rounded-xl border border-[#b79cff] bg-white px-3 shadow-[0_8px_22px_rgba(122,81,220,0.08)] transition-colors focus-within:border-[#8754ff] focus-within:ring-3 focus-within:ring-[#9f7aff]/20">
                <Feather aria-hidden="true" className="size-5 shrink-0 text-[#a78af0]" />
                <Input
                  id="create-project-name"
                  autoFocus
                  value={titleValue}
                  onChange={(event) => onTitleChange(event.target.value)}
                  placeholder={inputPlaceholder}
                  className="h-12 border-0 bg-transparent px-0 text-base shadow-none focus-visible:border-0 focus-visible:ring-0"
                />
              </div>
            </div>

            {requiresLegalConsent ? (
              <LegalConsentCheckbox
                lang={lang}
                checked={legalConsentChecked}
                onChange={onLegalConsentChange}
              />
            ) : null}
          </div>

          <DialogFooter className="border-[#eeeafd] bg-[#fbfaff] sm:justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={onClose}
              className="border-[#d8cdf9] bg-white text-[#6844c7] hover:border-[#bba7f4] hover:bg-white hover:text-[#4c27ba]"
            >
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              disabled={
                submitting ||
                (requiresLegalConsent && !legalConsentChecked)
              }
              className="border-0 bg-[#8754ff] text-white shadow-[0_12px_30px_rgba(95,44,255,0.24)] hover:bg-[#7642ef]"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles data-icon="inline-start" />
              )}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AssistantCard({ lang }: { lang: "zh" | "en" }) {
  return (
    <Card className="overflow-hidden border-[#e8e3ff] bg-white/85 shadow-[0_18px_45px_rgba(88,67,166,0.1)]">
      <div className="relative h-36 overflow-hidden bg-[linear-gradient(145deg,#efe8ff_0%,#ffffff_82%)] sm:h-44">
        <div className="absolute -right-8 -top-10 size-32 rounded-full bg-[#d7c7ff]/45 blur-2xl" />
        <Image
          src="/home/fg.png"
          alt=""
          fill
          sizes="320px"
          className="relative object-contain object-bottom"
        />
      </div>
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div>
          <p className="text-sm font-semibold text-[#7653db]">
            {lang === "zh" ? "CC 创作助手" : "CC creative assistant"}
          </p>
          <h2 className="mt-1 text-lg font-bold leading-6 text-[#252047]">
            {lang === "zh" ? "选定类型后再命名" : "Pick a format, then name it"}
          </h2>
        </div>
        <div className="rounded-xl border border-[#e8e0ff] bg-[#f8f5ff] px-4 py-3">
          <p className="text-sm leading-6 text-[#6d5d9b]">
            {lang === "zh"
              ? "点击任意卡片或 Go，CC 会先给作品一个默认名字，你也可以马上改掉。"
              : "Click any card or Go. CC will suggest a default name that you can edit before creating."}
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
