# Project PDF Build Typecheck

## DEBUG REPORT

- **Symptom:** `npm run build` compiled successfully, then failed during the Next.js TypeScript step at `lib/project-pdf.ts` with TS2367: comparing narrowed type `"interactive-video"` against `"comic"`.
- **Root cause:** `buildReadableProjectPdf` now returns early for `book` and `comic`, so the remaining DOM screenshot PDF path can only handle `interactive-video`. A leftover `model.type !== "comic"` guard in that already-narrowed branch became an impossible comparison under strict TypeScript control-flow analysis.
- **Fix:** Removed the unreachable comic guard and always render the title page in the remaining non-book, non-comic PDF path.
- **Evidence:** `node --experimental-strip-types --test lib/project-pdf.test.ts`, `npx tsc --noEmit`, and `npm run build` all pass.
- **Regression test:** The TypeScript check is the regression guard for this impossible branch; existing `lib/project-pdf.test.ts` verifies the comic export still bypasses DOM rendering.
- **Related:** This is adjacent to the comic image PDF path introduced in `lib/project-pdf.ts`; keep future project-type branching aligned with the early returns in `buildReadableProjectPdf`.
- **Status:** DONE
