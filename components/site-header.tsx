"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverPopup,
  PopoverPositioner,
  PopoverPortal,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { localizedPath, type PublicLang } from "@/lib/seo";
import { isImmersiveRoute } from "@/components/site-layout-routes";

export function SiteHeader() {
  const { lang, setLang } = useLang();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const publicLang = getPublicLang(pathname) ?? lang;
  const labels = headerLabels[publicLang];

  if (isImmersiveRoute(pathname)) {
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
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={localizedPath(publicLang)} className="flex items-center gap-2 font-semibold">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground text-sm">
            G
          </span>
          GenStory.cc
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          <HeaderNavLinks
            navItems={navItems}
            pathname={pathname}
            publicLang={publicLang}
          />
          <HeaderExternalLinks labels={labels} />
          <LanguageSwitcher
            publicLang={publicLang}
            zhHref={zhHref}
            enHref={enHref}
            labels={labels}
            setLang={setLang}
          />
        </nav>

        <Popover open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <PopoverTrigger
            render={
              <Button
                className="sm:hidden"
                variant="ghost"
                size="icon"
                aria-label={labels.menu}
                title={labels.menu}
              />
            }
          >
            <MenuIcon />
          </PopoverTrigger>
          <PopoverPortal>
            <PopoverPositioner side="bottom" align="end" sideOffset={8}>
              <PopoverPopup className="w-56">
                <nav className="flex flex-col gap-1" aria-label={labels.menu}>
                  <HeaderNavLinks
                    navItems={navItems.filter((item) => item.href !== localizedPath(publicLang))}
                    pathname={pathname}
                    publicLang={publicLang}
                    onNavigate={() => setMobileMenuOpen(false)}
                    itemClassName="justify-start"
                  />
                  <HeaderExternalLinks
                    labels={labels}
                    onNavigate={() => setMobileMenuOpen(false)}
                    itemClassName="justify-start"
                    showSourceLabel
                  />
                  <LanguageSwitcher
                    publicLang={publicLang}
                    zhHref={zhHref}
                    enHref={enHref}
                    labels={labels}
                    setLang={setLang}
                    onNavigate={() => setMobileMenuOpen(false)}
                    className="mt-1"
                  />
                </nav>
              </PopoverPopup>
            </PopoverPositioner>
          </PopoverPortal>
        </Popover>
      </div>
    </header>
  );
}

type HeaderLabels = (typeof headerLabels)[PublicLang];

type NavItem = {
  href: string;
  label: string;
};

function HeaderNavLinks({
  navItems,
  pathname,
  publicLang,
  onNavigate,
  itemClassName,
}: {
  navItems: NavItem[];
  pathname: string;
  publicLang: PublicLang;
  onNavigate?: () => void;
  itemClassName?: string;
}) {
  return navItems.map((item) => {
    const active =
      item.href === localizedPath(publicLang)
        ? pathname === "/" || pathname === item.href
        : pathname.startsWith(item.href);
    return (
      <Button
        key={item.href}
        className={itemClassName}
        render={<Link href={item.href} />}
        variant={active ? "secondary" : "ghost"}
        size="sm"
        onClick={onNavigate}
      >
        {item.label}
      </Button>
    );
  });
}

function HeaderExternalLinks({
  labels,
  onNavigate,
  itemClassName,
  showSourceLabel = false,
}: {
  labels: HeaderLabels;
  onNavigate?: () => void;
  itemClassName?: string;
  showSourceLabel?: boolean;
}) {
  return (
    <>
      <Button
        className={itemClassName}
        render={
          <a
            href="https://github.com/postor/genstory.cc"
            target="_blank"
            rel="noreferrer"
          />
        }
        variant="ghost"
        size={showSourceLabel ? "sm" : "icon-sm"}
        aria-label={labels.sourceCode}
        title={labels.sourceCode}
        onClick={onNavigate}
      >
        <GitHubMark />
        {showSourceLabel ? labels.sourceCodeShort : null}
      </Button>

      <iframe
        src="https://github.com/sponsors/postor/button"
        title="Sponsor postor"
        height="32"
        width="114"
        className="block h-8 w-[114px] border-0"
      />

      <Button
        className={itemClassName}
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
        onClick={onNavigate}
      >
        Issue
      </Button>
    </>
  );
}

function LanguageSwitcher({
  publicLang,
  zhHref,
  enHref,
  labels,
  setLang,
  onNavigate,
  className,
}: {
  publicLang: PublicLang;
  zhHref: string;
  enHref: string;
  labels: HeaderLabels;
  setLang: (lang: PublicLang) => void;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn("flex items-center rounded-lg border p-0.5", className)}
      role="group"
      aria-label={labels.language}
    >
      <Button
        render={<Link href={zhHref} />}
        variant={publicLang === "zh" ? "default" : "ghost"}
        size="xs"
        aria-pressed={publicLang === "zh"}
        onClick={() => {
          setLang("zh");
          onNavigate?.();
        }}
      >
        {headerLabels.zh.languageName}
      </Button>
      <Button
        render={<Link href={enHref} />}
        variant={publicLang === "en" ? "default" : "ghost"}
        size="xs"
        aria-pressed={publicLang === "en"}
        onClick={() => {
          setLang("en");
          onNavigate?.();
        }}
      >
        {headerLabels.en.languageName}
      </Button>
    </div>
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
    menu: string;
    sourceCode: string;
    sourceCodeShort: string;
    newIssue: string;
  }
> = {
  zh: {
    home: "首页",
    projects: "项目",
    settings: "设置",
    language: "语言",
    languageName: "中文",
    menu: "打开导航菜单",
    sourceCode: "在 GitHub 上关注和点赞",
    sourceCodeShort: "GitHub",
    newIssue: "提交 Issue",
  },
  en: {
    home: "Home",
    projects: "Projects",
    settings: "Settings",
    language: "Language",
    languageName: "English",
    menu: "Open navigation menu",
    sourceCode: "Follow and star on GitHub",
    sourceCodeShort: "GitHub",
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
