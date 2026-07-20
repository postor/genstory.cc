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
          GenStory
        </Link>

        <nav className="flex items-center gap-1 max-[400px]:w-full max-[400px]:justify-end">
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
  { home: string; projects: string; language: string; languageName: string }
> = {
  zh: { home: "首页", projects: "项目", language: "语言", languageName: "中文" },
  en: {
    home: "Home",
    projects: "Projects",
    language: "Language",
    languageName: "English",
  },
};

function getLocalizedHref(pathname: string, nextLang: PublicLang) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "zh" || segments[0] === "en") {
    return `/${[nextLang, ...segments.slice(1)].join("/")}`;
  }
  if (pathname === "/") return localizedPath(nextLang);
  if (pathname.startsWith("/projects")) return pathname;
  return localizedPath(nextLang, pathname);
}
