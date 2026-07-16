"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FileDown, FileUp, Plus, Trash2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import {
  deleteProject,
  downloadProject,
  listProjects,
  readProjectFile,
  saveProject,
  type Project,
} from "@/lib/local-projects";

export default function ProjectsPage() {
  const { lang, t } = useLang();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    try {
      setProjects(await listProjects());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listProjects();
        if (!cancelled) setProjects(list);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(project: Project) {
    if (!window.confirm(t("projects.confirmDelete"))) return;
    await deleteProject(project.id);
    void refresh();
  }

  function handleExport(project: Project) {
    downloadProject(project);
  }

  async function handleImportFile(file: File) {
    try {
      const project = await readProjectFile(file);
      await saveProject(project);
      void refresh();
    } catch (e) {
      setError(t("projects.importFailed") + (e instanceof Error ? e.message : String(e)));
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{t("projects.title")}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <FileUp className="size-4" />
            {t("projects.import")}
          </Button>
          <Button render={<Link href="/projects/new" />}>
            <Plus className="size-4" />
            {t("projects.new")}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">…</p>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            {t("projects.empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader className="gap-1">
                <CardTitle className="truncate">{project.title}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {t("projects.updatedAt")}{" "}
                  {new Date(project.updatedAt).toLocaleString(
                    lang === "zh" ? "zh-CN" : "en-US"
                  )}
                </p>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button render={<Link href={`/projects/editor?id=${project.id}`} />} size="sm">
                  {t("projects.open")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport(project)}
                >
                  <FileDown className="size-4" />
                  {t("projects.export")}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(project)}
                >
                  <Trash2 className="size-4" />
                  {t("projects.delete")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
