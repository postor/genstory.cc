import type { MetadataRoute } from "next";

import { pageLanguageAlternates, pageUrl, publicLanguages, publicPageSlugs } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: MetadataRoute.Sitemap = [];

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

  return routes;
}
