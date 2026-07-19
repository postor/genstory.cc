import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { PublicTopicPage } from "@/components/public-topic-page";
import {
  normalizePublicLang,
  ogImagePath,
  pageLanguageAlternates,
  pageUrl,
  publicLanguages,
  publicPageSlugs,
  publicPages,
  type PublicPageSlug,

} from "@/lib/seo";

type Props = {
  params: Promise<{ lang: string; slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return publicLanguages.flatMap((lang) =>
    publicPageSlugs.map((slug) => ({ lang, slug }))
  );
}

function isPublicPageSlug(value: string): value is PublicPageSlug {
  return publicPageSlugs.includes(value as PublicPageSlug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang: rawLang, slug: rawSlug } = await params;
  const lang = normalizePublicLang(rawLang);
  if (!isPublicPageSlug(rawSlug)) notFound();
  const page = publicPages[rawSlug];
  const path = rawSlug;

  return {
    title: page.title[lang],
    description: page.description[lang],
    alternates: {
      canonical: pageUrl(lang, path),
      languages: pageLanguageAlternates(path),
    },
    openGraph: {
      type: "website",
      title: page.title[lang],
      description: page.description[lang],
      url: pageUrl(lang, path),
      locale: lang === "zh" ? "zh_CN" : "en_US",
      alternateLocale: [lang === "zh" ? "en_US" : "zh_CN"],
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: page.title[lang],
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title[lang],
      description: page.description[lang],
      images: [ogImagePath],
    },
  };
}

export default async function PublicTopic({ params }: Props) {
  const { lang: rawLang, slug: rawSlug } = await params;
  const lang = normalizePublicLang(rawLang);
  if (!isPublicPageSlug(rawSlug)) notFound();
  const page = publicPages[rawSlug];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: lang === "zh" ? "zh-CN" : "en",
    mainEntity: page.faqs.map((item) => ({
      "@type": "Question",
      name: item.question[lang],
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer[lang],
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicTopicPage lang={lang} slug={rawSlug} />
    </>
  );
}
