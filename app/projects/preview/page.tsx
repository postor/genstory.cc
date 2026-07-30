import { Suspense } from "react";
import type { Metadata } from "next";

import PreviewClient from "./preview-client";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata({
  path: "projects/preview",
  title: "预览作品 - GenStory.cc",
  description: "在浏览器中预览 GenStory.cc 项目内容。",
});

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <main className="flex h-svh items-center justify-center overflow-hidden">
          <p className="text-sm text-muted-foreground">…</p>
        </main>
      }
    >
      <PreviewClient />
    </Suspense>
  );
}
