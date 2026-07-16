"use client";

import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { enabledContentTypes } from "@/lib/content-types";
import { useLang } from "@/lib/i18n";

export default function Home() {
  const { lang, t } = useLang();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* Hero */}
      <section className="mb-10">
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary to-secondary p-8 text-primary-foreground sm:p-12">
          <div className="relative max-w-2xl">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {t("home.heroTitle")}
            </h1>
            <p className="mt-3 text-sm leading-6 text-primary-foreground/80 sm:text-base">
              {t("home.heroSubtitle")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                render={<Link href="/projects/new" />}
                size="lg"
                variant="secondary"
              >
                <BookOpen className="size-4" />
                {t("home.ctaCreate")}
              </Button>
              <Button
                render={<Link href="/projects" />}
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                {t("home.ctaBrowse")}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Work-type sections */}
      <section aria-label={t("nav.projects")} className="space-y-6">
        {enabledContentTypes.map((section) => (
          <Card key={section.id}>
            <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <CardTitle className="text-2xl">{section.label[lang]}</CardTitle>
                <CardDescription className="max-w-3xl">
                  {section.description[lang]}
                </CardDescription>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button render={<Link href={`/projects/new?template=${section.id}`} />}>
                  <BookOpen className="size-4" />
                  {t("home.sectionCreate")}
                </Button>
                <Button render={<Link href="/projects" />} variant="outline">
                  {t("home.sectionMore")}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-muted/40">
                  <CardContent className="space-y-2 p-4">
                    <p className="font-semibold">
                      {section.label[lang]}
                      {t("home.sampleTitle")}
                    </p>
                    <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">
                      {section.description[lang]}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-muted/40">
                  <CardContent className="space-y-2 p-4">
                    <p className="font-semibold">{t("home.sampleWaiting")}</p>
                    <p className="text-sm leading-5 text-muted-foreground">
                      {section.label[lang]}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
