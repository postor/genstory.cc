import type { Metadata } from "next";

import { PublicHomePage } from "@/components/public-home-page";
import { pageLanguageAlternates, pageUrl, siteMetadata, siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: siteMetadata.zhTitle,
  description: siteMetadata.zhDescription,
  alternates: {
    canonical: pageUrl("zh"),
    languages: pageLanguageAlternates(),
  },
};

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteMetadata.name,
    url: siteUrl,
    applicationCategory: "CreativeWorkApplication",
    operatingSystem: "Web browser",
    description: siteMetadata.zhDescription,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "本地优先项目文件",
      "图书、漫画、视觉小说和互动视频模板",
      "源码 ZIP 备份和导入",
      "OpenWebGal 预览和导出",
    ],
  };

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
