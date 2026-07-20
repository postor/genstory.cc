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
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">{chrome.faq}</h2>
        <div className="space-y-3">
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
