import { Suspense } from "react";
import type { Metadata } from "next";

import NewClient from "./new-client";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata({
  path: "projects/new",
  title: "新建作品 - GenStory.cc",
  description:
    "在浏览器中创建图书、漫画、视觉小说、互动视频或 Phaser 游戏项目。",
});

export default function NewPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <p className="text-sm text-muted-foreground">…</p>
        </main>
      }
    >
      <NewClient />
    </Suspense>
  );
}
