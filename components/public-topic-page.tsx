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
  type PublicLang,
  type PublicPageSlug,
  localizedPath,
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
  const createLabel = lang === "zh" ? "开始创作" : "Start creating";
  const homeLabel = lang === "zh" ? "返回首页" : "Back home";
  const sectionLabel = lang === "zh" ? "核心能力" : "Core workflow";
  const faqLabel = lang === "zh" ? "常见问题" : "FAQ";

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
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
            {createLabel}
          </Button>
          <Button render={<Link href={localizedPath(lang)} />} size="lg" variant="outline">
            {homeLabel}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      <section className="py-10">
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">{sectionLabel}</h2>
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
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">{faqLabel}</h2>
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
    </main>
  );

}
