import type { Metadata } from "next";

import { PublicHomePage } from "@/components/public-home-page";
import {
  languageInfo,
  localizedSiteMetadata,
  publicHomeCopy,
} from "@/lib/platform-i18n";
import {
  normalizePublicLang,
  pageUrl,
  publicPageMetadata,
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
  const metadata = localizedSiteMetadata[lang];

  return publicPageMetadata({
    lang,
    title: metadata.title,
    description: metadata.description,
    keywords: siteKeywords[lang],
  });
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
