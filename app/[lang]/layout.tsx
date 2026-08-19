import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";

import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { SiteContent } from "@/components/site-content";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { OpenRouterMcpProvider } from "@/lib/openrouter-provider/OpenRouterMcpProvider";
import { LangProvider } from "@/lib/i18n";
import { languageInfo, localizedSiteMetadata } from "@/lib/platform-i18n";
import {
  normalizePublicLang,
  ogImagePath,
  pageLanguageAlternates,
  pageUrl,
  publicRobots,
  publicLanguages,
  siteKeywords,
  siteMetadata,
  siteUrl,
} from "@/lib/seo";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const googleAnalyticsId = "G-NLK5ZW73ZW";

type Props = {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return publicLanguages.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = normalizePublicLang((await params).lang);
  const metadata = localizedSiteMetadata[lang];
  const locale = languageInfo[lang];

  return {
    metadataBase: new URL(siteUrl),
    applicationName: siteMetadata.name,
    title: {
      default: metadata.title,
      template: `%s | ${siteMetadata.name}`,
    },
    description: metadata.description,
    keywords: siteKeywords[lang],
    creator: siteMetadata.name,
    manifest: "/manifest.webmanifest",
    robots: publicRobots,
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
          alt: metadata.title,
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

export default async function LocaleLayout({ children, params }: Props) {
  const lang = normalizePublicLang((await params).lang);

  return (
    <html
      lang={languageInfo[lang].htmlLang}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <LangProvider initialLang={lang}>
          <OpenRouterMcpProvider>
            <div className="flex min-h-full flex-col">
              <SiteHeader />
              <SiteContent>{children}</SiteContent>
              <MobileBottomNav />
              <SiteFooter />
            </div>
          </OpenRouterMcpProvider>
        </LangProvider>
      </body>
      <Script
        id="google-analytics-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${googleAnalyticsId}');`}
      </Script>
    </html>
  );
}
