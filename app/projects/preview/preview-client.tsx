"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getProject } from "@/lib/local-projects";
import { compile } from "@/lib/vn/compile";
import { savePreviewGame } from "@/lib/vn/preview-store";
import { useLang } from "@/lib/i18n";

type Status = "loading" | "ready" | "missing" | "error";

export default function PreviewClient() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) {
        setStatus("missing");
        return;
      }
      try {
        const p = await getProject(id);
        if (!p || !p.vn) {
          if (!cancelled) setStatus("missing");
          return;
        }
        const files = await compile(p.vn);
        await savePreviewGame(files);
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
  }, [id]);

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
          <h1 className="text-lg font-bold tracking-tight">{t("vn.preview")}</h1>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 bg-black">
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
        {status === "ready" && (
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
