import { Suspense } from "react";
import type { Metadata } from "next";

import PreviewClient from "./preview-client";
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
    title: "预览作品 - GenStory.cc",
    description: "在浏览器中预览 GenStory.cc 项目内容和可运行作品。",
  },
  en: {
    title: "Preview work - GenStory.cc",
    description: "Preview GenStory.cc project content and runnable works in the browser.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = normalizePublicLang((await params).lang);

  return privatePageMetadata({
    lang,
    path: "projects/preview",
    ...pageSeo[lang],
  });
}

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <main className="flex h-svh items-center justify-center overflow-hidden">
          <p className="text-sm text-muted-foreground">...</p>
        </main>
      }
    >
      <PreviewClient />
    </Suspense>
  );
}
