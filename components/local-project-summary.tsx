"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Grid2X2, ListFilter, MoreHorizontal, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { contentTypes, type ContentTypeId } from "@/lib/content-types";
import { useLang } from "@/lib/i18n";
import { listProjects, type Project } from "@/lib/local-projects";
import {
  hasProjectCoverUrl,
  projectTypeImages,
  readProjectCoverUrl,
} from "@/lib/project-cover";
import { localizedPath } from "@/lib/seo";
import { ProjectCover } from "@/components/project-cover";

const sampleWorks: Array<{
  template: ContentTypeId;
}> = [
  {
    template: "visual-novel",
  },
  {
    template: "comic",
  },
  {
    template: "book",
  },
  {
    template: "interactive-video",
  },
  {
    template: "book",
  },
  {
    template: "comic",
  },
];

type DisplayWork = {
  id?: string;
  title: string;
  template: ContentTypeId;
  image: string;
  isTypeImage: boolean;
  updated: string;
  href: string;
};

export function LocalProjectSummary() {
  const { lang, t } = useLang();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [projectCoverImages, setProjectCoverImages] = useState<Record<string, string>>({});
  const [activeFilter, setActiveFilter] = useState<ContentTypeId | "all">("all");

  useEffect(() => {
    let cancelled = false;
    let initialLoad = true;

    const loadProjects = () => {
      const isInitialLoad = initialLoad;
      initialLoad = false;

      void listProjects()
        .then((nextProjects) => {
          if (!cancelled) setProjects(nextProjects);
        })
        .catch(() => {
          if (!cancelled && isInitialLoad) setProjects([]);
        })
        .finally(() => {
          if (!cancelled && isInitialLoad) setProjectsLoaded(true);
        });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") loadProjects();
    };

    loadProjects();
    window.addEventListener("pageshow", loadProjects);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", loadProjects);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const hasProjects = projects.length > 0;
  const sampleWorkHrefs = useMemo(
    () => sampleWorks.map((work) => localizedPath(lang, work.template)),
    [lang],
  );

  useEffect(() => {
    let cancelled = false;
    const coverUrls: string[] = [];

    async function loadCoverImages(): Promise<ReadonlyArray<readonly [string, string | undefined]>> {
      if (!hasProjects) return [];

      return Promise.all(
        projects.map(async (project) => {
          const coverUrl = await readProjectCoverUrl(project);
          if (coverUrl) coverUrls.push(coverUrl);
          return [project.id, coverUrl] as const;
        }),
      );
    }

    void loadCoverImages().then((entries) => {
      if (cancelled) {
        coverUrls.forEach((url) => URL.revokeObjectURL(url));
        return;
      }

      setProjectCoverImages(Object.fromEntries(entries.filter(hasProjectCoverUrl)));
    }).catch(() => {
      if (!cancelled) setProjectCoverImages({});
    });

    return () => {
      cancelled = true;
      coverUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [hasProjects, projects]);

  const works = useMemo<DisplayWork[]>(
    () =>
      projects.map((project) => {
        const coverImage = projectCoverImages[project.id];
        return {
          id: project.id,
          title: project.title,
          template: project.template,
          image: coverImage ?? projectTypeImages[project.template],
          isTypeImage: !coverImage,
          updated: new Date(project.updatedAt).toLocaleDateString(
            lang === "zh" ? "zh-CN" : "en-US",
          ),
          href: localizedPath(lang, `projects/editor?id=${project.id}`),
        };
      }),
    [lang, projectCoverImages, projects],
  );
  const filteredWorks = useMemo(
    () =>
      activeFilter === "all"
        ? works
        : works.filter((work) => work.template === activeFilter),
    [activeFilter, works],
  );

  if (!projectsLoaded) {
    return (
      <section
        aria-label={t("nav.projects")}
        className="min-w-0"
        data-template-count={sampleWorkHrefs.length}
      >
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h2 id="my-works-title" className="text-2xl font-bold tracking-tight sm:text-3xl">
                {lang === "zh" ? "我的作品" : "My works"}
              </h2>
              <div className="hidden items-center gap-1 text-[#aaa6bf] sm:flex" aria-hidden="true">
                <Grid2X2 className="size-4" />
                <ListFilter className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#6b6a89]">
              {lang === "zh"
                ? "你的作品默认保存在当前浏览器中。"
                : "Your works stay in this browser by default."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!hasProjects) {
    return (
      <section
        aria-label={t("nav.projects")}
        className="min-w-0"
        data-template-count={sampleWorkHrefs.length}
      >
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h2 id="my-works-title" className="text-2xl font-bold tracking-tight sm:text-3xl">
                {lang === "zh" ? "我的作品" : "My works"}
              </h2>
              <div className="hidden items-center gap-1 text-[#aaa6bf] sm:flex" aria-hidden="true">
                <Grid2X2 className="size-4" />
                <ListFilter className="size-4" />
              </div>
            </div>
          </div>
        </div>

        <Card className="border-[#e9e5fb] bg-white/80 shadow-[0_10px_24px_rgba(92,75,160,0.06)]">
          <div className="p-6 sm:p-8">
            <p className="text-base font-semibold text-[#242044]">
              {t("home.emptyCategoryTitle")}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#6b6a89]">
              {t("home.emptyCategoryBody")}
            </p>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section aria-label={t("nav.projects")} className="min-w-0">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h2 id="my-works-title" className="text-2xl font-bold tracking-tight sm:text-3xl">
              {lang === "zh" ? "我的作品" : "My works"}
            </h2>
            <div className="hidden items-center gap-1 text-[#aaa6bf] sm:flex" aria-hidden="true">
              <Grid2X2 className="size-4" />
              <ListFilter className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#6b6a89]">
            {lang === "zh"
              ? "你的作品默认保存在当前浏览器中。"
              : "Your works stay in this browser by default."}
          </p>
        </div>
        <Button render={<Link href={localizedPath(lang, "projects/new")} />} size="sm" className="bg-[#8754ff] text-white hover:bg-[#7642ef]">
          <Plus data-icon="inline-start" />
          {lang === "zh" ? "创建新项目" : "New project"}
        </Button>
      </div>

      <div className="mb-5 flex w-full min-w-0 max-w-full gap-1 overflow-x-auto pb-1">
        <FilterButton
          active={activeFilter === "all"}
          label={lang === "zh" ? "全部" : "All"}
          onClick={() => setActiveFilter("all")}
        />
        {contentTypes.map((type) => (
          <FilterButton
            key={type.id}
            active={activeFilter === type.id}
            label={type.label[lang]}
            onClick={() => setActiveFilter(type.id)}
          />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {filteredWorks.map((work) => {
          const template = contentTypes.find((type) => type.id === work.template);

          return (
            <Card key={work.id ?? work.title} className="group overflow-hidden border-[#e9e5fb] bg-white/90 shadow-[0_10px_24px_rgba(92,75,160,0.06)] transition-shadow hover:shadow-[0_16px_32px_rgba(92,75,160,0.12)]">
              <Link href={work.href}>
                <ProjectCover
                  image={work.image}
                  isTypeImage={work.isTypeImage}
                  template={work.template}
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
                <div className="flex items-start justify-between gap-3 px-4 pb-4 pt-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-[#242044]">{work.title}</h3>
                    <div className="mt-2 flex items-center gap-2 text-xs text-[#8b88a4]">
                      <span className="rounded-md bg-[#f0ebff] px-2 py-1 text-[#7550dc]">
                        {template?.label[lang] ?? work.template}
                      </span>
                      <span>{work.updated}</span>
                    </div>
                  </div>
                  <MoreHorizontal className="mt-1 size-4 shrink-0 text-[#aaa6bf]" />
                </div>
              </Link>
            </Card>
          );
        })}

        <Link
          href={localizedPath(lang, "projects/new")}
          className="group flex min-h-40 items-center justify-center rounded-xl border border-dashed border-[#cfc3f8] bg-[#f7f3ff] text-[#7850df] transition-colors hover:border-[#9f84f0] hover:bg-[#f0eaff]"
        >
          <span className="flex flex-col items-center gap-2">
            <span className="grid size-10 place-items-center rounded-full bg-white shadow-sm">
              <Plus className="size-5" />
            </span>
            <span className="text-sm font-semibold">
              {lang === "zh" ? "创建新项目" : "Create a new project"}
            </span>
          </span>
        </Link>
      </div>
    </section>
  );
}

function FilterButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-[#a17bf6] text-white shadow-[0_6px_16px_rgba(122,81,220,0.22)]"
          : "text-[#8c89a6] hover:bg-[#f0ebff] hover:text-[#6844c7]"
      }`}
    >
      {label}
    </button>
  );
}
