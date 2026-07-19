import Link from "next/link";
import { ArrowRight, BookOpen, Download, FileText, FolderOpen } from "lucide-react";

import { LocalProjectSummary } from "@/components/local-project-summary";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,

} from "@/components/ui/card";
import { type PublicLang, localizedPath } from "@/lib/seo";

const copy = {
  zh: {
    heroTitle: "GenStory",
    heroSubtitle: "本地优先的故事创作工作台",
    heroBody:
      "在浏览器里创作图书、漫画、视觉小说和互动视频。项目正文与资产保存在本地浏览器，支持源码 ZIP 备份和 OpenWebGal 导出。",
    ctaCreate: "开始创作",
    ctaVn: "了解视觉小说",
    pillarsTitle: "为长期创作设计",
    workflowTitle: "从创作到导出",
    localProjects: "本地项目",
    pillars: [
      {
        title: "本地优先",
        body: "项目文件写入浏览器 OPFS，应用可以作为静态站部署，不需要后端保存你的作品。",
      },
      {
        title: "结构化创作",
        body: "用章节、场景、脚本、舞台状态和资产索引组织故事，减少重复设定和长期维护成本。",
      },
      {
        title: "可备份可发布",
        body: "源码 ZIP 用于恢复编辑，OpenWebGal ZIP 用于视觉小说预览和独立运行。",
      },
    ],
    workflows: [
      "选择图书、漫画或视觉小说模板。",
      "在浏览器中编辑真实项目文件。",
      "预览作品并导出源码或运行项目。",
    ],
  },
  en: {
    heroTitle: "GenStory",
    heroSubtitle: "Local-first story creation workspace",
    heroBody:
      "Create books, comics, visual novels, and interactive videos in the browser. Project text and assets stay local, with source ZIP backups and OpenWebGal export support.",
    ctaCreate: "Start creating",
    ctaVn: "Explore visual novels",
    pillarsTitle: "Designed for long-running creative work",
    workflowTitle: "From creation to export",
    localProjects: "Local projects",
    pillars: [
      {
        title: "Local-first",
        body: "Project files are written to browser OPFS, so the app can ship as a static site without storing your work on a backend.",
      },
      {
        title: "Structured creation",
        body: "Organize stories with chapters, scenes, scripts, stage state, and asset indexes to reduce duplicated lore and maintenance work.",
      },
      {
        title: "Backup and publish",
        body: "Source ZIPs restore editable projects, while OpenWebGal ZIPs run exported visual novels independently.",
      },
    ],
    workflows: [
      "Choose a book, comic, or visual novel template.",
      "Edit real project files directly in the browser.",
      "Preview the work and export source or runnable projects.",
    ],
  },

} satisfies Record<PublicLang, Record<string, unknown>>;

const featureIcons = [FolderOpen, FileText, Download];

export function PublicHomePage({ lang }: { lang: PublicLang }) {
  const t = copy[lang];
  const createHref = "/projects/new";
  const vnHref = localizedPath(lang, "visual-novel");

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <section className="mb-10 border-b pb-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-end">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              {t.heroSubtitle as string}
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {t.heroTitle as string}
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              {t.heroBody as string}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button render={<Link href={createHref} />} size="lg">
                <BookOpen className="size-4" />
                {t.ctaCreate as string}
              </Button>
              <Button render={<Link href={vnHref} />} size="lg" variant="outline">
                {t.ctaVn as string}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
          <div className="rounded-lg border bg-muted/40 p-5">
            <p className="text-sm font-medium text-muted-foreground">
              {t.workflowTitle as string}
            </p>
            <ol className="mt-4 space-y-3 text-sm leading-6">
              {(t.workflows as string[]).map((item, index) => (
                <li key={item} className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t.pillarsTitle as string}
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {(t.pillars as Array<{ title: string; body: string }>).map((item, index) => {
            const Icon = featureIcons[index] ?? FileText;
            return (
              <Card key={item.title}>
                <CardHeader>
                  <Icon className="size-5 text-muted-foreground" />
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="leading-6">{item.body}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t.localProjects as string}
        </h2>
      </section>
      <LocalProjectSummary />
    </main>
  );

}
