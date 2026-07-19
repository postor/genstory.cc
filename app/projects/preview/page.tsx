import { Suspense } from "react";

import PreviewClient from "./preview-client";

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
