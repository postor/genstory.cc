import type { Metadata } from "next";

import { PublicTypesPage } from "@/components/public-types-page";
import { languageInfo } from "@/lib/platform-i18n";
import {
  normalizePublicLang,
  pageUrl,
  publicPageMetadata,
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

const typesMetadataCopy = {
  zh: {
    title: "浏览器故事与游戏创作工具 - GenStory.cc",
    description: `探索图书、漫画、视觉小说、互动视频和 Phaser 游戏的浏览器创作流程，了解项目结构、预览、备份和导出方式。${siteTrustSummary.zh}`,
  },
  en: {
    title: "Browser Story and Game Creation Tools - GenStory.cc",
    description: `Explore browser workflows for books, comics, visual novels, interactive videos, and Phaser games, including project structure, previews, backups, and export options. ${siteTrustSummary.en}`,
  },
} satisfies Record<PublicLang, { title: string; description: string }>;

const breadcrumbCopy = {
  zh: {
    home: "首页",
    current: "创作类型",
  },
  en: {
    home: "Home",
    current: "Creation types",
  },
} satisfies Record<PublicLang, { home: string; current: string }>;

function typesMetadata(lang: PublicLang) {
  return typesMetadataCopy[lang];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = normalizePublicLang((await params).lang);
  const metadata = typesMetadata(lang);

  return publicPageMetadata({
    lang,
    path: "types",
    title: metadata.title,
    description: metadata.description,
    keywords: siteKeywords[lang],
  });
}

export default async function PublicTypes({ params }: Props) {
  const lang = normalizePublicLang((await params).lang);
  const locale = languageInfo[lang];
  const metadata = typesMetadata(lang);
  const breadcrumb = breadcrumbCopy[lang];
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
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: breadcrumb.home,
          item: pageUrl(lang),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: breadcrumb.current,
          item: pageUrl(lang, "types"),
        },
      ],
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
