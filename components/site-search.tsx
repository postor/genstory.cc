"use client";

import { FileText, FolderOpen, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { listProjects, type Project } from "@/lib/local-projects";
import {
  buildSearchDocuments,
  searchSiteContent,
  type SearchResult,
} from "@/lib/site-search";
import type { PublicLang } from "@/lib/seo";
import { cn } from "@/lib/utils";

const searchCopy = {
  zh: {
    placeholder: "搜索项目或内容",
    dialogLabel: "搜索项目和文档",
    documents: "SEO 文档",
    projects: "本地项目",
    empty: "没有匹配的项目或文档",
    hint: "输入标题、类型或关键词",
  },
  en: {
    placeholder: "Search projects or content",
    dialogLabel: "Search projects and documents",
    documents: "SEO docs",
    projects: "Local projects",
    empty: "No matching projects or documents",
    hint: "Search by title, type, or keyword",
  },
} satisfies Record<
  PublicLang,
  {
    placeholder: string;
    dialogLabel: string;
    documents: string;
    projects: string;
    empty: string;
    hint: string;
  }
>;

export function SiteSearch({
  lang,
  homeHeader = false,
  className,
}: {
  lang: PublicLang;
  homeHeader?: boolean;
  className?: string;
}) {
  const copy = searchCopy[lang];
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const documents = useMemo(() => buildSearchDocuments(lang), [lang]);
  const results = useMemo(
    () => searchSiteContent(query, documents, projects, lang),
    [documents, lang, projects, query],
  );
  const documentResults = results.filter((result) => result.kind === "document");
  const projectResults = results.filter((result) => result.kind === "project");

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    void listProjects().then(setProjects).catch(() => setProjects([]));
    return () => window.clearTimeout(timer);
  }, [open]);

  function closeAfterNavigate() {
    setOpen(false);
    setQuery("");
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "min-w-48 justify-between gap-3 border px-3",
          className,
          homeHeader
            ? "border-white/10 bg-white/5 text-white/55 hover:bg-white/10 hover:text-white"
            : "border-border bg-background/60 text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
        aria-label={copy.dialogLabel}
        title={copy.dialogLabel}
        onClick={() => setOpen(true)}
      >
        <span className="inline-flex items-center gap-2">
          <Search className="size-4" />
          <span>{copy.placeholder}</span>
        </span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-lg gap-0 overflow-x-hidden p-0 pt-9"
          aria-label={copy.dialogLabel}
        >
          <DialogTitle className="sr-only">{copy.dialogLabel}</DialogTitle>
          <div className="border-b p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.placeholder}
                aria-label={copy.dialogLabel}
                className="h-9 pl-8"
              />
            </div>
          </div>

          <div className="max-h-[min(28rem,60vh)] overflow-y-auto p-2">
            {!query.trim() ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                {copy.hint}
              </p>
            ) : results.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                {copy.empty}
              </p>
            ) : (
              <div className="grid gap-3">
                {documentResults.length > 0 ? (
                  <SearchResultGroup
                    title={copy.documents}
                    icon={FileText}
                    results={documentResults}
                    query={query}
                    onNavigate={closeAfterNavigate}
                  />
                ) : null}
                {projectResults.length > 0 ? (
                  <SearchResultGroup
                    title={copy.projects}
                    icon={FolderOpen}
                    results={projectResults}
                    query={query}
                    onNavigate={closeAfterNavigate}
                  />
                ) : null}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SearchResultGroup({
  title,
  icon: Icon,
  results,
  query,
  onNavigate,
}: {
  title: string;
  icon: typeof FileText;
  results: SearchResult[];
  query: string;
  onNavigate: () => void;
}) {
  return (
    <section aria-label={title} className="min-w-0">
      <div className="flex items-center gap-2 px-3 pb-1 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" />
        {title}
      </div>
      <div className="grid min-w-0 gap-0.5">
        {results.map((result) => (
          <Link
            key={result.kind === "document" ? result.slug : result.id}
            href={result.href}
            onClick={onNavigate}
            className="flex min-w-0 max-w-full items-start gap-3 overflow-hidden rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
          >
            <span className="grid min-w-0 flex-1 gap-1">
              <span className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 rounded-md border bg-muted px-1.5 py-0.5 text-[10px] leading-4 text-muted-foreground">
                  {result.kindLabel}
                </span>
                <span className="block min-w-0 truncate text-sm font-medium text-foreground">
                  {highlightText(result.title, query)}
                </span>
              </span>
              <span className="block min-w-0 truncate text-xs text-muted-foreground">
                {highlightText(result.content, query)}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function highlightText(text: string, query: string): ReactNode {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return text;

  const escapedQuery = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escapedQuery})`, "ig"));
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <mark
        key={`${part}-${index}`}
        className="rounded-sm bg-primary/20 px-0.5 text-foreground"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}
