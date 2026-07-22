import { Suspense } from "react";
import type { Metadata } from "next";

import NewClient from "./new-client";

export const metadata: Metadata = {
  title: {
    absolute: "New Project - GenStory.cc",
  },
  robots: {
    index: false,
    follow: false,
  },
};

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
