"use client";

import { ChevronDown, MenuIcon } from "lucide-react";
import Image from "next/image";
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
import { SiteSearch } from "@/components/site-search";

export function SiteHeader() {
  const { lang, setLang } = useLang();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const publicLang = getPublicLang(pathname) ?? lang;
  const labels = headerLabels[publicLang];
  const homeHeader =
    pathname === "/" || pathname === "/zh" || pathname === "/en";
  const darkHeader = true;

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
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b backdrop-blur transition-colors duration-300 lg:fixed lg:inset-x-0",
          homeHeader
            ? "home-header-scroll-surface border-white/10 bg-[#07091f]/90 text-white supports-[backdrop-filter]:bg-[#07091f]/75 lg:border-b lg:border-transparent lg:bg-transparent lg:backdrop-blur-none lg:supports-[backdrop-filter]:bg-transparent"
            : "border-white/10 bg-[#07091f] text-white",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href={localizedPath(publicLang)}
            className="flex items-center gap-2.5 font-semibold text-white"
          >
            <Image
              src="/icon-192.png"
              alt=""
              width={40}
              height={40}
              className="size-8 rounded-lg"
            />
            <span>GenStory.cc</span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            <HeaderNavLinks
              navItems={navItems}
              pathname={pathname}
              publicLang={publicLang}
              homeHeader={darkHeader}
            />
            <div className="hidden items-center gap-1.5 lg:flex">
              <SiteSearch lang={publicLang} homeHeader={darkHeader} />
            </div>
            <HeaderExternalLinks labels={labels} homeHeader={darkHeader} />
            <LanguageSwitcher
              publicLang={publicLang}
              zhHref={zhHref}
              enHref={enHref}
              labels={labels}
              setLang={setLang}
              homeHeader={darkHeader}
            />
          </nav>

          <Popover open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <PopoverTrigger
              render={
                <Button
                  className="sm:hidden text-white hover:bg-white/10 hover:text-white"
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
                <PopoverPopup className="w-56 border-white/10 bg-[#111336] text-white">
                  <div className="mb-2 border-b border-white/10 pb-2">
                    <SiteSearch
                      lang={publicLang}
                      homeHeader={darkHeader}
                      className="w-full"
                    />
                  </div>
                  <nav className="flex flex-col gap-1" aria-label={labels.menu}>
                    <HeaderNavLinks
                      navItems={navItems.filter((item) => item.href !== localizedPath(publicLang))}
                      pathname={pathname}
                      publicLang={publicLang}
                      homeHeader={darkHeader}
                      onNavigate={() => setMobileMenuOpen(false)}
                      itemClassName="justify-start"
                    />
                    <HeaderExternalLinks
                      labels={labels}
                      homeHeader={darkHeader}
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
                      homeHeader={darkHeader}
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
      {!homeHeader ? <div aria-hidden="true" className="hidden h-16 lg:block" /> : null}
    </>
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
  homeHeader,
  onNavigate,
  itemClassName,
}: {
  navItems: NavItem[];
  pathname: string;
  publicLang: PublicLang;
  homeHeader?: boolean;
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
        className={cn(
          itemClassName,
          homeHeader &&
            (active
              ? "bg-white/15 text-white hover:bg-white/20 hover:text-white"
              : "text-white/75 hover:bg-white/10 hover:text-white"),
        )}
        render={<Link href={item.href} />}
        variant={homeHeader ? "ghost" : active ? "secondary" : "ghost"}
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
  homeHeader,
  onNavigate,
  itemClassName,
  showSourceLabel = false,
}: {
  labels: HeaderLabels;
  homeHeader?: boolean;
  onNavigate?: () => void;
  itemClassName?: string;
  showSourceLabel?: boolean;
}) {
  return (
    <Popover>
      <Button
        className={cn(
          itemClassName,
          homeHeader && "text-white/75 hover:bg-white/10 hover:text-white",
        )}
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

      <PopoverTrigger
        render={
          <Button
            className={cn(
              homeHeader && "text-white/75 hover:bg-white/10 hover:text-white",
            )}
            variant="ghost"
            size="icon-sm"
            aria-label={labels.githubMenu}
            title={labels.githubMenu}
          />
        }
      >
        <ChevronDown className="size-4" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverPositioner side="bottom" align="end" sideOffset={8}>
          <PopoverPopup
            className={cn(
              "w-36",
              homeHeader && "border-white/10 bg-[#111336] text-white",
            )}
          >
            <div className="flex flex-col gap-1" role="menu">
              <Button
                className="justify-start"
                render={
                  <a
                    href="https://github.com/postor/genstory.cc"
                    target="_blank"
                    rel="noreferrer"
                  />
                }
                variant="ghost"
                size="sm"
                role="menuitem"
                onClick={onNavigate}
              >
                {labels.star}
              </Button>
              <Button
                className="justify-start"
                render={
                  <a
                    href="https://github.com/sponsors/postor"
                    target="_blank"
                    rel="noreferrer"
                  />
                }
                variant="ghost"
                size="sm"
                role="menuitem"
                onClick={onNavigate}
              >
                {labels.sponsor}
              </Button>
              <Button
                className="justify-start"
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
                role="menuitem"
                onClick={onNavigate}
              >
                {labels.issue}
              </Button>
            </div>
          </PopoverPopup>
        </PopoverPositioner>
      </PopoverPortal>
    </Popover>
  );
}

function LanguageSwitcher({
  publicLang,
  zhHref,
  enHref,
  labels,
  setLang,
  homeHeader,
  onNavigate,
  className,
}: {
  publicLang: PublicLang;
  zhHref: string;
  enHref: string;
  labels: HeaderLabels;
  setLang: (lang: PublicLang) => void;
  homeHeader?: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center rounded-lg border p-0.5",
        homeHeader ? "border-white/15" : "border-border",
        className,
      )}
      role="group"
      aria-label={labels.language}
    >
      <Button
        render={<Link href={zhHref} />}
        variant={homeHeader ? "ghost" : publicLang === "zh" ? "default" : "ghost"}
        className={
          homeHeader
            ? publicLang === "zh"
              ? "bg-white/15 text-white hover:bg-white/20 hover:text-white"
              : "text-white/65 hover:bg-white/10 hover:text-white"
            : undefined
        }
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
        variant={homeHeader ? "ghost" : publicLang === "en" ? "default" : "ghost"}
        className={
          homeHeader
            ? publicLang === "en"
              ? "bg-white/15 text-white hover:bg-white/20 hover:text-white"
              : "text-white/65 hover:bg-white/10 hover:text-white"
            : undefined
        }
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
    search: string;
    sourceCode: string;
    sourceCodeShort: string;
    githubMenu: string;
    star: string;
    sponsor: string;
    issue: string;
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
    search: "搜索项目或内容",
    sourceCode: "在 GitHub 上关注和点赞",
    sourceCodeShort: "GitHub",
    githubMenu: "打开 GitHub 菜单",
    star: "Star",
    sponsor: "Sponsor",
    issue: "Issue",
    newIssue: "提交 Issue",
  },
  en: {
    home: "Home",
    projects: "Projects",
    settings: "Settings",
    language: "Language",
    languageName: "English",
    menu: "Open navigation menu",
    search: "Search projects or content",
    sourceCode: "Follow and star on GitHub",
    sourceCodeShort: "GitHub",
    githubMenu: "Open GitHub menu",
    star: "Star",
    sponsor: "Sponsor",
    issue: "Issue",
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
