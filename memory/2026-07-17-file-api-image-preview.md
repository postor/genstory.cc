# DEBUG REPORT: File API Image Preview

- **Date:** 2026-07-17
- **Symptom:** File API images rendered as broken images in both the editor's direct binary preview and Markdown-associated preview.
- **Root cause:** Direct previews revoked the active `blob:` URL inside a React state updater. In development, React Strict Mode can invoke updater functions more than once, so the freshly created object URL could be revoked before the `<img>` used it. Markdown previews also rendered project-relative image paths directly, so paths such as `../../assets/illustrations/illus_forest.png` resolved against the app route instead of the OPFS project file.
- **Fix:** Move object URL revocation out of the direct-preview state updater, add Markdown image source collection/path resolution, and map project-relative Markdown image sources to OPFS-backed object URLs before rendering.
- **Changed files:** `app/projects/editor/editor-client.tsx`, `components/ui/code-editor.tsx`, `lib/markdown/image-paths.ts`, `lib/markdown/image-paths.test.ts`.
- **Verification:** `node --test lib\\markdown\\image-paths.test.ts lib\\project-import.test.ts` passed 5/5 tests. `npm run lint` completed with 0 errors and 5 pre-existing warnings in unrelated chatbox files. `npm run build` completed successfully. `git diff --check` reported no whitespace errors, only line-ending warnings for existing working-tree files.
- **Rendered validation:** The dev server was already running at `http://127.0.0.1:3000`, and `Invoke-WebRequest http://127.0.0.1:3000/projects` returned HTTP 200. The gstack Browser binary and local Playwright packages were not available in this workspace, so browser-level screenshot/interaction validation could not be completed without adding tooling.
- **Status:** DONE_WITH_CONCERNS. Code-level root cause is fixed and build/tests pass; full OPFS browser interaction remains unverified because browser automation tooling is absent.
