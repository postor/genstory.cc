"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { contentTypes, type ContentTypeId } from "@/lib/content-types";
import { loadTemplate } from "@/lib/templates";
import { saveProject, type Project } from "@/lib/local-projects";
import { seedRedRidingHood } from "@/lib/vn/seed";
import { useLang } from "@/lib/i18n";

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
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!template) {
      window.alert(t("create.noTemplate"));
      return;
    }
    setSubmitting(true);
    try {
      const now = Date.now();
      const id = crypto.randomUUID();
      let content = "";
      try {
        content = await loadTemplate(lang, template);
      } catch {
        content = "";
      }
      const project: Project = {
        id,
        template,
        title:
          title.trim() ||
          contentTypes.find((c) => c.id === template)!.label[lang],
        content,
        vn: template === "visual-novel" ? seedRedRidingHood() : undefined,
        lang,
        createdAt: now,
        updatedAt: now,
      };
      await saveProject(project);
      router.push(`/projects/editor?id=${id}`);
    } catch (e) {
      setSubmitting(false);
      window.alert(e instanceof Error ? e.message : String(e));
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
          <div className="grid gap-3 sm:grid-cols-2">
            {contentTypes.map((c) => {
              const selected = template === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={template === c.id}
                  onClick={() => setTemplate(c.id)}
                  className="text-left"
                >
                  <Card
                    className={
                      selected
                        ? "ring-2 ring-primary"
                        : "hover:border-primary/50"
                    }
                  >
                    <CardHeader className="gap-1 p-4">
                      <CardTitle className="text-base">{c.label[lang]}</CardTitle>
                      <CardContent className="p-0 text-sm text-muted-foreground">
                        {c.description[lang]}
                      </CardContent>
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
            placeholder={t("create.namePlaceholder")}
          />
        </div>

        <Button onClick={() => void handleSubmit()} disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {t("create.submit")}
        </Button>
      </div>
    </main>
  );
}
