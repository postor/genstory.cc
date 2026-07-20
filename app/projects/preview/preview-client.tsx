"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
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
import { readPhaserProjectFromDirectory } from "@/lib/phaser/source-reader";
import { useLang } from "@/lib/i18n";
import { contentTypeById } from "@/lib/content-types";

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
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [projectRoot, setProjectRoot] = useState<FileSystemDirectoryHandle | null>(null);
  const [genericPreview, setGenericPreview] = useState<ProjectPreviewModel | null>(null);
  const [runtimePreviewHtml, setRuntimePreviewHtml] = useState<string | null>(null);
  const [sectionMediaUrls, setSectionMediaUrls] = useState<Record<string, Record<string, string>>>({});
  const sectionMediaUrlsRef = useRef<Record<string, Record<string, string>>>({});

  function replaceSectionMediaUrls(nextUrls: Record<string, Record<string, string>>) {
    for (const urls of Object.values(sectionMediaUrlsRef.current)) {
      for (const url of Object.values(urls)) URL.revokeObjectURL(url);
    }
    sectionMediaUrlsRef.current = nextUrls;
    queueMicrotask(() => setSectionMediaUrls(nextUrls));
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) {
        setProjectRoot(null);
        setGenericPreview(null);
        setRuntimePreviewHtml(null);
        setStatus("missing");
        return;
      }
      try {
        const p = await getProject(id);
        if (!p) {
          if (!cancelled) {
            setProjectRoot(null);
            setGenericPreview(null);
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
          const vn = await readVNProjectFromDirectory(root);
          const files = await compile(vn);
          await savePreviewGame(files);
          if (!cancelled) {
            setProjectRoot(null);
            setGenericPreview(null);
            setRuntimePreviewHtml(null);
          }
        } else if (p.template === "phaser-game") {
          const files = await readPhaserProjectFromDirectory(root);
          const html = buildPhaserPreviewHtml(files, p.title);
          if (!cancelled) {
            setProjectRoot(null);
            setGenericPreview(null);
            setRuntimePreviewHtml(html);
          }
        } else {
          const model = await readProjectPreview(root, p.template);
          if (!cancelled) {
            setProjectRoot(root);
            setGenericPreview(model);
            setRuntimePreviewHtml(null);
          }
        }
        if (!cancelled) setStatus("ready");
      } catch (e) {
        if (!cancelled) {
          setProjectRoot(null);
          setGenericPreview(null);
          setRuntimePreviewHtml(null);
          setStatus("error");
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, t]);

  useEffect(() => {
    if (!projectRoot || !genericPreview) {
      replaceSectionMediaUrls({});
      return;
    }

    const references = collectPreviewSectionMediaReferences(genericPreview.sections);
    if (references.length === 0) {
      replaceSectionMediaUrls({});
      return;
    }

    let cancelled = false;
    void (async () => {
      const nextUrls: Record<string, Record<string, string>> = {};
      const createdUrls: string[] = [];
      for (const reference of references) {
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
    return () => {
      for (const urls of Object.values(sectionMediaUrlsRef.current)) {
        for (const url of Object.values(urls)) URL.revokeObjectURL(url);
      }
    };
  }, []);

  return (
    <main className="flex h-svh flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            render={<Link href={`/projects/editor?id=${id}`} />}
            variant="ghost"
            size="icon"
            aria-label={t("editor.back")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-lg font-bold tracking-tight">{t("editor.preview")}</h1>
        </div>
      </div>

      <div className={genericPreview ? "min-h-0 flex-1 overflow-auto bg-background" : "relative min-h-0 flex-1 bg-black"}>
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
        {status === "ready" && genericPreview && (
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
            title="Phaser game preview"
            className="h-full w-full border-0"
          />
        )}
        {status === "ready" && !genericPreview && !runtimePreviewHtml && (
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
