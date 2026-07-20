"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Film,
  Gamepad2,
  Image,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { contentTypes } from "@/lib/content-types";
import { useLang } from "@/lib/i18n";
import { languageInfo } from "@/lib/platform-i18n";
import { listProjects, type Project } from "@/lib/local-projects";
import { localizedPath, publicPages, type PublicPageSlug } from "@/lib/seo";

const typeIcons: Record<PublicPageSlug, LucideIcon> = {
  book: BookOpen,
  comic: Image,
  "visual-novel": MessageCircle,
  "interactive-video": Film,
  "phaser-game": Gamepad2,
};

export function LocalProjectSummary() {
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
    <section aria-label={t("nav.projects")} className="space-y-6">
      {contentTypes.map((section) => {
        const localProjects = projectsByType.get(section.id) ?? [];
        const slug = section.id as PublicPageSlug;
        const page = publicPages[slug];
        const Icon = typeIcons[slug];
        const detailHref = localizedPath(lang, slug);
        return (
          <section key={section.id} className="border-t pt-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1.5">
                <h2 className="text-2xl font-semibold tracking-tight">
                  {section.label[lang]}
                </h2>
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
                      <CardTitle className="truncate text-base">
                        {project.title}
                      </CardTitle>
                      <CardDescription>
                        {t("projects.updatedAt")} {" "}
                        {new Date(project.updatedAt).toLocaleString(
                          languageInfo[lang].dateLocale
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        render={<Link href={`/projects/editor?id=${project.id}`} />}
                        size="sm"
                      >
                        {t("projects.open")}
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-muted/20">
                  <CardHeader className="flex-row items-center gap-2 p-4 pb-2">
                    <Icon className="size-5 shrink-0 text-muted-foreground" />
                    <CardTitle className="min-w-0 text-base">
                      <Link href={detailHref} className="hover:underline">
                        {page.kicker[lang]}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 pt-0">
                    <CardDescription className="leading-6">
                      {page.description[lang]}
                    </CardDescription>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        render={<Link href={`/projects/new?template=${section.id}`} />}
                        size="sm"
                      >
                        <BookOpen className="size-4" />
                        {t("home.sectionCreate")}
                      </Button>
                      <Button
                        render={<Link href={detailHref} />}
                        size="sm"
                        variant="outline"
                      >
                        {t("home.sectionDetails")}
                        <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        );
      })}
    </section>
  );
}
