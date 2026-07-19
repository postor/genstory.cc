import { Suspense } from "react";

import EditorClient from "./editor-client";

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
