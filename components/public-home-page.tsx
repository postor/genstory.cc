import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Download,
  Film,
  FileText,
  FolderOpen,
  Gamepad2,
  Image,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

import { LocalProjectSummary } from "@/components/local-project-summary";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,

} from "@/components/ui/card";
import {
  type PublicLang,
  type PublicPageSlug,
  localizedPath,
  publicPageSlugs,
  publicPages,
} from "@/lib/seo";

const copy = {
  zh: {
    heroTitle: "GenStory",
    heroSubtitle: "在浏览器中创作故事和游戏",
    heroBody:
      "在浏览器里创作图书、漫画、视觉小说、互动视频和 Phaser 游戏。作品内容和素材保存在这台设备的浏览器中，不会自动上传到 GenStory 服务器。你可以下载项目备份，也可以导出可运行项目。",
    ctaCreate: "开始创作",
    ctaBrowseTypes: "探索创作类型",
    workTypesTitle: "探索创作类型",
    workTypesBody: "从适合的项目结构开始，了解每种作品类型的编辑、预览和导出方式。",
    openPage: "查看介绍",
    pillarsTitle: "为长期创作设计",
    workflowTitle: "从创作到导出",
    localProjects: "我的作品",
    pillars: [
      {
        title: "保存在你的浏览器里",
        body: "作品内容和素材直接保存在这台设备的浏览器中。换设备或清理浏览器数据前，请先下载项目备份。",
      },
      {
        title: "结构化创作",
        body: "按章节、场景、脚本和素材组织故事，方便持续创作和维护。",
      },
      {
        title: "备份与发布",
        body: "下载项目备份后可以继续编辑；视觉小说和 Phaser 游戏还可以在浏览器中预览并导出运行包。",
      },
    ],
    workflows: [
      "选择图书、漫画、视觉小说、互动视频或 Phaser 游戏模板。",
      "直接在浏览器中编辑作品内容。",
      "预览作品，下载备份或导出运行包。",
    ],
  },
  en: {
    heroTitle: "GenStory",
    heroSubtitle: "Create stories and games in the browser",
    heroBody:
      "Create books, comics, visual novels, interactive videos, and Phaser games in the browser. Your work and assets stay in this browser on this device and are not automatically uploaded to GenStory servers. Download project backups or export runnable projects when ready.",
    ctaCreate: "Start creating",
    ctaBrowseTypes: "Explore creation types",
    workTypesTitle: "Explore creation types",
    workTypesBody: "Start with the project structure that fits your work, then learn how each type is edited, previewed, and exported.",
    openPage: "View overview",
    pillarsTitle: "Designed for long-running creative work",
    workflowTitle: "From creation to export",
    localProjects: "My works",
    pillars: [
      {
        title: "Saved in your browser",
        body: "Your work and assets stay in this browser on this device. Download a project backup before changing devices or clearing browser data.",
      },
      {
        title: "Structured creation",
        body: "Organize stories with chapters, scenes, scripts, and assets so they remain easy to grow and maintain.",
      },
      {
        title: "Backup and publish",
        body: "Project backups can be imported for continued editing, while visual novels and Phaser games preview and export as runnable packages.",
      },
    ],
    workflows: [
      "Choose a book, comic, visual novel, interactive video, or Phaser game template.",
      "Edit your work directly in the browser.",
      "Preview it, download a backup, or export a runnable package.",
    ],
  },

} satisfies Record<PublicLang, Record<string, unknown>>;

const featureIcons = [FolderOpen, FileText, Download];

const typeIcons: Record<PublicPageSlug, LucideIcon> = {
  book: BookOpen,
  comic: Image,
  "visual-novel": MessageCircle,
  "interactive-video": Film,
  "phaser-game": Gamepad2,
};

export function PublicHomePage({ lang }: { lang: PublicLang }) {
  const t = copy[lang];
  const createHref = "/projects/new";

  return (
    <main
      lang={lang === "zh" ? "zh-CN" : "en"}
      className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6"
    >
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
              <Button
                render={<Link href="#work-types" />}
                size="lg"
                variant="outline"
              >
                {t.ctaBrowseTypes as string}
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

      <section id="work-types" className="mb-10 scroll-mt-20">
        <div className="mb-4 max-w-3xl">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t.workTypesTitle as string}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t.workTypesBody as string}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {publicPageSlugs.map((slug) => {
            const page = publicPages[slug];
            const Icon = typeIcons[slug];
            const href = localizedPath(lang, slug);
            return (
              <Card key={slug}>
                <CardHeader className="flex-row items-center gap-2">
                  <Icon className="size-5 shrink-0 text-muted-foreground" />
                  <CardTitle className="min-w-0">
                    <Link href={href} className="hover:underline">
                      {page.kicker[lang]}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="leading-6">
                    {page.description[lang]}
                  </CardDescription>
                </CardContent>
                <CardFooter>
                  <Link
                    href={href}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    {t.openPage as string}
                    <ArrowRight className="size-4" />
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
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
                <CardHeader className="flex-row items-center gap-2">
                  <Icon className="size-5 shrink-0 text-muted-foreground" />
                  <CardTitle className="min-w-0">{item.title}</CardTitle>
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
