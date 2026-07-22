import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { OpenRouterMcpProvider } from "@/lib/openrouter-provider/OpenRouterMcpProvider";
import { LangProvider } from "@/lib/i18n";
import { SiteHeader } from "@/components/site-header";
import {
  ogImagePath,
  pageLanguageAlternates,
  siteMetadata,
  siteUrl,
} from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const googleAnalyticsId = "G-NLK5ZW73ZW";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteMetadata.name,
  title: {
    default: siteMetadata.zhTitle,
    template: `%s | ${siteMetadata.name}`,
  },
  description: siteMetadata.zhDescription,
  keywords: siteMetadata.keywords,
  creator: siteMetadata.name,
  alternates: {
    canonical: "/zh",
    languages: pageLanguageAlternates(),
  },
  openGraph: {
    type: "website",
    siteName: siteMetadata.name,
    title: siteMetadata.zhTitle,
    description: siteMetadata.zhDescription,
    url: siteUrl,
    locale: "zh_CN",
    alternateLocale: ["en_US"],
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
    title: siteMetadata.zhTitle,
    description: siteMetadata.zhDescription,
    images: [ogImagePath],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <LangProvider>
          <OpenRouterMcpProvider>
            <div className="flex min-h-full flex-col">
              <SiteHeader />
              <div className="flex-1">{children}</div>
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
