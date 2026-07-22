"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { localizedPath, type PublicLang } from "@/lib/seo";

export function SiteHeader() {
  const { lang, setLang } = useLang();
  const pathname = usePathname();
  const immersiveRoutes = ["/projects/editor", "/projects/preview"];
  const publicLang = getPublicLang(pathname) ?? lang;
  const labels = headerLabels[publicLang];

  if (immersiveRoutes.some((route) => pathname.startsWith(route))) {
    return null;
  }

  const navItems = [
    { href: localizedPath(publicLang), label: labels.home },
    { href: "/projects", label: labels.projects },
    { href: "/settings", label: labels.settings },
  ];
  const zhHref = getLocalizedHref(pathname, "zh");
  const enHref = getLocalizedHref(pathname, "en");

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:h-14 sm:flex-nowrap sm:py-0 sm:px-6">
        <Link href={localizedPath(publicLang)} className="flex items-center gap-2 font-semibold">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground text-sm">
            G
          </span>
          GenStory.cc
        </Link>

        <nav className="flex items-center gap-1 max-[400px]:w-full max-[400px]:flex-wrap max-[400px]:justify-start">
          {navItems.map((item) => {
            const active =
              item.href === localizedPath(publicLang)
                ? pathname === "/" || pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Button
                key={item.href}
                render={<Link href={item.href} />}
                variant={active ? "secondary" : "ghost"}
                size="sm"
              >
                {item.label}
              </Button>
            );
          })}

          <Button
            render={
              <a
                href="https://github.com/postor/genstory.cc"
                target="_blank"
                rel="noreferrer"
              />
            }
            variant="ghost"
            size="icon-sm"
            aria-label={labels.sourceCode}
            title={labels.sourceCode}
          >
            <GitHubMark />
          </Button>

          <Button
            render={
              <a
                href="https://github.com/postor/genstory.cc/issues/new"
                target="_blank"
                rel="noreferrer"
              />
            }
            variant="ghost"
            size="sm"
            aria-label={labels.newIssue}
            title={labels.newIssue}
          >
            Issue
          </Button>

          <div
            className="ml-1 flex items-center rounded-lg border p-0.5"
            role="group"
            aria-label={labels.language}
          >
            <Button
              render={<Link href={zhHref} />}
              variant={publicLang === "zh" ? "default" : "ghost"}
              size="xs"
              aria-pressed={publicLang === "zh"}
              onClick={() => setLang("zh")}
            >
              {headerLabels.zh.languageName}
            </Button>
            <Button
              render={<Link href={enHref} />}
              variant={publicLang === "en" ? "default" : "ghost"}
              size="xs"
              aria-pressed={publicLang === "en"}
              onClick={() => setLang("en")}
            >
              {headerLabels.en.languageName}
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}

function getPublicLang(pathname: string): PublicLang | null {
  const segment = pathname.split("/")[1];
  return segment === "zh" || segment === "en" ? segment : null;
}

const headerLabels: Record<
  PublicLang,
  {
    home: string;
    projects: string;
    settings: string;
    language: string;
    languageName: string;
    sourceCode: string;
    newIssue: string;
  }
> = {
  zh: {
    home: "首页",
    projects: "项目",
    settings: "设置",
    language: "语言",
    languageName: "中文",
    sourceCode: "在 GitHub 上关注和点赞",
    newIssue: "提交 Issue",
  },
  en: {
    home: "Home",
    projects: "Projects",
    settings: "Settings",
    language: "Language",
    languageName: "English",
    sourceCode: "Follow and star on GitHub",
    newIssue: "Open a new Issue",
  },
};

function GitHubMark() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M6.766 11.328c-2.063-.25-3.516-1.734-3.516-3.656 0-.781.281-1.625.75-2.188-.203-.515-.172-1.609.063-2.062.625-.078 1.468.25 1.968.703.594-.187 1.219-.281 1.985-.281.765 0 1.39.094 1.953.265.484-.437 1.344-.765 1.969-.687.218.422.25 1.515.046 2.047.5.593.766 1.39.766 2.203 0 1.922-1.453 3.375-3.547 3.64.531.344.89 1.094.89 1.954v1.625c0 .468.391.734.86.547C13.781 14.359 16 11.53 16 8.03 16 3.61 12.406 0 7.984 0 3.563 0 0 3.61 0 8.031a7.88 7.88 0 0 0 5.172 7.422c.422.156.828-.125.828-.547v-1.25c-.219.094-.5.156-.75.156-1.031 0-1.64-.562-2.078-1.609-.172-.422-.36-.672-.719-.719-.187-.015-.25-.093-.25-.187 0-.188.313-.328.625-.328.453 0 .844.281 1.25.86.313.452.64.655 1.031.655s.641-.14 1-.5c.266-.265.47-.5.657-.656" />
    </svg>
  );
}

function getLocalizedHref(pathname: string, nextLang: PublicLang) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "zh" || segments[0] === "en") {
    return `/${[nextLang, ...segments.slice(1)].join("/")}`;
  }
  if (pathname === "/") return localizedPath(nextLang);
  if (pathname.startsWith("/projects") || pathname.startsWith("/settings")) return pathname;
  return localizedPath(nextLang, pathname);
}
