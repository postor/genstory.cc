import type { Metadata } from "next";
import Link from "next/link";

import {
  ogImagePath,
  pageLanguageAlternates,
  publicRobots,
  siteMetadata,
  siteUrl,
} from "@/lib/seo";

const title = "GenStory.cc language entry";
const description =
  "Choose the Chinese or English GenStory.cc entry. 选择 GenStory.cc 中文或英文入口。";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteMetadata.name,
  title: { absolute: title },
  description,
  manifest: "/manifest.webmanifest",
  robots: publicRobots,
  alternates: {
    canonical: siteUrl,
    languages: {
      ...pageLanguageAlternates(),
      "x-default": siteUrl,
    },
  },
  openGraph: {
    type: "website",
    siteName: siteMetadata.name,
    title,
    description,
    url: siteUrl,
    locale: "zh_CN",
    alternateLocale: ["en_US"],
    images: [
      {
        url: ogImagePath,
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImagePath],
  },
};

export default function RootLanguageEntry() {
  const redirectScript = `(() => {
  const preferred = navigator.language?.toLowerCase().startsWith("en") ? "en" : "zh";
  window.location.replace("/" + preferred + window.location.search + window.location.hash);
})();`;

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 text-center text-foreground">
      <script dangerouslySetInnerHTML={{ __html: redirectScript }} />
      <div className="max-w-md">
        <p className="text-sm text-muted-foreground">Redirecting to GenStory.cc</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-normal">
          Choose your language
        </h1>
        <nav
          className="mt-6 flex justify-center gap-3"
          aria-label="GenStory.cc language entries"
        >
          <Link
            href="/zh"
            hrefLang="zh-CN"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            中文
          </Link>
          <Link
            href="/en"
            hrefLang="en"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            English
          </Link>
        </nav>
      </div>
    </main>
  );
}
