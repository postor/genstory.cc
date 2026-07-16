"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

export function SiteHeader() {
  const { lang, setLang, t } = useLang();
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: t("nav.home") },
    { href: "/projects", label: t("nav.projects") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground text-sm">
            G
          </span>
          {t("site.name")}
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
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
            aria-label={t("lang.label")}
          >
            <Button
              variant={lang === "zh" ? "default" : "ghost"}
              size="xs"
              aria-pressed={lang === "zh"}
              onClick={() => setLang("zh")}
            >
              {t("lang.zh")}
            </Button>
            <Button
              variant={lang === "en" ? "default" : "ghost"}
              size="xs"
              aria-pressed={lang === "en"}
              onClick={() => setLang("en")}
            >
              {t("lang.en")}
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
