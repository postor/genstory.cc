"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Grid2X2, ListFilter, MoreHorizontal, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { contentTypes, type ContentTypeId } from "@/lib/content-types";
import { useLang } from "@/lib/i18n";
import { listProjects, type Project } from "@/lib/local-projects";

const sampleWorks: Array<{
  title: Record<"zh" | "en", string>;
  template: ContentTypeId;
  image: string;
  updated: Record<"zh" | "en", string>;
}> = [
  {
    title: { zh: "星之旅人", en: "Starfarer" },
    template: "visual-novel",
    image: "/home/work-star.png",
    updated: { zh: "2 小时前", en: "2 hours ago" },
  },
  {
    title: { zh: "代号：深渊", en: "Project: Abyss" },
    template: "comic",
    image: "/home/work-manga.png",
    updated: { zh: "昨天", en: "Yesterday" },
  },
  {
    title: { zh: "永夜之城", en: "City of Night" },
    template: "book",
    image: "/home/work-castle.png",
    updated: { zh: "3 天前", en: "3 days ago" },
  },
  {
    title: { zh: "时之回响", en: "Echoes of Time" },
    template: "interactive-video",
    image: "/home/work-video.png",
    updated: { zh: "1 周前", en: "1 week ago" },
  },
  {
    title: { zh: "龙与少女的契约", en: "The Dragon's Pact" },
    template: "book",
    image: "/home/work-dragon.png",
    updated: { zh: "1 周前", en: "1 week ago" },
  },
  {
    title: { zh: "机械迷城", en: "Clockwork City" },
    template: "comic",
    image: "/home/work-city.png",
    updated: { zh: "2 周前", en: "2 weeks ago" },
  },
];

const sampleImages = [
  "/home/work-star.png",
  "/home/work-manga.png",
  "/home/work-castle.png",
  "/home/work-video.png",
  "/home/work-dragon.png",
  "/home/work-city.png",
];

type DisplayWork = {
  id?: string;
  title: string;
  template: ContentTypeId;
  image: string;
  updated: string;
  href: string;
};

export function LocalProjectSummary() {
  const { lang, t } = useLang();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeFilter, setActiveFilter] = useState<ContentTypeId | "all">("all");

  useEffect(() => {
    void listProjects().then(setProjects).catch(() => setProjects([]));
  }, []);

  const isShowingSamples = projects.length === 0;
  const works = useMemo<DisplayWork[]>(
    () =>
      isShowingSamples
        ? sampleWorks.map((work) => ({
            title: work.title[lang],
            template: work.template,
            image: work.image,
            updated: work.updated[lang],
            href: `/projects/new?template=${work.template}`,
          }))
        : projects.map((project, index) => ({
            id: project.id,
            title: project.title,
            template: project.template,
            image: sampleImages[index % sampleImages.length],
            updated: new Date(project.updatedAt).toLocaleDateString(
              lang === "zh" ? "zh-CN" : "en-US",
            ),
            href: `/projects/editor?id=${project.id}`,
          })),
    [isShowingSamples, lang, projects],
  );
  const filteredWorks = useMemo(
    () =>
      activeFilter === "all"
        ? works
        : works.filter((work) => work.template === activeFilter),
    [activeFilter, works],
  );

  return (
    <section aria-label={t("nav.projects")}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
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
            {isShowingSamples
              ? lang === "zh"
                ? "先看看创作空间的样子，创建后你的本地作品会出现在这里。"
                : "Preview the workspace; your local works will appear here after you create one."
              : lang === "zh"
                ? "你的作品默认保存在当前浏览器中。"
                : "Your works stay in this browser by default."}
          </p>
        </div>
        <Button render={<Link href="/projects/new" />} size="sm" className="bg-[#8754ff] text-white hover:bg-[#7642ef]">
          <Plus data-icon="inline-start" />
          {lang === "zh" ? "创建新项目" : "New project"}
        </Button>
      </div>

      <div className="mb-5 flex max-w-full gap-1 overflow-x-auto pb-1">
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
                <div className="relative aspect-[2.2/1] overflow-hidden bg-[#eeeaff]">
                  <Image
                    src={work.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
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
          href="/projects/new"
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
