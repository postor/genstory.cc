"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import {
  shouldShowSiteContentBackground,
} from "@/components/site-layout-routes";
import { cn } from "@/lib/utils";

export function SiteContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex-1",
        shouldShowSiteContentBackground(pathname) &&
          "bg-[url('/design/light-bg.png')] bg-right-top bg-no-repeat",
      )}
    >
      {children}
    </div>
  );
}
