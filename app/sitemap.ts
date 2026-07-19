import type { MetadataRoute } from "next";

import { pageLanguageAlternates, pageUrl, publicLanguages, publicPageSlugs, siteUrl } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 1,
      alternates: {
        languages: pageLanguageAlternates(),
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

    for (const slug of publicPageSlugs) {
      routes.push({
        url: pageUrl(lang, slug),
        lastModified: now,
        changeFrequency: "monthly",
        priority: slug === "visual-novel" || slug === "openwebgal" ? 0.9 : 0.8,
        alternates: {
          languages: pageLanguageAlternates(slug),
        },
      });
    }
  }

  return routes;
}
