import type { Metadata } from "next";

import { PublicTypesPage } from "@/components/public-types-page";
import { languageInfo } from "@/lib/platform-i18n";
import {
  normalizePublicLang,
  ogImagePath,
  pageLanguageAlternates,
  pageUrl,
  publicLanguages,
  publicPageSlugs,
  publicPages,
  siteKeywords,
  siteMetadata,
  siteTrustSummary,
  type PublicLang,
} from "@/lib/seo";

type Props = {
  params: Promise<{ lang: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return publicLanguages.map((lang) => ({ lang }));
}

function typesMetadata(lang: PublicLang) {
  return {
    title:
      lang === "zh"
        ? "浏览器故事与游戏创作工具 - GenStory.cc"
        : "Browser Story and Game Creation Tools - GenStory.cc",
    description:
      lang === "zh"
        ? `探索图书、漫画、视觉小说、互动视频和 Phaser 游戏的浏览器创作流程，了解项目结构、预览、备份和导出方式。${siteTrustSummary.zh}`
        : `Explore browser workflows for books, comics, visual novels, interactive videos, and Phaser games, including project structure, previews, backups, and export options. ${siteTrustSummary.en}`,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = normalizePublicLang((await params).lang);
  const locale = languageInfo[lang];
  const metadata = typesMetadata(lang);

  return {
    title: {
      absolute: metadata.title,
    },
    description: metadata.description,
    keywords: siteKeywords[lang],
    other: {
      "content-language": locale.contentLanguage,
    },
    alternates: {
      canonical: pageUrl(lang, "types"),
      languages: pageLanguageAlternates("types"),
    },
    openGraph: {
      type: "website",
      siteName: siteMetadata.name,
      title: metadata.title,
      description: metadata.description,
      url: pageUrl(lang, "types"),
      locale: locale.ogLocale,
      alternateLocale: [locale.alternateOgLocale],
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: metadata.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description,
      images: [ogImagePath],
    },
  };
}

export default async function PublicTypes({ params }: Props) {
  const lang = normalizePublicLang((await params).lang);
  const locale = languageInfo[lang];
  const metadata = typesMetadata(lang);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${pageUrl(lang, "types")}#webpage`,
      url: pageUrl(lang, "types"),
      name: metadata.title,
      description: metadata.description,
      keywords: siteKeywords[lang],
      inLanguage: locale.schemaLanguage,
      isAccessibleForFree: true,
      isPartOf: {
        "@type": "WebSite",
        name: siteMetadata.name,
        url: pageUrl(lang),
      },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: publicPageSlugs.map((slug, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: publicPages[slug].title[lang],
          url: pageUrl(lang, slug),
        })),
      },
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicTypesPage lang={lang} />
    </>
  );
}
