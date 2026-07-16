import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { OpenRouterMcpProvider } from "@/lib/openrouter-provider/OpenRouterMcpProvider";
import { LangProvider } from "@/lib/i18n";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GenStory",
  description: "Create books, comics, visual novels and interactive videos — locally, no backend.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <OpenRouterMcpProvider>
          <LangProvider>
            <div className="flex min-h-full flex-col">
              <SiteHeader />
              <div className="flex-1">{children}</div>
            </div>
          </LangProvider>
        </OpenRouterMcpProvider>
      </body>
    </html>
  );
}
