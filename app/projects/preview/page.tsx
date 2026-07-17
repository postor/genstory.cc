import { Suspense } from "react";

import PreviewClient from "./preview-client";

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <main className="flex h-[calc(100svh-3.5rem)] items-center justify-center">
          <p className="text-sm text-muted-foreground">…</p>
        </main>
      }
    >
      <PreviewClient />
    </Suspense>
  );
}
