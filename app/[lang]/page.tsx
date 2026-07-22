import type { Metadata } from "next";

import { PublicHomePage } from "@/components/public-home-page";
import {
  languageInfo,
  localizedSiteMetadata,
  publicHomeCopy,
} from "@/lib/platform-i18n";
import {
  normalizePublicLang,
  ogImagePath,
  pageLanguageAlternates,
  pageUrl,
  publicLanguages,
  siteKeywords,
  siteFeatureList,
  siteMetadata,
  siteTrustSummary,

} from "@/lib/seo";

type Props = {
  params: Promise<{ lang: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return publicLanguages.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = normalizePublicLang((await params).lang);
  const locale = languageInfo[lang];
  const metadata = localizedSiteMetadata[lang];

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
      canonical: pageUrl(lang),
      languages: pageLanguageAlternates(),
    },
    openGraph: {
      type: "website",
      siteName: siteMetadata.name,
      title: metadata.title,
      description: metadata.description,
      url: pageUrl(lang),
      locale: locale.ogLocale,
      alternateLocale: [locale.alternateOgLocale],
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: "GenStory.cc local-first story creation workspace",
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

export default async function LocalizedHome({ params }: Props) {
  const lang = normalizePublicLang((await params).lang);
  const locale = languageInfo[lang];
  const metadata = localizedSiteMetadata[lang];
  const homeCopy = publicHomeCopy[lang];
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteMetadata.name,
      url: pageUrl(lang),
      inLanguage: locale.schemaLanguage,
      description: metadata.description,
      keywords: siteKeywords[lang],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: siteMetadata.name,
      url: pageUrl(lang),
      applicationCategory: "CreativeWorkApplication",
      operatingSystem: "Web browser",
      inLanguage: locale.schemaLanguage,
      description: metadata.description,
      keywords: siteKeywords[lang],
      codeRepository: "https://github.com/postor/genstory.cc",
      license: "https://github.com/postor/genstory.cc/blob/main/LICENSE",
      slogan: siteTrustSummary[lang],
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: siteFeatureList[lang],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: locale.schemaLanguage,
      mainEntity: homeCopy.faqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicHomePage lang={lang} />
    </>
  );
}
