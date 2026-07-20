import { Suspense } from "react";
import type { Metadata } from "next";

import EditorClient from "./editor-client";

export const metadata: Metadata = {
  title: "GenStory",
  robots: {
    index: false,
    follow: false,
  },
};

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
