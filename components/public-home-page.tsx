import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Download,
  FileText,
  FolderOpen,
} from "lucide-react";

import { LocalProjectSummary } from "@/components/local-project-summary";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { languageInfo, publicHomeCopy } from "@/lib/platform-i18n";
import { localizedPath, type PublicLang } from "@/lib/seo";

const featureIcons = [FolderOpen, FileText, Download];

export function PublicHomePage({ lang }: { lang: PublicLang }) {
  const t = publicHomeCopy[lang];
  const createHref = "/projects/new";

  return (
    <main
      lang={languageInfo[lang].htmlLang}
      className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6"
    >
      <section className="mb-10 border-b pb-10">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            {t.heroSubtitle}
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {t.heroTitle}
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            {t.heroBody}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button render={<Link href={createHref} />} size="lg">
              <BookOpen className="size-4" />
              {t.ctaCreate}
            </Button>
            <Button
              render={<Link href={localizedPath(lang, "types")} />}
              size="lg"
              variant="outline"
            >
              {t.ctaBrowseTypes}
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t.pillarsTitle}
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {t.pillars.map((item, index) => {
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

      <section id="work-types" className="mb-6 scroll-mt-20">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t.localProjects}
        </h2>
      </section>
      <LocalProjectSummary />

      <section className="border-t py-10">
        <h2 className="mb-4 text-2xl font-semibold tracking-tight">
          {t.faqTitle}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {t.faqs.map((item) => (
            <Card key={item.question}>
              <CardHeader>
                <CardTitle>{item.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="leading-6">
                  {item.answer}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
