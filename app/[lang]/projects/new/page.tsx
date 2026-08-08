import { Suspense } from "react";
import type { Metadata } from "next";

import NewClient from "./new-client";
import {
  normalizePublicLang,
  privatePageMetadata,
  type PublicLang,
} from "@/lib/seo";

type Props = {
  params: Promise<{ lang: string }>;
};

const pageSeo: Record<PublicLang, { title: string; description: string }> = {
  zh: {
    title: "新建作品 - GenStory.cc",
    description:
      "在浏览器中创建图书、漫画、视觉小说、互动视频或 Phaser 游戏项目。",
  },
  en: {
    title: "New work - GenStory.cc",
    description:
      "Create a book, comic, visual novel, interactive video, or Phaser game project in the browser.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = normalizePublicLang((await params).lang);

  return privatePageMetadata({
    lang,
    path: "projects/new",
    ...pageSeo[lang],
  });
}

export default function NewPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <p className="text-sm text-muted-foreground">...</p>
        </main>
      }
    >
      <NewClient />
    </Suspense>
  );
}
