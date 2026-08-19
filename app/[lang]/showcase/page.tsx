import type { Metadata } from "next";

import { PublicShowcasePage } from "@/components/public-showcase-page";
import {
  publicBookCaseProject,
  publicComicCaseProject,
  publicPhaserGameCaseProject,
} from "@/lib/ai-prompt-examples";
import { contentTypes } from "@/lib/content-types";
import { languageInfo } from "@/lib/platform-i18n";
import {
  normalizePublicLang,
  pageUrl,
  publicPageMetadata,
  siteKeywords,
  siteMetadata,
  type PublicLang,
} from "@/lib/seo";

type Props = {
  params: Promise<{ lang: string }>;
};

const showcaseMetadata: Record<
  PublicLang,
  {
    title: string;
    description: string;
    keywords: string[];
    breadcrumb: string;
    home: string;
  }
> = {
  zh: {
    title: "作品展示、模板源码与案例项目 - GenStory.cc",
    description:
      "浏览 GenStory.cc 的模板和示例项目，预览、试玩或下载源码继续编辑。",
    keywords: ["作品展示", "模板源码", "案例项目", "源码 ZIP", "项目导出"],
    breadcrumb: "作品展示",
    home: "首页",
  },
  en: {
    title: "Showcase, Template Source, and Case Projects - GenStory.cc",
    description:
      "Browse GenStory.cc templates and example projects to preview, play, or download the source for further editing.",
    keywords: [
      "GenStory.cc showcase",
      "template source",
      "case project",
      "source ZIP",
      "project export",
    ],
    breadcrumb: "Showcase",
    home: "Home",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = normalizePublicLang((await params).lang);
  const metadata = showcaseMetadata[lang];

  return publicPageMetadata({
    lang,
    path: "showcase",
    title: metadata.title,
    description: metadata.description,
    keywords: [...siteKeywords[lang], ...metadata.keywords],
  });
}

export default async function Showcase({ params }: Props) {
  const lang = normalizePublicLang((await params).lang);
  const locale = languageInfo[lang];
  const metadata = showcaseMetadata[lang];
  const cases = [
    publicBookCaseProject,
    publicComicCaseProject,
    publicPhaserGameCaseProject,
  ];
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${pageUrl(lang, "showcase")}#webpage`,
      url: pageUrl(lang, "showcase"),
      name: metadata.title,
      description: metadata.description,
      inLanguage: locale.schemaLanguage,
      isAccessibleForFree: true,
      isPartOf: {
        "@type": "WebSite",
        name: siteMetadata.name,
        url: pageUrl(lang),
      },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: [
          ...contentTypes.map((type, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: type.label[lang],
            description: type.description[lang],
          })),
          ...cases.map((project, index) => ({
            "@type": "ListItem",
            position: contentTypes.length + index + 1,
            name: project.title[lang],
            description: project.description[lang],
            url: `${pageUrl(lang, "showcase")}#showcase-projects`,
          })),
        ],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: metadata.home,
          item: pageUrl(lang),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: metadata.breadcrumb,
          item: pageUrl(lang, "showcase"),
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
      <PublicShowcasePage lang={lang} />
    </>
  );
}
