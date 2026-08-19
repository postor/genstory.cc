"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isImmersiveRoute } from "@/components/site-layout-routes";
import { useLang } from "@/lib/i18n";
import { localizedPath, type PublicLang } from "@/lib/seo";

const footerCopy = {
  zh: {
    rights: "版权所有",
    source: "GitHub 源码",
    types: "创作类型",
    showcase: "作品展示",
    guides: "指南",
    faq: "FAQ",
  },
  en: {
    rights: "All rights reserved",
    source: "GitHub source",
    types: "Creation types",
    showcase: "Showcase",
    guides: "Guides",
    faq: "FAQ",
  },
} satisfies Record<PublicLang, Record<string, string>>;

export function SiteFooter() {
  const pathname = usePathname();
  const { lang, t } = useLang();
  const copy = footerCopy[lang];

  if (isImmersiveRoute(pathname)) {
    return null;
  }

  const links = [
    { href: localizedPath(lang, "types"), label: copy.types },
    { href: localizedPath(lang, "showcase"), label: copy.showcase },
    { href: localizedPath(lang, "guides"), label: copy.guides },
    { href: localizedPath(lang, "faq"), label: copy.faq },
    {
      href: "https://github.com/postor/genstory.cc",
      label: copy.source,
      external: true,
    },
    { href: "mailto:postor@gmail.com", label: "postor@gmail.com" },
    { href: localizedPath(lang, "terms"), label: t("legal.terms") },
    { href: localizedPath(lang, "privacy"), label: t("legal.privacy") },
    {
      href: localizedPath(lang, "ai-disclosure"),
      label: t("legal.aiDisclosure"),
    },
  ];

  return (
    <footer className="border-t pb-24 sm:pb-0">
      <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-center px-4 py-4 text-center text-sm text-muted-foreground sm:px-6">
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>
            © 2026 GenStory.cc {copy.rights}
          </span>
          {links.map((link) => (
            <span
              key={`${link.href}-${link.label}`}
              className="inline-flex items-center gap-x-2"
            >
              <span aria-hidden="true">·</span>
              {link.href.startsWith("/") ? (
                <Link
                  className="underline-offset-4 hover:text-foreground hover:underline"
                  href={link.href}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  className="underline-offset-4 hover:text-foreground hover:underline"
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noreferrer" : undefined}
                >
                  {link.label}
                </a>
              )}
            </span>
          ))}
        </p>
      </div>
    </footer>
  );
}
