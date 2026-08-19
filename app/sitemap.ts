import type { MetadataRoute } from "next";

import { getDocumentationArticles } from "@/lib/guides-faq";
import {
  pageLanguageAlternates,
  pageUrl,
  publicLanguages,
  publicPageSlugs,
  siteUrl,
} from "@/lib/seo";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const routes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.95,
      alternates: {
        languages: {
          ...pageLanguageAlternates(),
          "x-default": siteUrl,
        },
      },
    },
  ];

  for (const lang of publicLanguages) {
    routes.push({
      url: pageUrl(lang),
      lastModified: now,
      changeFrequency: "monthly",
      priority: lang === "zh" ? 1 : 0.9,
      alternates: {
        languages: pageLanguageAlternates(),
      },
    });

    routes.push({
      url: pageUrl(lang, "types"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: {
        languages: pageLanguageAlternates("types"),
      },
    });

    routes.push({
      url: pageUrl(lang, "showcase"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
      alternates: {
        languages: pageLanguageAlternates("showcase"),
      },
    });

    for (const path of ["terms", "privacy", "ai-disclosure"]) {
      routes.push({
        url: pageUrl(lang, path),
        lastModified: now,
        changeFrequency: "yearly",
        priority: 0.3,
        alternates: {
          languages: pageLanguageAlternates(path),
        },
      });
    }

    for (const slug of publicPageSlugs) {
      routes.push({
        url: pageUrl(lang, slug),
        lastModified: now,
        changeFrequency: "monthly",
        priority:
          slug === "visual-novel" ||
          slug === "phaser-game"
            ? 0.9
            : 0.8,
        alternates: {
          languages: pageLanguageAlternates(slug),
        },
      });
    }
  }

  for (const lang of publicLanguages) {
    for (const kind of ["guides", "faq"] as const) {
      routes.push({
        url: pageUrl(lang, kind),
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: {
          languages: pageLanguageAlternates(kind),
        },
      });
    }

    const articles = await getDocumentationArticles(lang);
    for (const article of articles) {
      routes.push({
        url: `${pageUrl(lang, article.kind)}/${article.slugPath}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: {
          languages: pageLanguageAlternates(
            `${article.kind}/${article.slugPath}`,
          ),
        },
      });
    }
  }

  return routes;
}
