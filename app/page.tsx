"use client";

import { useEffect, useMemo, useState } from "react";
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
import { contentTypes } from "@/lib/content-types";
import { listProjects, type Project } from "@/lib/local-projects";
import { useLang } from "@/lib/i18n";

export default function Home() {
  const { lang, t } = useLang();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    void listProjects().then(setProjects).catch(() => setProjects([]));
  }, []);

  const projectsByType = useMemo(() => {
    const grouped = new Map<string, Project[]>();
    for (const project of projects) {
      const list = grouped.get(project.template) ?? [];
      list.push(project);
      grouped.set(project.template, list);
    }
    return grouped;
  }, [projects]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
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
                className="bg-background text-foreground hover:bg-background/90"
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

      <section aria-label={t("nav.projects")} className="space-y-6">
        {contentTypes.map((section) => {
          const localProjects = projectsByType.get(section.id) ?? [];
          return (
            <section key={section.id} className="border-t pt-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-semibold tracking-tight">{section.label[lang]}</h2>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    {section.description[lang]}
                  </p>
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
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {localProjects.length > 0 ? (
                  localProjects.map((project) => (
                    <Card key={project.id}>
                      <CardHeader className="gap-1">
                        <CardTitle className="truncate text-base">{project.title}</CardTitle>
                        <CardDescription>
                          {t("projects.updatedAt")} {new Date(project.updatedAt).toLocaleString(lang === "zh" ? "zh-CN" : "en-US")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button render={<Link href={`/projects/editor?id=${project.id}`} />} size="sm">
                          {t("projects.open")}
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="border-dashed bg-muted/30">
                    <CardContent className="space-y-3 p-4">
                      <p className="font-semibold">{t("home.emptyCategoryTitle")}</p>
                      <p className="text-sm leading-5 text-muted-foreground">
                        {t("home.emptyCategoryBody")}
                      </p>
                      <Button render={<Link href={`/projects/new?template=${section.id}`} />} size="sm">
                        <BookOpen className="size-4" />
                        {t("home.sectionCreate")}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>
          );
        })}
      </section>
    </main>
  );
}
