import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,

} from "@/components/ui/card";
import {
  aiPromptChrome,
  publicBookCaseProject,
  publicComicCaseProject,
  publicPhaserGameCaseProject,
  publicPagePromptExamples,
} from "@/lib/ai-prompt-examples";
import { PublicCaseProjectPreview } from "@/components/public-case-project-preview";
import { languageInfo, publicTopicChrome } from "@/lib/platform-i18n";
import {
  type PublicLang,
  type PublicPageSlug,
  localizedPath,
  publicPageSlugs,
  publicPages,

} from "@/lib/seo";

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
      className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6"
    >
      <section className="border-b pb-10">
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          {page.kicker[lang]}
        </p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          {page.heading[lang]}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
          {page.intro[lang]}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button render={<Link href="/projects/new" />} size="lg">
            <BookOpen className="size-4" />
            {chrome.create}
          </Button>
          <Button render={<Link href={localizedPath(lang)} />} size="lg" variant="outline">
            {chrome.home}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      <section className="py-10">
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">{chrome.coreWorkflow}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {page.sections.map((section) => (
            <Card key={section.title[lang]}>
              <CardHeader>
                <CardTitle>{section.title[lang]}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="leading-6">
                  {section.body[lang]}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t py-10">
        <div className="mb-4 flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            {promptChrome.title}
          </h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          {promptChrome.intro}
        </p>
      </div>
      {caseProject ? (
        <Card className="mb-4 border-primary/30 bg-primary/5">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <CardTitle>{caseProject.title[lang]}</CardTitle>
                <CardDescription className="mt-2 max-w-3xl leading-6">
                  {caseProject.description[lang]}
                </CardDescription>
              </div>
              <PublicCaseProjectPreview
                sourceUrl={caseProject.sourceUrl}
                title={caseProject.title[lang]}
                template={caseProject.template}
                lang={lang}
                returnTo={localizedPath(lang, slug)}
                labels={{
                  preview: lang === "zh" ? "预览案例" : "Preview case",
                  previewLoading: lang === "zh" ? "准备预览…" : "Preparing preview…",
                  fork: lang === "zh" ? "Fork 到本地" : "Fork locally",
                  forkLoading: lang === "zh" ? "创建本地项目…" : "Creating project…",
                  unsupported:
                    lang === "zh"
                      ? "当前浏览器不支持本地项目预览"
                      : "This browser cannot preview local projects",
                  failed:
                    lang === "zh"
                      ? "案例项目加载失败，请稍后再试"
                      : "The case project could not be loaded",
                }}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
              <span>
                {lang === "zh" ? "模型" : "Model"}：{caseProject.model}
              </span>
              <span>
                {caseProject.costNote[lang]}
              </span>
            </div>
            <div className="space-y-3">
              {casePrompts.map((prompt, index) => (
                <div key={`${caseProject.title[lang]}-${index}`}>
                  {casePrompts.length > 1 ? (
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      {lang === "zh" ? `第 ${index + 1} 步提示词` : `Prompt ${index + 1}`}
                    </p>
                  ) : null}
                  <pre className="whitespace-pre-wrap rounded-md border bg-background p-3 text-sm leading-6 text-foreground">
                    {prompt}
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
          {promptExamples.map((example) => (
            <Card key={example.useCase[lang]}>
              <CardHeader>
                <CardTitle>{example.useCase[lang]}</CardTitle>
                <CardDescription className="leading-6">
                  <span className="font-medium text-foreground">
                    {promptChrome.outcome}
                  </span>
                  {`: ${example.outcome[lang]}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap rounded-md border bg-muted p-3 text-sm leading-6 text-foreground">
                  {example.prompt[lang]}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t py-10">
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">{chrome.faq}</h2>
        <div className="flex flex-col gap-3">
          {page.faqs.map((item) => (
            <Card key={item.question[lang]}>
              <CardHeader>
                <CardTitle>{item.question[lang]}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="leading-6">
                  {item.answer[lang]}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t pb-10 pt-10">
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">{chrome.relatedTypes}</h2>
        <nav aria-label={chrome.relatedTypes} className="grid gap-4 sm:grid-cols-2">
          {publicPageSlugs
            .filter((otherSlug) => otherSlug !== slug)
            .map((otherSlug) => (
              <Link
                key={otherSlug}
                href={localizedPath(lang, otherSlug)}
                className="group block rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Card className="h-full transition-colors group-hover:border-primary/50 group-hover:bg-muted/30">
                  <CardHeader className="gap-2">
                    <CardTitle className="flex items-center justify-between gap-4">
                      <span>{publicPages[otherSlug].kicker[lang]}</span>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="leading-6">
                      {publicPages[otherSlug].intro[lang]}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
        </nav>
      </section>
    </main>
  );

}
