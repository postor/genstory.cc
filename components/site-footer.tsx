"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { isImmersiveRoute } from "@/components/site-layout-routes";
import { useLang } from "@/lib/i18n";
import { localizedPath } from "@/lib/seo";

export function SiteFooter() {
  const pathname = usePathname();
  const { lang, t } = useLang();

  if (isImmersiveRoute(pathname)) {
    return null;
  }

  return (
    <footer className="border-t pb-24 sm:pb-0">
      <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-center px-4 py-4 text-center text-sm text-muted-foreground sm:px-6">
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>
            © 2026 GenStory.cc{" "}
            {lang === "zh" ? "版权所有" : "All rights reserved"}
          </span>
          <span aria-hidden="true">·</span>
          <a
            className="underline-offset-4 hover:text-foreground hover:underline"
            href="mailto:postor@gmail.com"
          >
            postor@gmail.com
          </a>
          <span aria-hidden="true">·</span>
          <a
            className="underline-offset-4 hover:text-foreground hover:underline"
            href="https://github.com/postor/genstory.cc"
            target="_blank"
            rel="noreferrer"
          >
            {lang === "zh" ? "GitHub 源码" : "GitHub source"}
          </a>
          <span aria-hidden="true">·</span>
          <Link
            className="underline-offset-4 hover:text-foreground hover:underline"
            href={localizedPath(lang, "terms")}
          >
            {t("legal.terms")}
          </Link>
          <span aria-hidden="true">·</span>
          <Link
            className="underline-offset-4 hover:text-foreground hover:underline"
            href={localizedPath(lang, "privacy")}
          >
            {t("legal.privacy")}
          </Link>
          <span aria-hidden="true">·</span>
          <Link
            className="underline-offset-4 hover:text-foreground hover:underline"
            href={localizedPath(lang, "ai-disclosure")}
          >
            {t("legal.aiDisclosure")}
          </Link>
        </p>
      </div>
    </footer>
  );
}
