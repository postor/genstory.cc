"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Clapperboard,
  Download,
  Eye,
  FileArchive,
  FileImage,
  Gamepad2,
  Loader2,
  MessageCircle,
  Play,
} from "lucide-react";

import { PublicCaseProjectPreview } from "@/components/public-case-project-preview";
import { ShowcaseTemplateDownload } from "@/components/showcase-template-download";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  publicBookCaseProject,
  publicComicCaseProject,
  publicPhaserGameCaseProject,
  type PublicCaseProject,
} from "@/lib/ai-prompt-examples";
import {
  contentTypeById,
  contentTypes,
  type ContentTypeId,
} from "@/lib/content-types";
import { readExampleProjectAsset } from "@/lib/example-project-asset";
import { getProjectTemplate } from "@/lib/project-templates";
import { buildPhaserPreviewHtml } from "@/lib/phaser/preview";
import { localizedPath, type PublicLang } from "@/lib/seo";

type GalleryCopy = {
  heading: string;
  intro: string;
  sourceZip: string;
  createFromTemplate: string;
  downloadTemplate: string;
  downloadingTemplate: string;
  downloadFailed: string;
  downloadCase: string;
  preview: string;
  previewLoading: string;
  fork: string;
  forkLoading: string;
  unsupported: string;
  failed: string;
  templateStatus: string;
  caseStatus: string;
  templateFilename: string;
  caseFilename: string;
  openPreview: string;
  modalTemplateLabel: string;
  modalCaseLabel: string;
  playablePreview: string;
  mediaPreview: string;
  fileCount: string;
  loadingPreview: string;
  noMediaPreview: string;
  gameUnavailable: string;
};

type ShowcaseItem = {
  id: string;
  kind: "template" | "case";
  type: ContentTypeId;
  title: Record<PublicLang, string>;
  description: Record<PublicLang, string>;
  coverUrl: string;
  sourceUrl?: string;
  caseProject?: PublicCaseProject;
};

type PreviewState =
  | { status: "idle" | "loading" }
  | { status: "error"; message: string }
  | { status: "media"; images: PreviewImage[]; fileCount: number }
  | { status: "game"; html: string; fileCount: number; assetUrls?: string[] };

type PreviewImage = {
  src: string;
  label: string;
  revoke?: boolean;
};

const typeIcons: Record<ContentTypeId, typeof BookOpen> = {
  book: BookOpen,
  "picture-book": BookOpen,
  comic: FileImage,
  "visual-novel": MessageCircle,
  "interactive-video": Clapperboard,
  "phaser-game": Gamepad2,
};

const templateTitles: Record<ContentTypeId, Record<PublicLang, string>> = {
  book: { zh: "小红帽 · 图书模板", en: "Little Red Riding Hood · Book Template" },
  "picture-book": {
    zh: "小红帽 · 绘本模板",
    en: "Little Red Riding Hood · Picture Book Template",
  },
  comic: { zh: "小红帽 · 漫画模板", en: "Little Red Riding Hood · Comic Template" },
  "visual-novel": {
    zh: "小红帽 · 视觉小说模板",
    en: "Little Red Riding Hood · Visual Novel Template",
  },
  "interactive-video": {
    zh: "小红帽 · 互动视频模板",
    en: "Little Red Riding Hood · Interactive Video Template",
  },
  "phaser-game": {
    zh: "小红帽 · Phaser 游戏模板",
    en: "Little Red Riding Hood · Phaser Game Template",
  },
};

const templateCovers: Record<ContentTypeId, string> = {
  book: "/project-templates/book/assets/illustrations/illus_forest.png",
  "picture-book": "/project-templates/picture-book/assets/pages/page-001.png",
  comic: "/project-templates/comic/assets/pages/page-001.png",
  "visual-novel": "/project-templates/visual-novel/assets/backgrounds/bg_forest.png",
  "interactive-video": "/project-templates/interactive-video/assets/scenes/scene_forest.png",
  "phaser-game": "/project-templates/phaser-game/assets/images/animal-cat.png",
};

