import { Suspense } from "react";
import type { Metadata } from "next";

import EditorClient from "./editor-client";
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
    title: "编辑作品 - GenStory.cc",
    description: "编辑项目文件、脚本、舞台状态、素材计划和导出设置。",
  },
  en: {
    title: "Edit work - GenStory.cc",
    description:
      "Edit project files, scripts, stage state, asset plans, and export settings.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = normalizePublicLang((await params).lang);

  return privatePageMetadata({
    lang,
    path: "projects/editor",
    ...pageSeo[lang],
  });
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <main className="flex h-svh items-center justify-center overflow-hidden">
          <p className="text-sm text-muted-foreground">...</p>
        </main>
      }
    >
      <EditorClient />
    </Suspense>
  );
}
