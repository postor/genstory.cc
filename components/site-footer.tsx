"use client";

import { usePathname } from "next/navigation";

import { isImmersiveRoute } from "@/components/site-layout-routes";

export function SiteFooter() {
  const pathname = usePathname();

  if (isImmersiveRoute(pathname)) {
    return null;
  }

  return (
    <footer className="border-t">
      <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-center px-4 py-4 text-center text-sm text-muted-foreground sm:px-6">
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>© 2026 GenStory.cc 版权所有</span>
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
            GitHub 源码
          </a>
        </p>
      </div>
    </footer>
  );
}
