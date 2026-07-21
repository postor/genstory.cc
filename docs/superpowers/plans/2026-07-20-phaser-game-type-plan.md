# Game Type Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with verification checkpoints.

**Goal:** Add a complete `phaser-game` project type whose browser template runs a menu scene and a playable test-game scene, while leaving image/audio generation as explicit AI-ready prompts.

**Architecture:** Register `phaser-game` in the existing content-type/template/OPFS pipeline. Store an editable, plain HTML/JavaScript Phaser source tree with no generated media; use a locally synchronized Phaser runtime for browser preview and standalone export. Keep the editor/chat working on the real files and add type-specific import, preview, export, and bilingual guidance.

**Tech Stack:** Next.js 16 App Router static export, React 19, TypeScript, OPFS, Phaser 3 runtime, native Node test runner, ZIP store helper.

---

### Task 1: Define failing Phaser contracts

**Files:**
- Create: `lib/phaser/preview.test.ts`
- Modify: `lib/project-templates.test.ts`
- Modify: `lib/project-import.test.ts`

- [ ] Assert the template exposes `index.html`, `src/main.js`, `src/scenes/menu-scene.js`, `src/scenes/test-game-scene.js`, and `assets/index.yml`, with no binary audio/image files and prompts for both.
- [ ] Assert the preview document embeds the two scene scripts, points at the local `/phaser/phaser.min.js`, and preserves the playable scene identifiers.
- [ ] Assert a source ZIP containing Phaser paths infers `phaser-game`.
- [ ] Run the focused tests and record the expected failures before implementation.

### Task 2: Register the type and source template

**Files:**
- Modify: `lib/content-types.ts`
- Modify: `lib/project-naming.ts`
- Modify: `lib/project-templates.ts`
- Create: `public/templates/zh/phaser-game.md`
- Create: `public/templates/en/phaser-game.md`
- Modify: `lib/project-templates.test.ts`

- [ ] Add the bilingual enabled content type and default title prefix.
- [ ] Generate a real editable Phaser source tree with metadata, README, HTML entry, config, menu scene, test game scene, and asset prompt index.
- [ ] Make the menu scene start `TestGameScene`; make the test scene support movement, jumping, and returning to the menu without image/audio dependencies.
- [ ] Put future image/audio prompts in `assets/index.yml` and comments in the relevant scene files.

### Task 3: Synchronize the Phaser runtime

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `scripts/sync-phaser.mjs`
- Modify: `.gitignore`

- [ ] Add Phaser as an application dependency and a sync script that copies its browser runtime to ignored `public/phaser/`.
- [ ] Run the sync before `dev` and `build` so preview and export always use the installed runtime.

### Task 4: Implement preview and standalone export

**Files:**
- Create: `lib/phaser/source-reader.ts`
- Create: `lib/phaser/preview.ts`
- Create: `lib/phaser/export.ts`
- Create: `lib/phaser/preview.test.ts`
- Modify: `app/projects/preview/preview-client.tsx`
- Modify: `app/projects/editor/editor-client.tsx`

- [ ] Read real OPFS HTML/JavaScript files and build a safe `srcDoc` document that injects local Phaser and source scripts in entry order.
- [ ] Export all project files plus `vendor/phaser.min.js`, rewriting the entry runtime reference for a self-contained ZIP.
- [ ] Keep visual-novel preview/export behavior unchanged and route only `phaser-game` through the Phaser runtime path.

### Task 5: Complete application integration and guidance

**Files:**
- Modify: `lib/project-import.ts`
- Modify: `lib/project-source.ts`
- Modify: `lib/i18n.tsx`
- Modify: `components/public-home-page.tsx`
- Modify: `lib/seo.ts`
- Create: `docs/phaser-browser-plan.md`

- [ ] Add import inference, generic preview type exclusions, bilingual UI copy, home-page copy, public Phaser guidance, and browser workflow documentation.
- [ ] Ensure editor/chat file tooling can discover and edit all Phaser source files through the existing OPFS tree.

### Task 6: Verify the complete workflow

- [ ] Run Phaser-focused native tests and the complete native test suite.
- [ ] Run `npm run lint`, `npm run sync-phaser`, `npm run build`, and `git diff --check`.
- [ ] Audit every requirement: type selection, OPFS initialization, menu→test-game transition, no generated media, prompts/comments, preview, export/import, and bilingual guidance.
