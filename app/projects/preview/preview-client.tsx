"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, Pause, Play, RotateCcw } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { getProject } from "@/lib/local-projects";
import {
  openProjectDirectory,
  readFile,
  supportsFileSystemAccess,
} from "@/lib/file-system/browser";
import { mediaKindForSource } from "@/lib/markdown/image-paths";
import { collectPreviewSectionMediaReferences } from "@/lib/markdown/preview-media";
import { compile } from "@/lib/vn/compile";
import { savePreviewGame } from "@/lib/vn/preview-store";
import { readVNProjectFromDirectory } from "@/lib/vn/source-reader";
import { readProjectPreview, type ProjectPreviewModel } from "@/lib/project-source";
import { buildPhaserPreviewHtml } from "@/lib/phaser/preview";
import {
  readPhaserProjectAssetUrlsFromDirectory,
  readPhaserProjectFromDirectory,
  revokePhaserProjectAssetUrls,
} from "@/lib/phaser/source-reader";
import {
  readInteractiveVideoPreviewFromDirectory,
  type InteractiveVideoPreviewModel,
} from "@/lib/interactive-video/preview";
import { useLang } from "@/lib/i18n";
import { localizePlatformErrorMessage } from "@/lib/platform-errors";
import { contentTypeById } from "@/lib/content-types";
import { InteractiveVideoPlayer } from "./interactive-video-player";

type Status = "loading" | "ready" | "missing" | "error";