const caseProjects = [
  {
    project: publicBookCaseProject,
    coverUrl: "/home/work-city.png",
  },
  {
    project: publicComicCaseProject,
    coverUrl: "/home/work-manga.png",
  },
  {
    project: publicPhaserGameCaseProject,
    coverUrl: "/project-templates/phaser-game/assets/images/animal-cat.png",
  },
] as const;

function isTextPath(path: string): boolean {
  return /\.(html?|css|js|json|ya?ml|md|txt)$/i.test(path);
}

function isImagePath(path: string): boolean {
  return /\.(png|jpe?g|webp|gif)$/i.test(path);
}

function imageRank(path: string): number {
  if (/final\.(png|jpe?g|webp)$/i.test(path)) return 0;
  if (/page-\d+|page\.(png|jpe?g|webp)$/i.test(path)) return 1;
  if (/illustrations?|scenes?|backgrounds?/i.test(path)) return 2;
  if (/assets\//i.test(path)) return 3;
  return 4;
}

function revokePreviewImages(images: PreviewImage[]) {
  for (const image of images) {
    if (image.revoke) URL.revokeObjectURL(image.src);
  }
}

export function ShowcaseGallery({
  lang,
  copy,
}: {
  lang: PublicLang;
  copy: GalleryCopy;
}) {
  const [activeItem, setActiveItem] = useState<ShowcaseItem | null>(null);

  const templateItems = useMemo<ShowcaseItem[]>(
    () =>
      contentTypes.map((type) => ({
        id: `template-${type.id}`,
        kind: "template",
        type: type.id,
        title: templateTitles[type.id],
        description: type.description,
        coverUrl: templateCovers[type.id],
      })),
    [],
  );
  const caseItems = useMemo<ShowcaseItem[]>(
    () =>
      caseProjects.map(({ project, coverUrl }) => ({
        id: `case-${project.template}-${project.sourceUrl}`,
        kind: "case",
        type: project.template,
        title: project.title,
        description: project.description,
        coverUrl,
        sourceUrl: project.sourceUrl,
        caseProject: project,
      })),
    [],
  );
  const items = useMemo(
    () => [...templateItems, ...caseItems],
    [caseItems, templateItems],
  );

  return (
    <>
      <section
        id="showcase-projects"
        className="bg-white"
        aria-labelledby="showcase-heading"
      >
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <h1
              id="showcase-heading"
              className="text-3xl font-bold tracking-tight text-[#1e1a3a] sm:text-4xl"
            >
              {copy.heading}
            </h1>
            <p className="mt-4 text-base leading-7 text-[#6f6b84]">
              {copy.intro}
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <ShowcaseCard
                key={item.id}
                item={item}
                lang={lang}
                copy={copy}
                onOpen={() => setActiveItem(item)}
              />
            ))}
          </div>
        </div>
      </section>

      <Dialog open={activeItem !== null} onOpenChange={(open) => !open && setActiveItem(null)}>
        {activeItem ? (
          <DialogContent className="max-h-[calc(100svh-2rem)] overflow-hidden border-[#2a2450] bg-[#0b0d25] p-0 text-white shadow-[0_30px_90px_rgba(12,10,34,0.38)] sm:max-w-6xl">
            <ShowcasePreviewDialog item={activeItem} lang={lang} copy={copy} />
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}

function ShowcaseCard({
  item,
  lang,
  copy,
  onOpen,
}: {
  item: ShowcaseItem;
  lang: PublicLang;
  copy: GalleryCopy;
  onOpen: () => void;
}) {
  const Icon = typeIcons[item.type];
  const type = contentTypeById[item.type];
  const title = item.title[lang];

  return (
    <Card className="group h-full overflow-hidden border-[#e9e5fb] bg-white/90 shadow-[0_10px_24px_rgba(92,75,160,0.06)] transition-transform hover:-translate-y-1 hover:border-[#cfc0ff] hover:shadow-[0_16px_34px_rgba(92,75,160,0.13)]">
      <button
        type="button"
        onClick={onOpen}
        className="relative block aspect-[16/10] w-full overflow-hidden bg-[#17152d] text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#8754ff]/45"
        aria-label={`${copy.openPreview}: ${title}`}
      >
        <Image
          src={item.coverUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#08091f]/85 to-transparent p-4">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            {item.type === "phaser-game" ? (
              <Play className="size-3.5" aria-hidden="true" />
            ) : (
              <Eye className="size-3.5" aria-hidden="true" />
            )}
            {copy.openPreview}
          </span>
        </div>
      </button>
      <CardHeader className="p-5 pb-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#7951dd]">
          <Icon className="size-3.5" aria-hidden="true" />
          {item.kind === "template" ? copy.templateStatus : copy.caseStatus}
        </p>
        <CardTitle className="text-lg leading-6 text-[#241f43]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 p-5 pt-0">
        <CardDescription className="min-h-[4.5rem] text-sm leading-6 text-[#6f6b84]">
          {item.kind === "template" ? type.description[lang] : item.description[lang]}
        </CardDescription>
        <p className="inline-flex items-start gap-1.5 text-xs leading-5 text-[#746d8f]">
          <FileArchive className="mt-0.5 size-3.5 shrink-0 text-[#7951dd]" aria-hidden="true" />
          <span>
            {copy.sourceZip} ·{" "}
            {item.kind === "template" ? copy.templateFilename : copy.caseFilename}
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={onOpen}>
            {item.type === "phaser-game" ? (
              <Play data-icon="inline-start" />
            ) : (
              <Eye data-icon="inline-start" />
            )}
            {copy.openPreview}
          </Button>
          {item.kind === "template" ? (
            <ShowcaseTemplateDownload
              type={item.type}
              lang={lang}
              title={title}
              labels={{
                download: copy.downloadTemplate,
                loading: copy.downloadingTemplate,
                failed: copy.downloadFailed,
              }}
            />
          ) : (
            <Button render={<a href={item.sourceUrl} download />} variant="outline">
              <Download data-icon="inline-start" />
              {copy.downloadCase}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ShowcasePreviewDialog({
  item,
  lang,
  copy,
}: {
  item: ShowcaseItem;
  lang: PublicLang;
  copy: GalleryCopy;
}) {
  const [preview, setPreview] = useState<PreviewState>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;
    let urlsToRevoke: string[] = [];

    async function loadPreview() {
      setPreview({ status: "loading" });
      try {
        const nextPreview =
          item.type === "phaser-game"
            ? await buildGamePreview(item, lang)
            : await buildMediaPreview(item, lang);

        if (cancelled) {
          if (nextPreview.status === "media") revokePreviewImages(nextPreview.images);
          if (nextPreview.status === "game") {
            for (const url of nextPreview.assetUrls ?? []) URL.revokeObjectURL(url);
          }
          return;
        }

        if (nextPreview.status === "media") {
          urlsToRevoke = nextPreview.images
            .filter((image) => image.revoke)
            .map((image) => image.src);
        }
        if (nextPreview.status === "game") {
          urlsToRevoke = nextPreview.assetUrls ?? [];
        }
        setPreview(nextPreview);
      } catch (reason) {
        if (!cancelled) {
          setPreview({
            status: "error",
            message: reason instanceof Error ? reason.message : copy.failed,
          });
        }
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
      for (const url of urlsToRevoke) URL.revokeObjectURL(url);
    };
  }, [copy.failed, item, lang]);

  const title = item.title[lang];
  const label = item.kind === "template" ? copy.modalTemplateLabel : copy.modalCaseLabel;

  return (
    <div className="grid max-h-[calc(100svh-2rem)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
      <div className="border-b border-white/10 px-5 py-5 sm:px-6">
        <DialogHeader>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#bd9aff]">
            {item.type === "phaser-game" ? (
              <Gamepad2 className="size-4" aria-hidden="true" />
            ) : (
              <FileArchive className="size-4" aria-hidden="true" />
            )}
            {label}
          </p>
          <DialogTitle className="pr-8 text-2xl font-bold leading-8 text-white">
            {title}
          </DialogTitle>
          <DialogDescription className="max-w-3xl leading-6 text-white/65">
            {item.description[lang]}
          </DialogDescription>
        </DialogHeader>
      </div>

      <div className="min-h-0 overflow-auto">
        <div className="grid min-h-[520px] gap-0 lg:grid-cols-[minmax(280px,0.38fr)_minmax(0,0.62fr)]">
          <aside className="border-b border-white/10 bg-[#101236] p-5 lg:border-b-0 lg:border-r lg:p-6">
            <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-white/10 bg-[#07091f]">
              <Image
                src={item.coverUrl}
                alt={title}
                fill
                sizes="(max-width: 1024px) 100vw, 420px"
                className="object-cover"
              />
            </div>
            <div className="mt-5 flex flex-col gap-3">
              {item.kind === "template" ? (
                <>
                  <ShowcaseTemplateDownload
                    type={item.type}
                    lang={lang}
                    title={title}
                    labels={{
                      download: copy.downloadTemplate,
                      loading: copy.downloadingTemplate,
                      failed: copy.downloadFailed,
                    }}
                  />
                  <Button
                    render={<Link href={localizedPath(lang, `projects/new?template=${item.type}`)} />}
                    variant="outline"
                    className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  >
                    {copy.createFromTemplate}
                    <ArrowRight data-icon="inline-end" />
                  </Button>
                </>
              ) : item.caseProject ? (
                <>
                  <Button
                    render={<a href={item.sourceUrl} download />}
                    variant="outline"
                    className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  >
                    <Download data-icon="inline-start" />
                    {copy.downloadCase}
                  </Button>
                  <PublicCaseProjectPreview
                    sourceUrl={item.caseProject.sourceUrl}
                    title={item.caseProject.title[lang]}
                    template={item.caseProject.template}
                    lang={lang}
                    returnTo={localizedPath(lang, "showcase")}
                    labels={{
                      preview: copy.preview,
                      previewLoading: copy.previewLoading,
                      fork: copy.fork,
                      forkLoading: copy.forkLoading,
                      unsupported: copy.unsupported,
                      failed: copy.failed,
                    }}
                  />
                </>
              ) : null}
            </div>
            <p className="mt-4 text-xs leading-5 text-white/55">
              {copy.sourceZip} ·{" "}
              {item.kind === "template" ? copy.templateFilename : copy.caseFilename}
            </p>
          </aside>
          <section className="min-h-0 bg-[#07091f] p-5 lg:p-6">
            <PreviewBody preview={preview} copy={copy} item={item} />
          </section>
        </div>
      </div>
    </div>
  );
}

function PreviewBody({
  preview,
  copy,
  item,
}: {
  preview: PreviewState;
  copy: GalleryCopy;
  item: ShowcaseItem;
}) {
  if (preview.status === "idle" || preview.status === "loading") {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm text-white/65">
        <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
        {copy.loadingPreview}
      </div>
    );
  }

  if (preview.status === "error") {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 px-5 text-center text-sm text-destructive">
        <AlertCircle className="mr-2 size-4" aria-hidden="true" />
        {item.type === "phaser-game" ? copy.gameUnavailable : preview.message}
      </div>
    );
  }

  if (preview.status === "game") {
    return (
      <div className="flex min-h-[420px] flex-col gap-3">
        <div className="flex items-center justify-between gap-3 text-sm text-white/65">
          <span>{copy.playablePreview}</span>
          <span>{copy.fileCount.replace("{count}", String(preview.fileCount))}</span>
        </div>
        <div className="min-h-[420px] flex-1 overflow-hidden rounded-lg border border-white/10 bg-black">
          <iframe
            srcDoc={preview.html}
            title={copy.playablePreview}
            className="h-[min(62svh,620px)] w-full border-0"
          />
        </div>
      </div>
    );
  }

  if (preview.status !== "media") {
    return null;
  }

  return (
    <div className="flex min-h-[420px] flex-col gap-3">
      <div className="flex items-center justify-between gap-3 text-sm text-white/65">
        <span>{copy.mediaPreview}</span>
        <span>{copy.fileCount.replace("{count}", String(preview.fileCount))}</span>
      </div>
      {preview.images.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {preview.images.map((image) => (
            <figure
              key={`${image.label}-${image.src}`}
              className="overflow-hidden rounded-lg border border-white/10 bg-white/5"
            >
              {/* Blob URLs and static template asset URLs both need plain img here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.src}
                alt={image.label}
                className="aspect-[16/10] w-full object-cover"
              />
              <figcaption className="truncate px-3 py-2 text-xs text-white/55">
                {image.label}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-white/10 bg-white/5 px-5 text-center text-sm text-white/55">
          {copy.noMediaPreview}
        </div>
      )}
    </div>
  );
}

async function buildMediaPreview(item: ShowcaseItem, lang: PublicLang): Promise<PreviewState> {
  if (item.kind === "template") {
    const files = await getProjectTemplate(item.type, lang, item.title[lang]);
    const images = files
      .filter((file) => file.kind === "binary" && file.sourceUrl && isImagePath(file.path))
      .sort((a, b) => imageRank(a.path) - imageRank(b.path) || a.path.localeCompare(b.path))
      .slice(0, 6)
      .map((file) => ({ src: file.sourceUrl!, label: file.path }));
    return { status: "media", images, fileCount: files.length };
  }

  if (!item.sourceUrl) return { status: "media", images: [], fileCount: 0 };

  const response = await fetch(item.sourceUrl);
  if (!response.ok) throw new Error("Case project unavailable.");
  const files = await readExampleProjectAsset(await response.blob());
  const images = files
    .filter((file) => isImagePath(file.path))
    .sort((a, b) => imageRank(a.path) - imageRank(b.path) || a.path.localeCompare(b.path))
    .slice(0, 6)
    .map((file) => ({
      src: URL.createObjectURL(file.blob),
      label: file.path,
      revoke: true,
    }));
  return { status: "media", images, fileCount: files.length };
}

async function buildGamePreview(
  item: ShowcaseItem,
  lang: PublicLang,
): Promise<PreviewState> {
  const textFiles: Record<string, string> = {};
  const assetUrls: Record<string, string> = {};

  if (item.kind === "template") {
    const files = await getProjectTemplate(item.type, lang, item.title[lang]);
    for (const file of files) {
      if (file.kind === "text") {
        textFiles[file.path] = file.content ?? "";
      } else if (file.sourceUrl) {
        const response = await fetch(file.sourceUrl);
        if (!response.ok) throw new Error("Template asset unavailable.");
        assetUrls[file.path] = URL.createObjectURL(await response.blob());
      }
    }
    return {
      status: "game",
      html: buildPhaserPreviewHtml(textFiles, item.title[lang], { assetUrls }),
      fileCount: files.length,
      assetUrls: Object.values(assetUrls),
    };
  }

  if (!item.sourceUrl) throw new Error("Case project unavailable.");
  const response = await fetch(item.sourceUrl);
  if (!response.ok) throw new Error("Case project unavailable.");
  const files = await readExampleProjectAsset(await response.blob());
  for (const file of files) {
    if (isTextPath(file.path)) {
      textFiles[file.path] = await file.blob.text();
    } else if (file.path.startsWith("assets/")) {
      assetUrls[file.path] = URL.createObjectURL(file.blob);
    }
  }
  return {
    status: "game",
    html: buildPhaserPreviewHtml(textFiles, item.title[lang], { assetUrls }),
    fileCount: files.length,
    assetUrls: Object.values(assetUrls),
  };
}
