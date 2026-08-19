"use client";

import { AlertCircle, Download, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { ContentTypeId } from "@/lib/content-types";
import { getProjectTemplate } from "@/lib/project-templates";
import { buildSourceZip } from "@/lib/project-zip";
import type { PublicLang } from "@/lib/seo";

type TemplateDownloadLabels = {
  download: string;
  loading: string;
  failed: string;
};

function safeFilename(value: string): string {
  return value.trim().replace(/[\\/:*?"<>|]+/g, "-") || "genstory-template";
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function ShowcaseTemplateDownload({
  type,
  lang,
  title,
  labels,
}: {
  type: ContentTypeId;
  lang: PublicLang;
  title: string;
  labels: TemplateDownloadLabels;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDownload() {
    setLoading(true);
    setError("");
    try {
      const files = await getProjectTemplate(type, lang, title);
      const zipEntries = await Promise.all(
        files.map(async (file) => {
          if (file.kind === "text") {
            return {
              path: file.path,
              blob: new Blob([file.content ?? ""], {
                type: "text/plain; charset=utf-8",
              }),
            };
          }

          if (!file.sourceUrl) {
            throw new Error(labels.failed);
          }

          const response = await fetch(file.sourceUrl);
          if (!response.ok) {
            throw new Error(labels.failed);
          }

          return {
            path: file.path,
            blob: await response.blob(),
          };
        }),
      );
      const zip = await buildSourceZip(zipEntries);
      triggerDownload(zip, `${safeFilename(title)}-template-source.zip`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : labels.failed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" onClick={() => void handleDownload()} disabled={loading}>
        {loading ? (
          <Loader2 data-icon="inline-start" className="animate-spin" />
        ) : (
          <Download data-icon="inline-start" />
        )}
        {loading ? labels.loading : labels.download}
      </Button>
      {error ? (
        <p className="flex items-start gap-1.5 text-xs text-destructive" role="alert">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
