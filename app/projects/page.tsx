"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FileDown, Plus, Trash2, Upload } from "lucide-react";

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
  saveProject,
  listProjects,
  type Project,
} from "@/lib/local-projects";
import {
  openProjectDirectory,
  removeProjectDirectory,
  restoreProjectDirectory,
  supportsFileSystemAccess,
} from "@/lib/file-system/browser";
import { exportProjectDirectoryZip } from "@/lib/project-export";
import { parseProjectSourceZip } from "@/lib/project-import";

export default function ProjectsPage() {
  const { lang, t } = useLang();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    await removeProjectDirectory(project.template, project.id);
    await deleteProject(project.id);
    void refresh();
  }

  async function handleDownloadSource(project: Project) {
    try {
      const root = await openProjectDirectory(project.template, project.id);
      await exportProjectDirectoryZip(root, `${project.title || "project"}-source`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleImportSource(file: File | undefined) {
    if (!file) return;
    setImporting(true);
    setError(null);
    try {
      if (!supportsFileSystemAccess()) {
        throw new Error(t("create.browserUnsupported"));
      }
      const imported = await parseProjectSourceZip(file);
      const id = crypto.randomUUID();
      const now = Date.now();
      await restoreProjectDirectory(imported.template, id, imported.files);
      await saveProject({
        id,
        template: imported.template,
        title: imported.title,
        lang,
        createdAt: now,
        updatedAt: now,
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{t("projects.title")}</h1>
        <div className="flex gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".zip,application/zip"
            className="sr-only"
            onChange={(event) => void handleImportSource(event.currentTarget.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
          >
            <Upload className="size-4" />
            {importing ? t("projects.importing") : t("projects.import")}
          </Button>
          <Button render={<Link href="/projects/new" />}>
            <Plus className="size-4" />
            {t("projects.new")}
          </Button>
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
                <Button
                  render={<Link href={`/projects/editor?id=${project.id}`} />}
                  size="sm"
                >
                  {t("projects.open")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void handleDownloadSource(project)}
                >
                  <FileDown className="size-4" />
                  {t("editor.downloadSource")}
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
