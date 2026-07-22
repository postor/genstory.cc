import type { Metadata } from "next";

import { PublicHomePage } from "@/components/public-home-page";
import { publicHomeCopy } from "@/lib/platform-i18n";
import {
  pageLanguageAlternates,
  pageUrl,
  siteKeywords,
  siteFeatureList,
  siteMetadata,
  siteTrustSummary,
  siteUrl,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    absolute: siteMetadata.zhTitle,
  },
  description: siteMetadata.zhDescription,
  keywords: siteKeywords.zh,
  alternates: {
    canonical: pageUrl("zh"),
    languages: pageLanguageAlternates(),
  },
};

export default function Home() {
  const homeCopy = publicHomeCopy.zh;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteMetadata.name,
      url: pageUrl("zh"),
      inLanguage: "zh-CN",
      description: siteMetadata.zhDescription,
      keywords: siteKeywords.zh,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: siteMetadata.name,
      url: siteUrl,
      applicationCategory: "CreativeWorkApplication",
      operatingSystem: "Web browser",
      inLanguage: "zh-CN",
      description: siteMetadata.zhDescription,
      keywords: siteKeywords.zh,
      codeRepository: "https://github.com/postor/genstory.cc",
      license: "https://github.com/postor/genstory.cc/blob/main/LICENSE",
      slogan: siteTrustSummary.zh,
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: siteFeatureList.zh,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: "zh-CN",
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
      <PublicHomePage lang="zh" />
    </>
  );
}
