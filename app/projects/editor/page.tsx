import { Suspense } from "react";

import EditorClient from "./editor-client";

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <p className="text-sm text-muted-foreground">…</p>
        </main>
      }
    >
      <EditorClient />
    </Suspense>
  );
}
