"use client";

import { useState } from "react";
import { AlertCircle, Eye, GitFork, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { saveProject } from "@/lib/local-projects";
import {
  restoreProjectDirectory,
  supportsFileSystemAccess,
} from "@/lib/file-system/browser";
import { readExampleProjectAsset } from "@/lib/example-project-asset";
import type { ContentTypeId } from "@/lib/content-types";
import { useLang } from "@/lib/i18n";
import {
  hasAcceptedLegalTerms,
  recordLegalTermsAcceptance,
} from "@/lib/legal-consent";
import { LegalConsentCheckbox } from "@/components/legal-consent-checkbox";

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
  const { lang: currentLang } = useLang();
  const [loadingAction, setLoadingAction] = useState<"preview" | "fork" | null>(
    null
  );
  const [error, setError] = useState("");
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "preview" | "fork" | null
  >(null);

  async function importCaseProject() {
    if (!supportsFileSystemAccess()) {
      throw new Error(labels.unsupported);
    }
    const response = await fetch(sourceUrl);
    if (!response.ok) throw new Error(labels.failed);
    let files: Awaited<ReturnType<typeof readExampleProjectAsset>>;
    try {
      files = await readExampleProjectAsset(await response.blob());
    } catch {
      throw new Error(labels.failed);
    }
    const id = crypto.randomUUID();
    const now = Date.now();
    await restoreProjectDirectory(template, id, files);
    await saveProject({
      id,
      template,
      title,
      lang,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  }

  async function handlePreview() {
    if (!hasAcceptedLegalTerms()) {
      setPendingAction("preview");
      setConsentOpen(true);
      return;
    }
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
    if (!hasAcceptedLegalTerms()) {
      setPendingAction("fork");
      setConsentOpen(true);
      return;
    }
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
    <>
      <div className="flex flex-col items-start gap-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => void handlePreview()}
            disabled={disabled}
          >
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
          <p
            className="flex items-start gap-1.5 text-xs text-destructive"
            role="alert"
          >
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : null}
      </div>
      <Dialog
        open={consentOpen}
        onOpenChange={(open) => {
          if (!open) {
            setConsentOpen(false);
            setPendingAction(null);
            setConsentChecked(false);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="border-[#e8e0ff] bg-white/95 p-0 text-[#121331] shadow-[0_24px_70px_rgba(61,45,120,0.2)] sm:max-w-md"
        >
          <div className="space-y-5 p-5 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-[#252047]">
                {currentLang === "zh" ? "开始查看案例作品" : "Open this case work"}
              </DialogTitle>
              <DialogDescription className="leading-6 text-[#7a7897]">
                {currentLang === "zh"
                  ? "案例预览会先把一份本地副本写入当前浏览器。继续前，请确认你已阅读相关说明。"
                  : "A local copy is written to this browser before the case opens. Confirm the notices before continuing."}
              </DialogDescription>
            </DialogHeader>
            <LegalConsentCheckbox
              lang={currentLang}
              checked={consentChecked}
              onChange={setConsentChecked}
            />
          </div>
          <DialogFooter className="border-[#eeeafd] bg-[#fbfaff] sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConsentOpen(false);
                setPendingAction(null);
                setConsentChecked(false);
              }}
              className="border-[#d8cdf9] bg-white text-[#6844c7] hover:border-[#bba7f4] hover:bg-white hover:text-[#4c27ba]"
            >
              {currentLang === "zh" ? "取消" : "Cancel"}
            </Button>
            <Button
              type="button"
              disabled={!consentChecked}
              onClick={() => {
                recordLegalTermsAcceptance();
                const action = pendingAction;
                setConsentOpen(false);
                setPendingAction(null);
                if (action === "preview") void handlePreview();
                if (action === "fork") void handleFork();
              }}
              className="border-0 bg-[#8754ff] text-white shadow-[0_12px_30px_rgba(95,44,255,0.24)] hover:bg-[#7642ef]"
            >
              {currentLang === "zh" ? "继续" : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
