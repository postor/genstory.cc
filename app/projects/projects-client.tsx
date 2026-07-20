"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FileDown, Pencil, Plus, Trash2, Upload } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InteractionModal } from "@/components/ui/interaction-modal";
import { useLang } from "@/lib/i18n";
import { localizePlatformErrorMessage } from "@/lib/platform-errors";
import { languageInfo } from "@/lib/platform-i18n";
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
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [projectPendingDelete, setProjectPendingDelete] = useState<Project | null>(null);

  useEffect(() => {
    document.title = t("meta.projectsTitle");
  }, [t]);

  async function refresh() {
    try {
      setProjects(await listProjects());
    } catch (e) {
      setError(localizePlatformErrorMessage(e instanceof Error ? e.message : String(e), lang));
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
        if (!cancelled) {
          setError(localizePlatformErrorMessage(e instanceof Error ? e.message : String(e), lang));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  async function confirmDeleteProject() {
    if (!projectPendingDelete) return;
    const project = projectPendingDelete;
    setProjectPendingDelete(null);
    try {
      await removeProjectDirectory(project.template, project.id);
      await deleteProject(project.id);
      await refresh();
    } catch (e) {
      setError(localizePlatformErrorMessage(e instanceof Error ? e.message : String(e), lang));
    }
  }

  async function handleDownloadSource(project: Project) {
    try {
      const root = await openProjectDirectory(project.template, project.id);
      await exportProjectDirectoryZip(root, `${project.title || "project"}-source`);
    } catch (e) {
      setError(localizePlatformErrorMessage(e instanceof Error ? e.message : String(e), lang));
    }
  }

  function startTitleEditing(project: Project) {
    setEditingProjectId(project.id);
    setTitleDraft(project.title);
  }

  function cancelTitleEditing() {
    setEditingProjectId(null);
    setTitleDraft("");
  }

  async function commitTitleChange(project: Project) {
    const nextTitle = titleDraft.trim() || project.title;
    setEditingProjectId(null);
    setTitleDraft("");
    if (nextTitle === project.title) return;

    const now = Math.max(project.updatedAt + 1, project.createdAt);
    try {
      await saveProject({ ...project, title: nextTitle, updatedAt: now });
      setProjects((previous) =>
        previous.map((item) =>
          item.id === project.id
            ? { ...item, title: nextTitle, updatedAt: now }
            : item
        )
      );
    } catch (e) {
      setError(localizePlatformErrorMessage(e instanceof Error ? e.message : String(e), lang));
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
      setError(localizePlatformErrorMessage(e instanceof Error ? e.message : String(e), lang));
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{t("projects.title")}</h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            {t("projects.storageNote")}
          </p>
        </div>
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
                <CardTitle className="min-w-0">
                  {editingProjectId === project.id ? (
                    <Input
                      autoFocus
                      value={titleDraft}
                      onChange={(event) => setTitleDraft(event.target.value)}
                      onFocus={(event) => event.currentTarget.select()}
                      onBlur={() => void commitTitleChange(project)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void commitTitleChange(project);
                        } else if (event.key === "Escape") {
                          event.preventDefault();
                          cancelTitleEditing();
                        }
                      }}
                      aria-label={t("editor.name")}
                      className="h-8 text-base font-semibold"
                    />
                  ) : (
                    <div className="flex min-w-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startTitleEditing(project)}
                        className="min-w-0 truncate text-left hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        {project.title}
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => startTitleEditing(project)}
                        aria-label={t("projects.editTitle")}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {t("projects.updatedAt")}{" "}
                  {new Date(project.updatedAt).toLocaleString(
                    languageInfo[lang].dateLocale
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
                  onClick={() => setProjectPendingDelete(project)}
                >
                  <Trash2 className="size-4" />
                  {t("projects.delete")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <InteractionModal
        open={projectPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setProjectPendingDelete(null);
        }}
        title={t("projects.deleteTitle")}
        description={
          projectPendingDelete
            ? t("projects.deleteDescription", { title: projectPendingDelete.title })
            : ""
        }
        confirmLabel={t("projects.deleteConfirm")}
        confirmVariant="destructive"
        cancelLabel={t("common.cancel")}
        onConfirm={() => void confirmDeleteProject()}
      />
    </main>
  );
}
