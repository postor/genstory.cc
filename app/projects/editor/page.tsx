import { Suspense } from "react";
import type { Metadata } from "next";

import EditorClient from "./editor-client";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata({
  path: "projects/editor",
  title: "编辑作品 - GenStory.cc",
  description: "编辑项目文件、脚本、舞台状态和素材计划。",
});

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <main className="flex h-svh items-center justify-center overflow-hidden">
          <p className="text-sm text-muted-foreground">…</p>
        </main>
      }
    >
      <EditorClient />
    </Suspense>
  );
}
