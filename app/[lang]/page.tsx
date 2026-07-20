import type { Metadata } from "next";

import { PublicHomePage } from "@/components/public-home-page";
import {
  normalizePublicLang,
  ogImagePath,
  pageLanguageAlternates,
  pageUrl,
  publicLanguages,
  siteFeatureList,
  siteMetadata,

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
  const isZh = lang === "zh";

  return {
    title: isZh ? siteMetadata.zhTitle : siteMetadata.enTitle,
    description: isZh ? siteMetadata.zhDescription : siteMetadata.enDescription,
    other: {
      "content-language": isZh ? "zh-CN" : "en",
    },
    alternates: {
      canonical: pageUrl(lang),
      languages: pageLanguageAlternates(),
    },
    openGraph: {
      type: "website",
      siteName: siteMetadata.name,
      title: isZh ? siteMetadata.zhTitle : siteMetadata.enTitle,
      description: isZh ? siteMetadata.zhDescription : siteMetadata.enDescription,
      url: pageUrl(lang),
      locale: isZh ? "zh_CN" : "en_US",
      alternateLocale: [isZh ? "en_US" : "zh_CN"],
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: "GenStory local-first story creation workspace",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: isZh ? siteMetadata.zhTitle : siteMetadata.enTitle,
      description: isZh ? siteMetadata.zhDescription : siteMetadata.enDescription,
      images: [ogImagePath],
    },
  };
}

export default async function LocalizedHome({ params }: Props) {
  const lang = normalizePublicLang((await params).lang);
  const isZh = lang === "zh";
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteMetadata.name,
      url: pageUrl(lang),
      inLanguage: isZh ? "zh-CN" : "en",
      description: isZh ? siteMetadata.zhDescription : siteMetadata.enDescription,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: siteMetadata.name,
      url: pageUrl(lang),
      applicationCategory: "CreativeWorkApplication",
      operatingSystem: "Web browser",
      inLanguage: isZh ? "zh-CN" : "en",
      description: isZh ? siteMetadata.zhDescription : siteMetadata.enDescription,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: siteFeatureList[lang],
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
