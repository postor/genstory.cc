"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FolderPlus, Upload, WandSparkles } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLang } from "@/lib/i18n";
import { listProjects } from "@/lib/local-projects";
import { localizedPath } from "@/lib/seo";

type QuickStartCopy = {
  title: string;
  templateTitle: string;
  templateBody: string;
  importTitle: string;
  importBody: string;
  assistantTitle: string;
  assistantBody: string;
};

export function LocalProjectQuickStartCard({
  copy,
}: {
  copy: QuickStartCopy;
}) {
  const { lang } = useLang();
  const [hasProjects, setHasProjects] = useState<boolean>();

  useEffect(() => {
    let cancelled = false;

    void listProjects()
      .then((projects) => {
        if (!cancelled) setHasProjects(projects.length > 0);
      })
      .catch(() => {
        if (!cancelled) setHasProjects(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!hasProjects) return null;

  return (
    <Card className="border-[#e8e3ff] bg-white/85 shadow-[0_18px_45px_rgba(88,67,166,0.08)]">
      <CardHeader className="px-5 pb-3 pt-5">
        <CardTitle className="text-lg">
          {copy.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="divide-y divide-[#f0edff]">
          <QuickStartItem
            icon={FolderPlus}
            title={copy.templateTitle}
            body={copy.templateBody}
            href={localizedPath(lang, "projects/new")}
          />
          <QuickStartItem
            icon={Upload}
            title={copy.importTitle}
            body={copy.importBody}
            href={localizedPath(lang, "projects")}
          />
          <QuickStartItem
            icon={WandSparkles}
            title={copy.assistantTitle}
            body={copy.assistantBody}
            href={localizedPath(lang, "settings")}
          />
        </div>
      </CardContent>
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