function markdownComponentsForSection(sectionUrls: Record<string, string>): Components {
  return {
    img: ({ node: _node, src, alt, ...props }) => {
      void _node;
      const resolvedSrc =
        typeof src === "string" ? sectionUrls[src] ?? src : src;
      return (
        <>
          {/* Local OPFS previews use blob URLs; Next Image can render those as broken images. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            {...props}
            src={resolvedSrc}
            alt={alt ?? ""}
            className="max-w-full rounded-md border bg-background"
          />
        </>
      );
    },
    a: ({ node: _node, href, children, title }) => {
      void _node;
      const resolvedHref =
        typeof href === "string" ? sectionUrls[href] ?? href : href;
      if (typeof href === "string") {
        const kind = mediaKindForSource(href);
        if (kind === "video") {
          return (
            <video
              src={resolvedHref}
              controls
              title={title}
              className="my-3 max-h-96 w-full rounded-md border bg-black"
            >
              {children}
            </video>
          );
        }
        if (kind === "audio") {
          return <audio src={resolvedHref} controls title={title} className="my-3 w-full" />;
        }
      }
      return (
        <a href={resolvedHref} title={title}>
          {children}
        </a>
      );
    },
  };
}

export default function PreviewClient() {
  const { lang, t } = useLang();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const rawReturnTo = searchParams.get("returnTo");
  const returnTo =
    rawReturnTo && rawReturnTo.startsWith("/") && !rawReturnTo.startsWith("//")
      ? rawReturnTo
      : null;
  const backHref = returnTo ?? (id ? `/projects/editor?id=${id}` : "/projects");
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [projectRoot, setProjectRoot] = useState<FileSystemDirectoryHandle | null>(null);
  const [genericPreview, setGenericPreview] = useState<ProjectPreviewModel | null>(null);
  const [interactiveVideoPreview, setInteractiveVideoPreview] =
    useState<InteractiveVideoPreviewModel | null>(null);
  const [runtimePreviewHtml, setRuntimePreviewHtml] = useState<string | null>(null);
  const [pictureBookPage, setPictureBookPage] = useState(0);
  const [pictureBookPlaying, setPictureBookPlaying] = useState(false);
  const pictureBookAudioRef = useRef<HTMLAudioElement | null>(null);
  const [sectionMediaUrls, setSectionMediaUrls] = useState<Record<string, Record<string, string>>>({});
  const [interactiveAssetUrls, setInteractiveAssetUrls] = useState<Record<string, string>>({});
  const sectionMediaUrlsRef = useRef<Record<string, Record<string, string>>>({});
  const interactiveAssetUrlsRef = useRef<Record<string, string>>({});
  const phaserAssetUrlsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    document.title = t("meta.previewTitle");
  }, [t]);

  function replaceSectionMediaUrls(nextUrls: Record<string, Record<string, string>>) {
    for (const urls of Object.values(sectionMediaUrlsRef.current)) {
      for (const url of Object.values(urls)) URL.revokeObjectURL(url);
    }
    sectionMediaUrlsRef.current = nextUrls;
    queueMicrotask(() => setSectionMediaUrls(nextUrls));
  }

  function replaceInteractiveAssetUrls(nextUrls: Record<string, string>) {
    for (const url of Object.values(interactiveAssetUrlsRef.current)) {
      URL.revokeObjectURL(url);
    }
    interactiveAssetUrlsRef.current = nextUrls;
    queueMicrotask(() => setInteractiveAssetUrls(nextUrls));
  }

  function replacePhaserAssetUrls(nextUrls: Record<string, string>) {
    revokePhaserProjectAssetUrls(phaserAssetUrlsRef.current);
    phaserAssetUrlsRef.current = nextUrls;
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) {
        replacePhaserAssetUrls({});
        setProjectRoot(null);
        setGenericPreview(null);
        setInteractiveVideoPreview(null);
        setRuntimePreviewHtml(null);
        setStatus("missing");
        return;
      }
      try {
        const p = await getProject(id);
        if (!p) {
          if (!cancelled) {
            replacePhaserAssetUrls({});
            setProjectRoot(null);
            setGenericPreview(null);
            setInteractiveVideoPreview(null);
            setRuntimePreviewHtml(null);
          }
          if (!cancelled) setStatus("missing");
          return;
        }
        if (!supportsFileSystemAccess()) {
          throw new Error(t("editor.fileSystemUnsupported"));
        }
        const root = await openProjectDirectory(
          p.template,
          p.id
        );
        if (p.template === "visual-novel") {
          replacePhaserAssetUrls({});
          const vn = await readVNProjectFromDirectory(root);
          const files = await compile(vn);
          await savePreviewGame(files);
          if (!cancelled) {
            setProjectRoot(null);
            setGenericPreview(null);
            setInteractiveVideoPreview(null);
            setRuntimePreviewHtml(null);
          }
        } else if (p.template === "phaser-game") {
          const files = await readPhaserProjectFromDirectory(root);
          const assetUrls = await readPhaserProjectAssetUrlsFromDirectory(root);
          const html = buildPhaserPreviewHtml(files, p.title, { assetUrls });
          if (!cancelled) {
            replacePhaserAssetUrls(assetUrls);
            setProjectRoot(null);
            setGenericPreview(null);
            setInteractiveVideoPreview(null);
            setRuntimePreviewHtml(html);
          } else {
            revokePhaserProjectAssetUrls(assetUrls);
          }
        } else if (p.template === "interactive-video") {
          replacePhaserAssetUrls({});
          const model = await readInteractiveVideoPreviewFromDirectory(root);
          if (!cancelled) {
            setProjectRoot(root);
            setGenericPreview(null);
            setInteractiveVideoPreview(model);
            setRuntimePreviewHtml(null);
          }
        } else {
          replacePhaserAssetUrls({});
          const model = await readProjectPreview(root, p.template);
          if (!cancelled) {
            setProjectRoot(root);
            setGenericPreview(model);
            setPictureBookPage(0);
            setPictureBookPlaying(false);
            setInteractiveVideoPreview(null);
            setRuntimePreviewHtml(null);
          }
        }
        if (!cancelled) setStatus("ready");
      } catch (e) {
        if (!cancelled) {
          replacePhaserAssetUrls({});
          setProjectRoot(null);
          setGenericPreview(null);
          setInteractiveVideoPreview(null);
          setRuntimePreviewHtml(null);
          setStatus("error");
          setError(localizePlatformErrorMessage(e instanceof Error ? e.message : String(e), lang));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, lang, t]);

  useEffect(() => {
    const audio = pictureBookAudioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPictureBookPlaying(false);
  }, [pictureBookPage, genericPreview?.type]);

  useEffect(() => {
    if (!projectRoot || !genericPreview) {
      replaceSectionMediaUrls({});
      return;
    }

    const references = collectPreviewSectionMediaReferences(genericPreview.sections);
    const pageImageReferences = genericPreview.sections.flatMap((section) =>
      section.pageImagePath
        ? [
            {
              sectionPath: section.path,
              source: section.pageImagePath,
              mediaPath: section.pageImagePath,
              kind: "image" as const,
            },
          ]
        : []
    );
    const allReferences = [...references, ...pageImageReferences];
    if (allReferences.length === 0) {
      replaceSectionMediaUrls({});
      return;
    }

    let cancelled = false;
    void (async () => {
      const nextUrls: Record<string, Record<string, string>> = {};
      const createdUrls: string[] = [];
      for (const reference of allReferences) {
        try {
          const file = await readFile(projectRoot, reference.mediaPath);
          const url = URL.createObjectURL(file);
          createdUrls.push(url);
          (nextUrls[reference.sectionPath] ??= {})[reference.source] = url;
        } catch {
          /* Keep missing media as their original markdown paths. */
        }
      }
      if (cancelled) {
        for (const url of createdUrls) URL.revokeObjectURL(url);
        return;
      }
      replaceSectionMediaUrls(nextUrls);
    })();

    return () => {
      cancelled = true;
    };
  }, [genericPreview, projectRoot]);

  useEffect(() => {
    if (!projectRoot || !interactiveVideoPreview) {
      replaceInteractiveAssetUrls({});
      return;
    }

    let cancelled = false;
    void (async () => {
      const nextUrls: Record<string, string> = {};
      const createdUrls: string[] = [];
      for (const asset of Object.values(interactiveVideoPreview.assets)) {
        try {
          const file = await readFile(projectRoot, asset.path);
          const url = URL.createObjectURL(file);
          createdUrls.push(url);
          nextUrls[asset.id] = url;
        } catch {
          /* Missing assets remain visible as missing-state UI in the player. */
        }
      }
      if (cancelled) {
        for (const url of createdUrls) URL.revokeObjectURL(url);
        return;
      }
      replaceInteractiveAssetUrls(nextUrls);
    })();

    return () => {
      cancelled = true;
    };
  }, [interactiveVideoPreview, projectRoot]);

  useEffect(() => {
    return () => {
      for (const urls of Object.values(sectionMediaUrlsRef.current)) {
        for (const url of Object.values(urls)) URL.revokeObjectURL(url);
      }
      for (const url of Object.values(interactiveAssetUrlsRef.current)) {
        URL.revokeObjectURL(url);
      }
      revokePhaserProjectAssetUrls(phaserAssetUrlsRef.current);
    };
  }, []);

  return (
    <main
      className={
        genericPreview?.type === "comic" || genericPreview?.type === "picture-book"
          ? "flex h-svh flex-col overflow-hidden bg-neutral-950 text-white"
          : interactiveVideoPreview
            ? "flex h-svh flex-col overflow-hidden bg-neutral-950 text-white"
          : "flex h-svh flex-col overflow-hidden"
      }
    >
      <div
        className={
          genericPreview?.type === "comic" || genericPreview?.type === "picture-book"
            ? "flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3"
            : interactiveVideoPreview
              ? "flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3"
            : "flex shrink-0 items-center justify-between border-b px-4 py-3"
        }
      >
        <div className="flex items-center gap-2">
          <Button
            render={<Link href={backHref} />}
            variant="ghost"
            size="icon"
            aria-label={t("editor.back")}
            className={
              genericPreview?.type === "comic" || genericPreview?.type === "picture-book"
                ? "text-white hover:bg-white/10 hover:text-white"
                : interactiveVideoPreview
                  ? "text-white hover:bg-white/10 hover:text-white"
                  : undefined
            }
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-lg font-bold tracking-tight">{t("editor.preview")}</h1>
        </div>
      </div>

      <div
        className={
            genericPreview?.type === "comic" || genericPreview?.type === "picture-book"
            ? "min-h-0 flex-1 overflow-auto bg-neutral-950"
            : interactiveVideoPreview
              ? "min-h-0 flex-1 overflow-hidden bg-neutral-950"
            : genericPreview
              ? "min-h-0 flex-1 overflow-auto bg-background"
              : "relative min-h-0 flex-1 bg-black"
        }
      >
        {status !== "ready" && (
          <div className="absolute inset-0 flex items-center justify-center">
            {status === "loading" && (
              <p className="text-sm text-muted-foreground">
                <Loader2 className="mr-2 inline size-4 animate-spin" />
                {t("vn.previewLoading")}
              </p>
            )}
            {status === "missing" && (
              <p className="text-sm text-muted-foreground">{t("editor.notFound")}</p>
            )}
            {status === "error" && (
              <p className="px-4 text-center text-sm text-destructive">{error}</p>
            )}
          </div>
        )}
        {status === "ready" && genericPreview?.type === "comic" && (
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-10 px-4 py-8 sm:px-6">
            {genericPreview.sections.map((section, index) => {
              const sectionUrls = sectionMediaUrls[section.path] ?? {};
              const pageImageUrl = section.pageImagePath
                ? sectionUrls[section.pageImagePath]
                : undefined;
              return (
                <figure
                  key={section.path}
                  className="w-full max-w-3xl space-y-3"
                >
                  {pageImageUrl ? (
                    // Local OPFS previews use blob URLs; Next Image can render those as broken images.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pageImageUrl}
                      alt={`Page ${index + 1}`}
                      className="block h-auto w-full rounded-sm bg-white shadow-2xl"
                    />
                  ) : (
                    <div
                      aria-label={`Page ${index + 1}`}
                      className="aspect-[3/4] w-full rounded-sm bg-neutral-900 shadow-2xl"
                    />
                  )}
                  <figcaption className="text-center text-xs font-medium tracking-[0.2em] text-white/60">
                    {index + 1} / {genericPreview.sections.length}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        )}
        {status === "ready" && genericPreview?.type === "picture-book" && (
          <PictureBookReader
            model={genericPreview}
            pageIndex={pictureBookPage}
            onPageChange={setPictureBookPage}
            mediaUrls={sectionMediaUrls}
            audioRef={pictureBookAudioRef}
            playing={pictureBookPlaying}
            onPlayingChange={setPictureBookPlaying}
          />
        )}
        {status === "ready" && interactiveVideoPreview && (
          <InteractiveVideoPlayer
            key={`${id ?? ""}-${interactiveVideoPreview.startSegmentId}-${interactiveVideoPreview.segments.length}`}
            model={interactiveVideoPreview}
            assetUrls={interactiveAssetUrls}
            lang={lang}
          />
        )}
        {status === "ready" && genericPreview && genericPreview.type !== "comic" && genericPreview.type !== "picture-book" && (
          <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
            <p className="mb-2 text-sm text-muted-foreground">
              {contentTypeById[genericPreview.type].label[lang]}
            </p>
            <h1 className="mb-8 text-3xl font-bold tracking-tight">
              {genericPreview.title}
            </h1>
            <div className="space-y-8">
              {genericPreview.sections.map((section) => {
                const sectionUrls = sectionMediaUrls[section.path] ?? {};
                return (
                  <section key={section.path} className="border-t pt-6">
                    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                      <h2 className="text-xl font-semibold">{section.title}</h2>
                      <span className="text-xs text-muted-foreground">{section.path}</span>
                    </div>
                    <div className="prose prose-sm max-w-none text-foreground dark:prose-invert [&_a]:text-primary [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponentsForSection(sectionUrls)}
                      >
                        {section.body}
                      </ReactMarkdown>
                    </div>
                  </section>
                );
              })}
              {genericPreview.sections.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("editor.empty")}</p>
              )}
            </div>
          </article>
        )}
        {status === "ready" && runtimePreviewHtml && (
          <iframe
            srcDoc={runtimePreviewHtml}
            title="Game preview"
            className="h-full w-full border-0"
          />
        )}
        {status === "ready" && !genericPreview && !interactiveVideoPreview && !runtimePreviewHtml && (
          <iframe
            src="/webgal/index.html"
            title="OpenWebGal preview"
            className="h-full w-full border-0"
          />
        )}
      </div>
    </main>
  );
}

function PictureBookReader({
  model,
  pageIndex,
  onPageChange,
  mediaUrls,
  audioRef,
  playing,
  onPlayingChange,
}: {
  model: ProjectPreviewModel;
  pageIndex: number;
  onPageChange: (index: number) => void;
  mediaUrls: Record<string, Record<string, string>>;
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  playing: boolean;
  onPlayingChange: (playing: boolean) => void;
}) {
  const section = model.sections[pageIndex];
  if (!section) return <div className="flex h-full items-center justify-center text-white/60">No pages yet.</div>;
  const urls = mediaUrls[section.path] ?? {};
  const imageUrl = section.pageImagePath ? urls[section.pageImagePath] : undefined;
  const voiceUrl = section.pageVoicePath ? urls[section.pageVoicePath] : undefined;
  const playVoice = async () => {
    const audio = audioRef.current;
    if (!audio || !voiceUrl) return;
    if (playing) {
      audio.pause();
      onPlayingChange(false);
      return;
    }
    try {
      await audio.play();
      onPlayingChange(true);
    } catch {
      onPlayingChange(false);
    }
  };
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-5 bg-[#151311] px-4 py-6 text-white sm:px-8">
      <div className="flex w-full max-w-6xl items-center justify-between text-sm text-white/65">
        <span>{model.title}</span>
        <span>{pageIndex + 1} / {model.sections.length}</span>
      </div>
      <article className="w-full max-w-6xl overflow-hidden border border-white/10 bg-[#fbf6e9] text-[#2d241d] shadow-2xl md:grid md:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.8fr)]">
        <div className="flex aspect-[16/9] items-center justify-center bg-white">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={section.title} className="h-full w-full object-cover" />
          ) : <div className="text-sm text-muted-foreground">Illustration unavailable</div>}
        </div>
        <div className="flex min-h-56 flex-col justify-between gap-5 p-6 sm:p-8">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.22em] text-[#876b52]">{section.title}</p>
            <div className="prose prose-sm max-w-none text-[#2d241d]">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.body.replace(/^---[\s\S]*?---\s*/m, "")}</ReactMarkdown>
            </div>
          </div>
          {voiceUrl && (
            <div className="flex items-center gap-2">
              <audio ref={audioRef} src={voiceUrl} onEnded={() => onPlayingChange(false)} />
              <Button size="sm" onClick={playVoice} variant="outline" className="border-[#cbb99b] text-[#2d241d]">
                {playing ? <Pause className="mr-2 size-4" /> : <Play className="mr-2 size-4" />}
                {playing ? "Pause narration" : "Play narration"}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => { if (audioRef.current) { audioRef.current.currentTime = 0; void audioRef.current.play(); onPlayingChange(true); } }} aria-label="Replay narration">
                <RotateCcw className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </article>
      <div className="flex items-center gap-3">
        <Button size="icon" variant="outline" disabled={pageIndex === 0} onClick={() => onPageChange(pageIndex - 1)} aria-label="Previous page"><ChevronLeft className="size-5" /></Button>
        <div className="flex gap-1.5" aria-label="Page navigation">
          {model.sections.map((item, index) => <button key={item.path} type="button" aria-label={`Go to page ${index + 1}`} aria-current={index === pageIndex ? "page" : undefined} onClick={() => onPageChange(index)} className={`size-2.5 rounded-full ${index === pageIndex ? "bg-white" : "bg-white/30"}`} />)}
        </div>
        <Button size="icon" variant="outline" disabled={pageIndex === model.sections.length - 1} onClick={() => onPageChange(pageIndex + 1)} aria-label="Next page"><ChevronRight className="size-5" /></Button>
      </div>
    </div>
  );
}
