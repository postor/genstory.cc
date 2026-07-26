"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, FolderOpen, Loader2 } from "lucide-react";

import {
  Card,
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

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("create.title")}</h1>
        <Button render={<Link href="/projects" />} variant="ghost" size="sm">
          {t("create.cancel")}
        </Button>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label>{t("create.template")}</Label>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            {contentTypes.map((c) => {
              const selected = template === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={template === c.id}
                  onClick={() => setTemplate(c.id)}
                  className="group text-left"
                >
                  <Card
                    className={cn(
                      "h-full overflow-hidden transition-all duration-300 ease-out",
                      selected
                        ? "border-primary/50 bg-primary/5 shadow-sm ring-2 ring-primary"
                        : "shadow-none hover:border-primary/50 sm:shadow-sm"
                    )}
                  >
                    <CardHeader
                      className={cn(
                        "gap-0 p-3 transition-[padding] duration-300 ease-out sm:gap-1 sm:p-4",
                        selected && "p-4"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <CardTitle className="text-base leading-5">
                          {c.label[lang]}
                        </CardTitle>
                        <CheckCircle2
                          aria-hidden="true"
                          className={cn(
                            "size-4 shrink-0 transition-all duration-300 ease-out",
                            selected
                              ? "scale-100 text-primary opacity-100"
                              : "scale-75 text-muted-foreground/40 opacity-0 sm:opacity-40"
                          )}
                        />
                      </div>
                      <CardDescription
                        className={cn(
                          "overflow-hidden text-sm leading-5 transition-[max-height,opacity,margin] duration-300 ease-out sm:mt-1 sm:max-h-none sm:opacity-100",
                          selected
                            ? "mt-2 max-h-24 opacity-100"
                            : "mt-0 max-h-0 opacity-0"
                        )}
                      >
                        {c.description[lang]}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="project-name">{t("create.name")}</Label>
          <Input
            id="project-name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={defaultTitle || t("create.namePlaceholder")}
          />
        </div>

        <Button onClick={() => void handleSubmit()} disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {!submitting && <FolderOpen className="size-4" />}
          {t("create.submit")}
        </Button>
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
