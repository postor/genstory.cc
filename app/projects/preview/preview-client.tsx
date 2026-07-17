"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { getProject } from "@/lib/local-projects";
import {
  openProjectDirectory,
  supportsFileSystemAccess,
} from "@/lib/file-system/browser";
import { compile } from "@/lib/vn/compile";
import { savePreviewGame } from "@/lib/vn/preview-store";
import { readVNProjectFromDirectory } from "@/lib/vn/source-reader";
import { readProjectPreview, type ProjectPreviewModel } from "@/lib/project-source";
import { useLang } from "@/lib/i18n";
import { contentTypeById } from "@/lib/content-types";

type Status = "loading" | "ready" | "missing" | "error";

export default function PreviewClient() {
  const { lang, t } = useLang();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [genericPreview, setGenericPreview] = useState<ProjectPreviewModel | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) {
        setStatus("missing");
        return;
      }
      try {
        const p = await getProject(id);
        if (!p) {
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
          if (!cancelled) setGenericPreview(null);
        } else {
          const model = await readProjectPreview(root, p.template);
          if (!cancelled) setGenericPreview(model);
        }
        if (!cancelled) setStatus("ready");
      } catch (e) {
        if (!cancelled) {
          setStatus("error");
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, t]);

  return (
    <main className="flex h-[calc(100svh-3.5rem)] flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
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
              {genericPreview.sections.map((section) => (
                <section key={section.path} className="border-t pt-6">
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-xl font-semibold">{section.title}</h2>
                    <span className="text-xs text-muted-foreground">{section.path}</span>
                  </div>
                  <div className="prose prose-sm max-w-none text-foreground dark:prose-invert [&_a]:text-primary [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {section.body}
                    </ReactMarkdown>
                  </div>
                </section>
              ))}
              {genericPreview.sections.length === 0 && (
                <p className="text-sm text-muted-foreground">{t("editor.empty")}</p>
              )}
            </div>
          </article>
        )}
        {status === "ready" && !genericPreview && (
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
