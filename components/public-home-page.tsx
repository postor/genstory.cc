import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Clapperboard,
  FileImage,
  FolderPlus,
  Gamepad2,
  LibraryBig,
  MessageCircle,
  Sparkles,
  Upload,
  WandSparkles,
} from "lucide-react";

import bannerForeground from "@/docs/design/banner-fg.png";
import { LocalContinueProjectCard } from "@/components/local-continue-project-card";
import { LocalProjectSummary } from "@/components/local-project-summary";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { contentTypes, type ContentTypeId } from "@/lib/content-types";
import { languageInfo, publicHomeCopy } from "@/lib/platform-i18n";
import { localizedPath, type PublicLang } from "@/lib/seo";

const typeImages: Record<ContentTypeId, string> = {
  book: "/home/type-icons/book.png",
  "picture-book": "/home/type-icons/book.png",
  comic: "/home/type-icons/comic.png",
  "visual-novel": "/home/type-icons/visual-novel.png",
  "interactive-video": "/home/type-icons/video.png",
  "phaser-game": "/home/type-icons/game.png",
};

const typeIcons: Record<ContentTypeId, typeof BookOpen> = {
  book: BookOpen,
  "picture-book": BookOpen,
  comic: FileImage,
  "visual-novel": MessageCircle,
  "interactive-video": Clapperboard,
  "phaser-game": Gamepad2,
};

const typeShortDescriptions: Record<
  ContentTypeId,
  Record<PublicLang, string>
> = {
  book: {
    zh: "创作小说、文档、传记与长篇文字作品",
    en: "Novels, documents, lore, and long-form writing",
  },
  "picture-book": {
    zh: "横版画面、文字与配音组成的绘本故事",
    en: "Landscape art, page text, and narration for picture books",
  },
  comic: {
    zh: "分镜、页面、角色与漫画故事创作",
    en: "Panels, pages, characters, and visual stories",
  },
  "visual-novel": {
    zh: "脚本、分支、角色与沉浸式视觉故事",
    en: "Scripts, branches, characters, and visual stories",
  },
  "interactive-video": {
    zh: "视频、时间线、分支与互动故事体验",
    en: "Video, timelines, branches, and interactive stories",
  },
  "phaser-game": {
    zh: "通过 Phaser 引擎创建浏览器游戏",
    en: "Create browser games with the Phaser engine",
  },
};

const featureIcons = [FolderPlus, Upload, WandSparkles];

const homeUiCopy = {
  zh: {
    supportedTypes: "支持多种创作类型",
    chooseType: "选择创作类型",
    chooseTypeBody: "从一个清晰的起点开始，把灵感变成可持续编辑的作品。",
    viewAll: "查看全部",
    quickStart: "快速开始",
    templateTitle: "使用模板创建",
    templateBody: "从精选类型开始创作",
    importTitle: "导入文件",
    importBody: "导入文档、图片或脚本",
    assistantTitle: "AI 创作助手",
    assistantBody: "让 CC 帮你扩写灵感",
    helpTitle: "需要帮助吗？",
    helpBody: "我随时在这里！",
    helperIntro: "保留结构，也保留创作的自由。",
    mobileNav: "移动端导航",
    mobileHome: "首页",
    mobileProjects: "项目",
    mobileExplore: "探索",
    mobileMe: "我的",
  },
  en: {
    supportedTypes: "Built for many kinds of making",
    chooseType: "Choose a creation type",
    chooseTypeBody: "Start from a clear structure and turn an idea into an editable work.",
    viewAll: "View all",
    quickStart: "Quick start",
    templateTitle: "Create from a template",
    templateBody: "Start from a focused template",
    importTitle: "Import files",
    importBody: "Bring in docs, images, or scripts",
    assistantTitle: "AI creative assistant",
    assistantBody: "Let CC help shape an idea",
    helpTitle: "Need a hand?",
    helpBody: "CC is here when you need it.",
    helperIntro: "Keep the structure without losing creative freedom.",
    mobileNav: "Mobile navigation",
    mobileHome: "Home",
    mobileProjects: "Projects",
    mobileExplore: "Explore",
    mobileMe: "Me",
  },
} satisfies Record<PublicLang, Record<string, string>>;

