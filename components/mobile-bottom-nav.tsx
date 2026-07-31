"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { localizedPath, type PublicLang } from "@/lib/seo";
import { isImmersiveRoute } from "@/components/site-layout-routes";

const labels = {
  zh: {
    nav: "移动端导航",
    home: "首页",
    projects: "项目",
    explore: "探索",
    sponsor: "Sponsor",
  },
  en: {
    nav: "Mobile navigation",
    home: "Home",
    projects: "Projects",
    explore: "Explore",
    sponsor: "Sponsor",
  },

} satisfies Record<PublicLang, Record<string, string>>;

const sponsorHref = "https://github.com/sponsors/postor";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { lang } = useLang();
  const publicLang = getPublicLang(pathname) ?? lang;
  const copy = labels[publicLang];

  if (isImmersiveRoute(pathname)) {
    return null;
  }

  return (
    <nav
      aria-label={copy.nav}
      className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 rounded-2xl border border-[#e8e2ff] bg-white/95 p-1.5 text-xs shadow-[0_14px_35px_rgba(48,36,91,0.16)] backdrop-blur sm:hidden"
    >
      <MobileNavLink href={localizedPath(publicLang)} label={copy.home} active={isHomePath(pathname, publicLang)} />
      <MobileNavLink href="/projects" label={copy.projects} active={pathname.startsWith("/projects")} />
      <MobileNavLink href={localizedPath(publicLang, "types")} label={copy.explore} active={isExplorePath(pathname)} />
      <MobileNavLink href={sponsorHref} label={copy.sponsor} external />
    </nav>
  );
}

function MobileNavLink({
  href,
  label,
  active = false,
  external = false,

}: {
  href: string;
  label: string;
  active?: boolean;
  external?: boolean;

}) {
  const className = cn(
    "flex min-h-11 items-center justify-center rounded-xl font-medium transition-colors",
    active ? "bg-[#eee8ff] text-[#7148db]" : "text-[#8986a3] hover:bg-[#f7f4ff]",
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

function getPublicLang(pathname: string): PublicLang | null {
  const segment = pathname.split("/")[1];
  return segment === "zh" || segment === "en" ? segment : null;
}

function isHomePath(pathname: string, lang: PublicLang) {
  return pathname === "/" || pathname === localizedPath(lang);
}

function isExplorePath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const firstContentSegment = segments[0] === "zh" || segments[0] === "en" ? segments[1] : segments[0];

  return firstContentSegment === "types";
}
