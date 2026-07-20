import type { Metadata } from "next";

import { PublicHomePage } from "@/components/public-home-page";
import {
  pageLanguageAlternates,
  pageUrl,
  siteFeatureList,
  siteMetadata,
  siteUrl,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: siteMetadata.zhTitle,
  description: siteMetadata.zhDescription,
  alternates: {
    canonical: pageUrl("zh"),
    languages: pageLanguageAlternates(),
  },
};

export default function Home() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteMetadata.name,
      url: pageUrl("zh"),
      inLanguage: "zh-CN",
      description: siteMetadata.zhDescription,
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
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: siteFeatureList.zh,
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
