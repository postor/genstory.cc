import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clapperboard,
  FileImage,
  Gamepad2,
  LibraryBig,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import bookImage from "@/docs/design/icons/book.png";
import comicImage from "@/docs/design/icons/comic.png";
import gameImage from "@/docs/design/icons/game.png";
import pictureBookImage from "@/docs/design/icons/picture-book.png";
import videoImage from "@/docs/design/icons/video.png";
import visualNovelImage from "@/docs/design/icons/visual-novel.png";
import { PublicCaseProjectPreview } from "@/components/public-case-project-preview";
import { Button } from "@/components/ui/button";
import {
  aiPromptChrome,
  publicBookCaseProject,
  publicComicCaseProject,
  publicPagePromptExamples,
  publicPhaserGameCaseProject,
} from "@/lib/ai-prompt-examples";
import { languageInfo, publicTopicChrome } from "@/lib/platform-i18n";
import {
  localizedPath,
  publicPages,
  publicPageSlugs,
  siteTrustSummary,
  type PublicLang,
  type PublicPageSlug,
} from "@/lib/seo";

const topicIcons: Record<PublicPageSlug, typeof BookOpen> = {
  book: BookOpen,
  "picture-book": BookOpen,
  comic: FileImage,
  "visual-novel": MessageCircle,
  "interactive-video": Clapperboard,
  "phaser-game": Gamepad2,
};

const topicImages = {
  book: bookImage,
  "picture-book": pictureBookImage,
  comic: comicImage,
  "visual-novel": visualNovelImage,
  "interactive-video": videoImage,
  "phaser-game": gameImage,
} satisfies Record<PublicPageSlug, typeof bookImage>;

const workflowIcons = [LibraryBig, Sparkles, ShieldCheck];

const topicUiCopy = {
  zh: {
    heroLabel: "创作类型",
    localFirst: "本地优先",
    structuredFiles: "结构化项目文件",
    previewExport: "预览与导出",
    workflowIntro: "把故事、素材和运行结果放进一套清晰的项目结构里，让创作可以持续推进。",
    promptLabel: "提示词工作台",
    promptIntro: "先明确创作目标和素材关系，再把提示词变成可复用、可追踪的项目内容。",
    caseLabel: "可运行案例",
    faqIntro: "关于这个创作类型的工作方式、备份策略和发布边界。",
    relatedIntro: "从这里继续探索其他创作类型。",
    modelLabel: "模型",
    promptStep: (index: number) => `第 ${index + 1} 步提示词`,
    preview: "预览案例",
    previewLoading: "准备预览中…",
    fork: "Fork 到本地",
    forkLoading: "创建本地项目中…",
    unsupported: "当前浏览器不支持本地项目预览",
    failed: "案例项目加载失败，请稍后再试",
  },
  en: {
    heroLabel: "Creation type",
    localFirst: "Local-first",
    structuredFiles: "Structured project files",
    previewExport: "Preview and export",
    workflowIntro:
      "Keep story, assets, and runnable output inside one clear project structure that can keep growing with you.",
    promptLabel: "Prompt workspace",
    promptIntro:
      "Define the creative goal and asset relationships first, then turn prompts into reusable, traceable project material.",
    caseLabel: "Runnable case",
    faqIntro: "How this creation type works, how backups fit in, and where publishing begins.",
    relatedIntro: "Continue exploring other creation types.",
    modelLabel: "Model",
    promptStep: (index: number) => `Prompt ${index + 1}`,
    preview: "Preview case",
    previewLoading: "Preparing preview…",
    fork: "Fork locally",
    forkLoading: "Creating project…",
    unsupported: "This browser cannot preview local projects",
    failed: "The case project could not be loaded",
  },
} satisfies Record<
  PublicLang,
  {
    heroLabel: string;
    localFirst: string;
    structuredFiles: string;
    previewExport: string;
    workflowIntro: string;
    promptLabel: string;
    promptIntro: string;
    caseLabel: string;
    faqIntro: string;
    relatedIntro: string;
    modelLabel: string;
    promptStep: (index: number) => string;
    preview: string;
    previewLoading: string;
    fork: string;
    forkLoading: string;
    unsupported: string;
    failed: string;
  }
