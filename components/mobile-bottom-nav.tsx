"use client";

import { FolderOpen, Home, Images, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  isPublicLang,
  localizedPath,
  pathnameWithoutPublicLang,
  publicPageSlugs,
  type PublicLang,
} from "@/lib/seo";
import {
  isDocumentationRoute,
  isImmersiveRoute,
} from "@/components/site-layout-routes";

const labels = {
  zh: {
    nav: "移动端导航",
    home: "首页",
    projects: "项目",
    showcase: "展示",
    explore: "探索",
  },
  en: {
    nav: "Mobile navigation",
    home: "Home",
    projects: "Projects",
    showcase: "Showcase",
    explore: "Explore",
  },

} satisfies Record<PublicLang, Record<string, string>>;

export function MobileBottomNav() {
  const pathname = usePathname();
  const { lang } = useLang();
  const publicLang = getPublicLang(pathname) ?? lang;
  const copy = labels[publicLang];

  if (isImmersiveRoute(pathname) || isDocumentationRoute(pathname)) {
    return null;
  }

  return (
    <nav
      aria-label={copy.nav}
      className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-4 rounded-2xl border border-[#e8e2ff] bg-white/95 p-1.5 text-xs shadow-[0_14px_35px_rgba(48,36,91,0.16)] backdrop-blur sm:hidden"
    >
      <MobileNavLink
        href={localizedPath(publicLang)}
        label={copy.home}
        icon={Home}
        active={isHomePath(pathname, publicLang)}
      />
      <MobileNavLink
        href={localizedPath(publicLang, "projects")}
        label={copy.projects}
        icon={FolderOpen}
        active={isProjectsPath(pathname)}
      />
      <MobileNavLink
        href={localizedPath(publicLang, "showcase")}
        label={copy.showcase}
        icon={Images}
        active={isShowcasePath(pathname)}
      />
      <MobileNavLink
        href={localizedPath(publicLang, "types")}
        label={copy.explore}
        icon={LayoutGrid}
        active={isExplorePath(pathname)}
      />
    </nav>
  );
}

function MobileNavLink({
  href,
  label,
  icon: Icon,
  active = false,

}: {
  href: string;
  label: string;
  icon: typeof Home;
  active?: boolean;

}) {
  const className = cn(
    "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl font-medium transition-colors",
    active ? "bg-[#eee8ff] text-[#7148db]" : "text-[#8986a3] hover:bg-[#f7f4ff]",
  );

  return (
    <Link href={href} className={className}>
      <Icon className="size-4" aria-hidden="true" />
      <span className="max-w-full truncate">{label}</span>
    </Link>
  );
}

function getPublicLang(pathname: string): PublicLang | null {
  const segment = pathname.split("/")[1];
  return isPublicLang(segment) ? segment : null;
}

function isHomePath(pathname: string, lang: PublicLang) {
  return pathname === "/" || pathname === localizedPath(lang);
}

function isExplorePath(pathname: string) {
  const segments = pathnameWithoutPublicLang(pathname).split("/").filter(Boolean);

  return (
    segments[0] === "types" ||
    publicPageSlugs.includes(segments[0] as (typeof publicPageSlugs)[number])
  );
}

function isProjectsPath(pathname: string) {
  const unlocalizedPathname = pathnameWithoutPublicLang(pathname);
  return (
    unlocalizedPathname === "/projects" ||
    unlocalizedPathname.startsWith("/projects/")
  );
}

function isShowcasePath(pathname: string) {
  const unlocalizedPathname = pathnameWithoutPublicLang(pathname);
  return (
    unlocalizedPathname === "/showcase" ||
    unlocalizedPathname.startsWith("/showcase/")
  );
}
