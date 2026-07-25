"use client";

import { useState } from "react";
import { AlertCircle, Eye, GitFork, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { saveProject } from "@/lib/local-projects";
import {
  restoreProjectDirectory,
  supportsFileSystemAccess,
} from "@/lib/file-system/browser";
import { parseProjectSourceZip } from "@/lib/project-import";
import type { ContentTypeId } from "@/lib/content-types";

export function PublicCaseProjectPreview({
  sourceUrl,
  title,
  template,
  lang,
  returnTo,
  labels,
}: {
  sourceUrl: string;
  title: string;
  template: ContentTypeId;
  lang: "zh" | "en";
  returnTo: string;
  labels: {
    preview: string;
    previewLoading: string;
    fork: string;
    forkLoading: string;
    unsupported: string;
    failed: string;
  };
}) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<"preview" | "fork" | null>(
    null
  );
  const [error, setError] = useState("");

  async function importCaseProject() {
    if (!supportsFileSystemAccess()) {
      throw new Error(labels.unsupported);
    }
    const response = await fetch(sourceUrl);
    if (!response.ok) throw new Error(labels.failed);
    const imported = await parseProjectSourceZip(await response.blob());
    const id = crypto.randomUUID();
    const now = Date.now();
    await restoreProjectDirectory(imported.template, id, imported.files);
    await saveProject({
      id,
      template: imported.template || template,
      title: imported.title || title,
      lang,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  }

  async function handlePreview() {
    setLoadingAction("preview");
    setError("");
    try {
      const id = await importCaseProject();
      router.push(
        `/projects/preview?id=${encodeURIComponent(id)}&returnTo=${encodeURIComponent(returnTo)}`
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : labels.failed);
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleFork() {
    setLoadingAction("fork");
    setError("");
    try {
      const id = await importCaseProject();
      router.push(`/projects/editor?id=${encodeURIComponent(id)}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : labels.failed);
    } finally {
      setLoadingAction(null);
    }
  }

  const isPreviewLoading = loadingAction === "preview";
  const isForkLoading = loadingAction === "fork";
  const disabled = loadingAction !== null;

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void handlePreview()} disabled={disabled}>
          {isPreviewLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Eye className="size-4" />
          )}
          {isPreviewLoading ? labels.previewLoading : labels.preview}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleFork()}
          disabled={disabled}
        >
          {isForkLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <GitFork className="size-4" />
        )}
          {isForkLoading ? labels.forkLoading : labels.fork}
        </Button>
      </div>
      {error ? (
        <p className="flex items-start gap-1.5 text-xs text-destructive" role="alert">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