>;

export function PublicTopicPage({
  lang,
  slug,
}: {
  lang: PublicLang;
  slug: PublicPageSlug;
}) {
  const page = publicPages[slug];
  const chrome = publicTopicChrome[lang];
  const promptChrome = aiPromptChrome[lang];
  const promptExamples = publicPagePromptExamples[slug];
  const ui = topicUiCopy[lang];
  const TopicIcon = topicIcons[slug];
  const caseProject =
    slug === "book"
      ? publicBookCaseProject
      : slug === "comic"
        ? publicComicCaseProject
        : slug === "phaser-game"
          ? publicPhaserGameCaseProject
          : null;
  const casePrompts = caseProject?.prompts?.[lang] ?? (
    caseProject ? [caseProject.prompt[lang]] : []
  );

  return (
    <main
      lang={languageInfo[lang].htmlLang}
      className="overflow-hidden bg-[#f8f7fb] text-[#17152d]"
    >
      <section className="border-b border-[#e7e3ee] bg-[#f8f7fb]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-14 sm:py-16 lg:py-20">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-sm text-[#7a748e]">
                <Link
                  href={localizedPath(lang)}
                  className="transition-colors hover:text-[#5b3bbd]"
                >
                  {chrome.homeBreadcrumb}
                </Link>
                <ArrowRight className="size-4 text-[#b0a8c1]" aria-hidden="true" />
                <span className="text-[#342d54]">{page.kicker[lang]}</span>
              </div>

              <div className="relative mx-auto mt-6 flex aspect-[4/3] w-full max-w-[280px] items-center justify-center overflow-hidden rounded-lg border border-[#ddd7e9] bg-white shadow-[0_18px_44px_rgba(76,56,130,0.12)]">
                <Image
                  src={topicImages[slug]}
                  alt={page.kicker[lang]}
                  fill
                  priority
                  sizes="280px"
                  className="object-cover"
                />
              </div>

              <div className="mt-8 flex items-center gap-3 text-sm font-semibold text-[#7951dd]">
                <span className="grid size-10 place-items-center rounded-lg bg-[#ede8fb]">
                  <TopicIcon className="size-5" aria-hidden="true" />
                </span>
                <span className="uppercase tracking-[0.16em]">{ui.heroLabel}</span>
                <span className="h-px w-8 bg-[#c8bde2]" aria-hidden="true" />
                <span className="text-[#3f365d]">{page.kicker[lang]}</span>
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-[0.01em] text-[#1e1a3a] sm:text-5xl lg:text-6xl">
                {page.heading[lang]}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[#6f6b84] sm:text-lg">
                {page.intro[lang]}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  render={<Link href={`/projects/new?template=${slug}`} />}
                  size="lg"
                  className="min-h-11 border-0 bg-[#8754ff] px-5 text-white shadow-[0_12px_30px_rgba(95,44,255,0.2)] hover:bg-[#7642ef]"
                >
                  <BookOpen data-icon="inline-start" />
                  {chrome.create}
                </Button>
                <Button
                  render={<Link href={localizedPath(lang)} />}
                  size="lg"
                  variant="outline"
                  className="min-h-11 border-[#d6cdea] bg-white/70 px-5 text-[#493d71] hover:bg-white hover:text-[#342759]"
                >
                  {chrome.home}
                  <ArrowRight className="size-4" />
                </Button>
              </div>

              <div className="mt-10 max-w-2xl border-t border-[#ded8e9] pt-5 text-sm leading-6 text-[#746d88]">
                {siteTrustSummary[lang]}
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="border-b border-[#e7e3ee] bg-white">
        <div className="mx-auto grid max-w-7xl divide-y divide-[#e7e3ee] px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-8">
          <InfoBandItem icon={ShieldCheck} label={ui.localFirst} />
          <InfoBandItem icon={LibraryBig} label={ui.structuredFiles} />
          <InfoBandItem icon={Sparkles} label={ui.previewExport} />
        </div>
      </section>

      <section className="bg-[#fbfaff]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(220px,0.72fr)_minmax(0,1.28fr)] lg:gap-20">
            <div className="max-w-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7951dd]">
                {ui.heroLabel}
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#1e1a3a] sm:text-4xl">
                {chrome.coreWorkflow}
              </h2>
              <p className="mt-5 text-base leading-7 text-[#6f6b84]">
                {ui.workflowIntro}
              </p>
            </div>

            <div className="border-t border-[#dcd7e8]">
              {page.sections.map((section, index) => {
                const Icon = workflowIcons[index] ?? LibraryBig;

                return (
                  <article
                    key={section.title[lang]}
                    className="grid gap-5 border-b border-[#dcd7e8] py-7 md:grid-cols-[56px_minmax(170px,0.7fr)_minmax(0,1.3fr)] md:items-start md:gap-7"
                  >
                    <span className="grid size-10 place-items-center rounded-lg bg-[#ede8fb] text-sm font-semibold text-[#7951dd]">
                      0{index + 1}
                    </span>
                    <div className="flex items-start gap-3">
                      <Icon className="mt-0.5 size-5 shrink-0 text-[#7951dd]" aria-hidden="true" />
                      <h3 className="text-lg font-semibold leading-7 text-[#241f43]">
                        {section.title[lang]}
                      </h3>
                    </div>
                    <p className="text-sm leading-7 text-[#6f6b84]">
                      {section.body[lang]}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#eee9fb]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[minmax(220px,0.72fr)_minmax(0,1.28fr)] lg:gap-20">
            <div className="max-w-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7951dd]">
                {ui.promptLabel}
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#1e1a3a] sm:text-4xl">
                {promptChrome.title}
              </h2>
              <p className="mt-5 text-base leading-7 text-[#6f6b84]">
                {promptChrome.intro}
              </p>
              <p className="mt-4 text-sm leading-6 text-[#7a7590]">
                {ui.promptIntro}
              </p>
            </div>

            <div>
              {caseProject ? (
                <article className="border-y border-[#cfc4e8] py-7">
                  <div className="flex flex-wrap items-start justify-between gap-6">
                    <div className="min-w-0 max-w-2xl">
                      <p className="text-sm font-semibold text-[#7951dd]">
                        {ui.caseLabel}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-[#241f43]">
                        {caseProject.title[lang]}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-[#6f6b84]">
                        {caseProject.description[lang]}
                      </p>
                    </div>
                    <PublicCaseProjectPreview
                      sourceUrl={caseProject.sourceUrl}
                      title={caseProject.title[lang]}
                      template={caseProject.template}
                      lang={lang}
                      returnTo={localizedPath(lang, slug)}
                      labels={{
                        preview: ui.preview,
                        previewLoading: ui.previewLoading,
                        fork: ui.fork,
                        forkLoading: ui.forkLoading,
                        unsupported: ui.unsupported,
                        failed: ui.failed,
                      }}
                    />
                  </div>

                  <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#716a87]">
                    <span>
                      {ui.modelLabel}
                      {lang === "zh" ? "：" : ": "}
                      {caseProject.model}
                    </span>
                    <span>{caseProject.costNote[lang]}</span>
                  </div>

                  <div className="mt-6 space-y-4">
                    {casePrompts.map((prompt, index) => (
                      <div key={`${caseProject.title[lang]}-${index}`}>
                        {casePrompts.length > 1 ? (
                          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7951dd]">
                            {ui.promptStep(index)}
                          </p>
                        ) : null}
                        <pre className="overflow-x-auto whitespace-pre-wrap border-l-2 border-[#8b65ef] bg-white/65 p-4 text-sm leading-7 text-[#322b52]">
                          {prompt}
                        </pre>
                      </div>
                    ))}
                  </div>
                </article>
              ) : null}

              <div className={caseProject ? "mt-8 border-t border-[#cfc4e8]" : ""}>
                {promptExamples.map((example, index) => (
                  <article
                    key={example.useCase[lang]}
                    className="grid gap-5 border-b border-[#cfc4e8] py-7 md:grid-cols-[minmax(170px,0.55fr)_minmax(0,1.45fr)] md:gap-8"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#241f43]">
                        {String(index + 1).padStart(2, "0")}{" "}
                        {example.useCase[lang]}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-[#736c88]">
                        <span className="font-medium text-[#4a3c79]">
                          {promptChrome.outcome}
                        </span>
                        {`: ${example.outcome[lang]}`}
                      </p>
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap border-l-2 border-[#c6b6f5] bg-white/50 p-4 text-sm leading-7 text-[#322b52]">
                      {example.prompt[lang]}
                    </pre>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-[#1e1a3a] sm:text-4xl">
              {chrome.faq}
            </h2>
            <p className="mt-5 text-base leading-7 text-[#6f6b84]">
              {ui.faqIntro}
            </p>
          </div>

          <div className="mt-10 grid gap-x-12 md:grid-cols-2">
            {page.faqs.map((item) => (
              <details
                key={item.question[lang]}
                className="group border-t border-[#dcd7e8] py-6"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-lg font-semibold leading-7 text-[#241f43] marker:hidden">
                  <span>{item.question[lang]}</span>
                  <ArrowRight className="mt-1 size-5 shrink-0 text-[#8b65ef] transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-4 max-w-xl pr-8 text-sm leading-7 text-[#6f6b84]">
                  {item.answer[lang]}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#e7e3ee] bg-[#f8f7fb]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-[#1e1a3a] sm:text-4xl">
                {chrome.relatedTypes}
              </h2>
              <p className="mt-4 text-base leading-7 text-[#6f6b84]">
                {ui.relatedIntro}
              </p>
            </div>
            <Link
              href={localizedPath(lang, "types")}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#6d4bd0] transition-colors hover:text-[#4d2caf]"
            >
              {chrome.relatedTypes}
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <nav
            aria-label={chrome.relatedTypes}
            className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            {publicPageSlugs
              .filter((otherSlug) => otherSlug !== slug)
              .map((otherSlug) => {
                return (
                  <Link
                    key={otherSlug}
                    href={`/projects/new?template=${otherSlug}`}
                    className="group flex h-full flex-col gap-4 rounded-lg border border-[#ddd7e9] bg-white p-4 transition-colors hover:border-[#b9a5ee] hover:bg-[#fcfbff] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#8b65ef]/35 sm:p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-[#ede8fb] sm:size-[72px]">
                        <Image
                          src={topicImages[otherSlug]}
                          alt=""
                          fill
                          sizes="72px"
                          className="object-contain p-1 transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7951dd]">
                              {publicPages[otherSlug].kicker[lang]}
                            </p>
                            <h3 className="mt-1 text-lg font-semibold leading-7 text-[#241f43]">
                              {publicPages[otherSlug].heading[lang]}
                            </h3>
                          </div>
                          <ArrowRight className="size-5 shrink-0 text-[#aaa1c1] transition-transform group-hover:translate-x-1 group-hover:text-[#7951dd]" />
                        </div>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[#6f6b84]">
                      {publicPages[otherSlug].description[lang]}
                    </p>
                  </Link>
                );
              })}
          </nav>
        </div>
      </section>
    </main>
  );
}

function InfoBandItem({
  icon: Icon,
  label,
}: {
  icon: typeof ShieldCheck;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 px-1 py-5 text-sm font-semibold text-[#3c3559] md:px-7 md:py-6">
      <span className="grid size-9 place-items-center rounded-lg bg-[#ede8fb] text-[#7951dd]">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span>{label}</span>
      <Check className="ml-auto size-4 text-[#8b65ef]" aria-hidden="true" />
    </div>
  );
}
