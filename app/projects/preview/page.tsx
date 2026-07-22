import { Suspense } from "react";
import type { Metadata } from "next";

import PreviewClient from "./preview-client";

export const metadata: Metadata = {
  title: {
    absolute: "Preview - GenStory.cc",
  },
  robots: {
    index: false,
    follow: false,
  },
};

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