function splitHeroSubtitle(text: string, lang: PublicLang): [string, string] {
  const separator = lang === "zh" ? "，" : " for ";
  const separatorIndex = text.indexOf(separator);

  if (separatorIndex < 0) return [text, ""];

  return lang === "zh"
    ? [text.slice(0, separatorIndex + separator.length), text.slice(separatorIndex + separator.length)]
    : [text.slice(0, separatorIndex), text.slice(separatorIndex + 1)];
}

function splitHeroTitle(text: string, lang: PublicLang): [string, string] {
  const separator = lang === "zh" ? "，" : " a world";
  const separatorIndex = text.indexOf(separator);

  if (separatorIndex < 0) return [text, ""];

  return lang === "zh"
    ? [text.slice(0, separatorIndex + separator.length), text.slice(separatorIndex + separator.length)]
    : [text.slice(0, separatorIndex), text.slice(separatorIndex + 1)];
}

export function PublicHomePage({ lang }: { lang: PublicLang }) {
  const t = publicHomeCopy[lang];
  const ui = homeUiCopy[lang];
  const titleLines = splitHeroTitle(t.heroTitle, lang);
  const subtitleLines = splitHeroSubtitle(t.heroSubtitle, lang);

  return (
    <main lang={languageInfo[lang].htmlLang} className="overflow-hidden bg-[#fbfaff] text-[#121331]">
      <section className="relative overflow-hidden bg-[#07091f] text-white">
        <Image
          src="/home/pc-banner-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="pointer-events-none z-0 object-cover object-center"
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 z-[1] hidden w-[70%] bg-gradient-to-r from-[#07091f]/90 via-[#07091f]/65 to-transparent lg:block" />
        <div className="pointer-events-none absolute inset-y-0 left-0 z-[3] w-[72%] bg-gradient-to-r from-[#07091f]/95 via-[#07091f]/80 to-transparent md:hidden" />

        <div className="relative z-10 mx-auto flex min-h-[620px] max-w-7xl flex-col items-center gap-4 px-4 pb-6 pt-20 md:h-[480px] md:min-h-0 md:flex-row md:gap-5 md:px-6 md:pb-0 md:pt-16 lg:h-[545px] lg:gap-8 lg:px-8 lg:pt-16">
          <div className="order-last flex w-full flex-col items-center text-center md:order-first md:min-w-0 md:flex-1 md:items-start md:text-left">
            <h1 className="max-w-none break-words text-3xl font-bold leading-[1.12] tracking-[0.01em] drop-shadow-[0_8px_24px_rgba(0,0,0,0.28)] md:text-4xl lg:text-5xl xl:text-6xl">
              <span className="block lg:inline">{titleLines[0]}</span>
              {lang === "en" ? " " : null}
              {titleLines[1] ? (
                <span
                  className={`block lg:inline ${
                    lang === "zh"
                      ? "bg-gradient-to-r from-[#d6c2ff] via-[#b17cff] to-[#8d57ff] bg-clip-text text-transparent"
                      : ""
                  }`}
                >
                  {titleLines[1]}
                </span>
              ) : null}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-white/75 lg:mt-5 lg:text-lg">
              <span className="block lg:inline">{subtitleLines[0]}</span>{" "}
              {subtitleLines[1] ? <span className="block lg:inline">{subtitleLines[1]}</span> : null}
            </p>
            <div className="mt-7 hidden flex-wrap gap-3 md:flex">
              <Button
                render={<Link href="/projects/new" />}
                size="lg"
                className="min-h-11 border-0 bg-[#8754ff] px-5 text-white shadow-[0_12px_30px_rgba(95,44,255,0.35)] hover:bg-[#7642ef] lg:!pl-4"
              >
                <Sparkles data-icon="inline-start" />
                {t.ctaCreate}
              </Button>
              <Button
                render={<Link href="#work-types" />}
                size="lg"
                variant="outline"
                className="min-h-11 border-white/25 bg-white/5 px-5 text-white hover:bg-white/12 hover:text-white"
              >
                <Upload data-icon="inline-start" />
                {t.ctaBrowseTypes}
              </Button>
            </div>
            <div className="mt-7 hidden md:block">
              <p className="text-sm text-white/45">{ui.supportedTypes}</p>
              <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 text-sm text-white/70 lg:grid-cols-3 xl:flex xl:flex-wrap">
                {contentTypes.map((type) => {
                  const Icon = typeIcons[type.id];
                  return (
                    <Link
                      key={type.id}
                      href={localizedPath(lang, type.id)}
                      className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
                    >
                      <Icon className="size-4 text-[#bd9aff]" />
                      {type.label[lang]}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="pointer-events-none relative order-first z-[2] aspect-square w-[min(360px,100%)] max-w-full md:order-last md:w-[38%] md:max-w-[360px] md:shrink-0 lg:w-[42%] lg:max-w-[481px]">
            <Image
              src={bannerForeground}
              alt="CC 角色在故事世界中展开创作"
              width={1254}
              height={1254}
              priority
              sizes="(max-width: 1023px) 100vw, 481px"
              className="h-full w-full object-contain object-bottom"
            />
          </div>
        </div>
      </section>

      <section className="relative bg-[linear-gradient(180deg,#f8f6ff_0%,#ffffff_34%,#fbfaff_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              <section id="work-types" className="scroll-mt-20">
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        {ui.chooseType}
                      </h2>
                      <Sparkles className="size-5 text-[#8c5aff]" />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#6b6a89]">
                      {ui.chooseTypeBody}
                    </p>
                  </div>
                  <Link
                    href={localizedPath(lang, "types")}
                    className="hidden items-center gap-1 text-sm font-medium text-[#6f45dc] hover:text-[#4c27ba] sm:inline-flex"
                  >
                    {ui.viewAll}
                    <ArrowRight className="size-4" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                  {contentTypes.map((type) => (
                    <CreationTypeCard key={type.id} lang={lang} type={type} />
                  ))}
                </div>
              </section>

              <section className="mt-12" aria-labelledby="my-works-title">
                <LocalProjectSummary />
              </section>
            </div>

            <aside className="space-y-4 xl:pt-9">
              <LocalContinueProjectCard lang={lang} />

              <Card className="border-[#e8e3ff] bg-white/85 shadow-[0_18px_45px_rgba(88,67,166,0.08)]">
                <CardHeader className="px-5 pb-3 pt-5">
                  <CardTitle className="text-lg">
                    {ui.quickStart}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  <div className="divide-y divide-[#f0edff]">
                    <QuickStartItem
                      icon={FolderPlus}
                      title={ui.templateTitle}
                      body={ui.templateBody}
                      href="/projects/new"
                    />
                    <QuickStartItem
                      icon={Upload}
                      title={ui.importTitle}
                      body={ui.importBody}
                      href="/projects"
                    />
                    <QuickStartItem
                      icon={WandSparkles}
                      title={ui.assistantTitle}
                      body={ui.assistantBody}
                      href="/settings"
                    />
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>

          <div id="assistant-help" className="mt-10 flex items-center gap-4 rounded-2xl border border-[#e6e0ff] bg-[#f1edff] px-5 py-3 shadow-[0_12px_30px_rgba(93,65,198,0.08)] sm:mt-14 sm:px-7">
            <Image
              src="/home/assistant-bust.png"
              alt=""
              width={110}
              height={116}
              className="size-16 shrink-0 object-contain sm:size-20"
            />
            <div className="min-w-0">
              <p className="font-semibold text-[#372272]">
                {ui.helpTitle}
              </p>
              <p className="mt-1 text-sm text-[#6c5c9a]">
                {ui.helpBody}
              </p>
            </div>
            <ArrowRight className="ml-auto size-5 shrink-0 text-[#7653db]" />
          </div>

          <section className="mt-14 border-t border-[#ece9f5] pt-10">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{t.pillarsTitle}</h2>
                <p className="mt-2 text-sm text-[#6b6a89]">
                  {ui.helperIntro}
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {t.pillars.map((item, index) => {
                const Icon = featureIcons[index] ?? LibraryBig;
                return (
                  <Card
                    key={item.title}
                    className="border-[#ebe7f7] bg-white/80 shadow-[0_12px_35px_rgba(89,76,133,0.06)]"
                  >
                    <CardHeader className="flex-row items-center gap-3 px-5 pb-3 pt-5">
                      <span className="grid size-10 place-items-center rounded-xl bg-[#f0eaff] text-[#7951dd]">
                        <Icon className="size-5" />
                      </span>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 pb-5">
                      <CardDescription className="leading-6 text-[#777592]">
                        {item.body}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="mt-14 border-t border-[#ece9f5] py-10" aria-labelledby="faq-title">
            <h2 id="faq-title" className="mb-5 text-2xl font-bold tracking-tight">
              {t.faqTitle}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {t.faqs.map((item) => (
                <Card key={item.question} className="border-[#ebe7f7] bg-white/75">
                  <CardHeader className="px-5 pb-3 pt-5">
                    <CardTitle className="text-base">{item.question}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <CardDescription className="leading-6 text-[#777592]">
                      {item.answer}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </section>

      <nav
        aria-label={ui.mobileNav}
        className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 rounded-2xl border border-[#e8e2ff] bg-white/95 p-1.5 text-xs shadow-[0_14px_35px_rgba(48,36,91,0.16)] backdrop-blur sm:hidden"
      >
        <MobileNavLink href={localizedPath(lang)} label={ui.mobileHome} active />
        <MobileNavLink href="/projects" label={ui.mobileProjects} />
        <MobileNavLink href={localizedPath(lang, "types")} label={ui.mobileExplore} />
        <MobileNavLink href="/settings" label={ui.mobileMe} />
      </nav>
    </main>
  );
}

function CreationTypeCard({
  lang,
  type,
}: {
  lang: PublicLang;
  type: (typeof contentTypes)[number];
}) {
  return (
    <Card className="group h-full border-[#e9e5fb] bg-white/90 shadow-[0_10px_24px_rgba(92,75,160,0.06)] transition-transform hover:-translate-y-1 hover:border-[#cfc0ff] hover:shadow-[0_16px_32px_rgba(92,75,160,0.12)]">
      <Link href={localizedPath(lang, type.id)} className="flex h-full flex-col">
        <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-1">
          <div className="relative flex h-20 w-full items-center justify-center overflow-hidden sm:h-24">
            <Image
              src={typeImages[type.id]}
              alt=""
              fill
              sizes="(max-width: 640px) 40vw, 18vw"
              className="object-contain object-center transition-opacity group-hover:opacity-90"
            />
          </div>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="min-w-0 text-sm sm:text-base">
              {type.label[lang]}
            </CardTitle>
            <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg bg-[#f2edff] px-2 py-1 text-xs font-semibold text-[#7148db] transition-colors group-hover:bg-[#8754ff] group-hover:text-white">
              Go
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3 p-3 pt-1 sm:p-4 sm:pt-1">
          <CardDescription className="text-xs leading-5 text-[#7a7897]">
            {typeShortDescriptions[type.id][lang]}
          </CardDescription>
        </CardContent>
      </Link>
    </Card>
  );
}

function QuickStartItem({
  icon: Icon,
  title,
  body,
  href,
}: {
  icon: typeof FolderPlus;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Link href={href} className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f0eaff] text-[#7951dd] transition-colors group-hover:bg-[#e6dcff]">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[#252047]">{title}</span>
        <span className="mt-1 block truncate text-xs text-[#8b88a4]">{body}</span>
      </span>
      <ArrowRight className="ml-auto size-4 shrink-0 text-[#b3add0] transition-transform group-hover:translate-x-0.5 group-hover:text-[#7653db]" />
    </Link>
  );
}

function MobileNavLink({
  href,
  label,
  active = false,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-11 items-center justify-center rounded-xl font-medium transition-colors ${
        active ? "bg-[#eee8ff] text-[#7148db]" : "text-[#8986a3] hover:bg-[#f7f4ff]"
      }`}
    >
      {label}
    </Link>
  );
}
