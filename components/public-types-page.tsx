import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { languageInfo } from "@/lib/platform-i18n";
import {
  localizedPath,
  publicPageSlugs,
  publicPages,
  type PublicLang,
} from "@/lib/seo";

export function PublicTypesPage({ lang }: { lang: PublicLang }) {
  const copy = typesPageCopy[lang];

  return (
    <main
      lang={languageInfo[lang].htmlLang}
      className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6"
    >
      <section className="border-b pb-10">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          {copy.heading}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
          {copy.intro}
        </p>
      </section>

      <nav aria-label={copy.navLabel} className="grid gap-4 py-10 sm:grid-cols-2">
        {publicPageSlugs.map((slug) => {
          const page = publicPages[slug];
          return (
            <Link
              key={slug}
              href={localizedPath(lang, slug)}
              className="group block rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Card className="h-full transition-colors group-hover:border-primary/50 group-hover:bg-muted/30">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-4">
                    <span>{page.kicker[lang]}</span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {page.description[lang]}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </nav>
    </main>
  );
}

const typesPageCopy: Record<
  PublicLang,
  { heading: string; intro: string; navLabel: string }
> = {
  zh: {
    heading: "探索浏览器里的故事与游戏创作工具",
    intro:
      "选择一种创作类型，了解 GenStory.cc 如何组织项目文件、素材、预览和导出。每个入口都说明真实能力和适合的创作阶段。",
    navLabel: "创作类型说明",
  },
  en: {
    heading: "Explore browser story and game creation tools",
    intro:
      "Choose a creation type to see how GenStory.cc organizes project files, assets, previews, and export options, with clear notes on what each workflow is best for.",
    navLabel: "Creation type guides",
  },
};
