"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileDown, Loader2, RefreshCw, Save } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contentTypeById } from "@/lib/content-types";
import { loadTemplate } from "@/lib/templates";
import {
  downloadProject,
  getProject,
  saveProject,
  type Project,
} from "@/lib/local-projects";
import { useLang } from "@/lib/i18n";

function MarkdownPreview({
  content,
  emptyText,
}: {
  content: string;
  emptyText: string;
}) {
  if (!content.trim()) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }
  return (
    <div className="space-y-3 text-sm leading-6 [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:font-semibold [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

export default function EditorClient() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(id ? true : false);
  const [notFound, setNotFound] = useState(id ? false : true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      const p = await getProject(id);
      if (cancelled) return;
      if (!p) setNotFound(true);
      else setProject(p);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function update(patch: Partial<Project>) {
    setProject((prev) => (prev ? { ...prev, ...patch } : prev));
    setSaved(false);
  }

  async function handleSave() {
    if (!project) return;
    setSaving(true);
    try {
      const next: Project = { ...project, updatedAt: Date.now() };
      await saveProject(next);
      setProject(next);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleLoadTemplate() {
    if (!project) return;
    try {
      const content = await loadTemplate(project.lang, project.template);
      update({ content });
    } catch (e) {
      window.alert(e instanceof Error ? e.message : String(e));
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <p className="text-sm text-muted-foreground">…</p>
      </main>
    );
  }

  if (notFound || !project) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <p className="mb-4 text-sm text-muted-foreground">{t("editor.notFound")}</p>
        <Button render={<Link href="/projects" />} variant="outline">
          <ArrowLeft className="size-4" />
          {t("editor.back")}
        </Button>
      </main>
    );
  }

  const templateInfo = contentTypeById[project.template];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            render={<Link href="/projects" />}
            variant="ghost"
            size="icon"
            aria-label={t("editor.back")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {t("editor.title")}
            </h1>
            {templateInfo && (
              <p className="text-xs text-muted-foreground">
                {t("editor.template")}: {templateInfo.label[project.lang]}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void handleLoadTemplate()}>
            <RefreshCw className="size-4" />
            {t("editor.loadTemplate")}
          </Button>
          <Button variant="outline" onClick={() => downloadProject(project)}>
            <FileDown className="size-4" />
            {t("editor.export")}
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {t("editor.save")}
            {saved && !saving ? ` · ${t("editor.saved")}` : ""}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="editor-title">{t("editor.name")}</Label>
          <Input
            id="editor-title"
            value={project.title}
            onChange={(e) => update({ title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("editor.content")}</Label>
          <div className="grid gap-4 lg:grid-cols-2">
            <Textarea
              value={project.content}
              onChange={(e) => update({ content: e.target.value })}
              className="min-h-[60vh] font-mono text-sm"
              placeholder="# "
            />
            <div className="min-h-[60vh] overflow-auto rounded-lg border bg-muted/30 p-4">
              <MarkdownPreview content={project.content} emptyText={t("editor.empty")} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
