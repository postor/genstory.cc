# Browser File System Projects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every project type use a real browser-selected project directory for editing and preview, with visual novels backed by editable OpenWebGal source files.

**Architecture:** Add a browser-only OPFS adapter and persist only project metadata in IndexedDB. Initialize real browser-private directories from type-specific manifests, enumerate the selected directory for the editor tree, and make the visual-novel compiler parse the files that were actually saved. Keep the existing vendored OpenWebGal iframe as the runtime preview cache.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, browser File System Access API, IndexedDB, CodeMirror, OpenWebGal.

---

### Task 1: Define the file-system domain and metadata-only project record

**Files:**
- Create: `lib/file-system/types.ts`
- Create: `lib/file-system/paths.ts`
- Create: `lib/file-system/browser.ts`
- Modify: `lib/local-projects.ts`
- Test: `lib/file-system/paths.test.ts`

- [ ] **Step 1: Write path and capability tests**

Cover normalized relative paths, rejection of absolute paths and traversal, and
feature detection without touching browser globals during module import.

- [ ] **Step 2: Implement the adapter**

Implement `pickProjectDirectory`, `ensurePermission`, `readTextFile`,
`writeTextFile`, `listProjectFiles`, `fileExists`, and directory creation behind
the adapter. Use `FileSystemDirectoryHandle` and `FileSystemFileHandle`
operations only in client-triggered code.

- [ ] **Step 3: Upgrade IndexedDB records**

Store `directoryHandle`, `template`, `title`, `lang`, timestamps, and
`lastOpenedPath`. Keep a legacy-compatible read path for records that have no
handle, but never use their cached `content` to render a current file tree.

- [ ] **Step 4: Run focused tests**

Run `node --experimental-strip-types --test lib/file-system/paths.test.ts`.

### Task 2: Build real templates for all content types

**Files:**
- Create: `lib/project-templates.ts`
- Create: `lib/project-templates.test.ts`
- Modify: `lib/vn/seed.ts`
- Modify: `docs/vn-browser-plan.md`

- [ ] **Step 1: Define a `ProjectTemplateFile` manifest**

Represent each file as a normalized path, text or binary content, and kind.
Include `AGENTS.md` and `meta.md` for every type.

- [ ] **Step 2: Generate the OpenWebGal visual-novel manifest**

Copy the existing `vn-template/source` structure into an independent manifest,
including the complete chapter/scene files and asset index. Do not use a
title-derived `.md` file.

- [ ] **Step 3: Generate book, comic, and interactive-video manifests**

Create real chapter/page/segment source files and their metadata. Keep
`AGENTS.md` as the AI constraint file and put narrative source in the
type-specific files.

- [ ] **Step 4: Test manifests**

Assert every type includes `AGENTS.md`, `meta.md`, a type-specific source file,
and no path escapes the project root. Assert the visual-novel manifest includes
`chapter-001/scenes/scene-001/script.md` and `stage.yml`.

### Task 3: Initialize and bind projects from the UI

**Files:**
- Modify: `app/projects/new/new-client.tsx`
- Modify: `app/projects/page.tsx`
- Modify: `lib/i18n.tsx`

- [ ] **Step 1: Add deterministic project paths without a parent-directory picker**

The create action opens `navigator.storage.getDirectory()`, creates
`<template>/<projectId>/` inside OPFS, writes the selected manifest, and saves
only the project index after all writes succeed. It
never asks the user to choose a parent directory.

- [ ] **Step 2: Replace JSON import/export as the primary workflow**

Open uses the stored handle. Add “reconnect folder” for legacy/unavailable
records. Keep JSON export only as an explicit legacy backup action.

- [ ] **Step 3: Add visible permission and unavailable states**

Show unsupported-browser, permission-denied, missing-directory, and
initialization-failed messages with retry/reconnect actions.

### Task 4: Make the editor enumerate and write real files

**Files:**
- Create: `lib/project-files.ts`
- Modify: `app/projects/editor/editor-client.tsx`
- Modify: `app/projects/editor/vn-editor.tsx`
- Modify: `components/ui/code-editor.tsx`

- [ ] **Step 1: Replace the project list tree**

Enumerate only the selected directory and build the tree from those entries.
Remove `projects.map(...)` and all virtual VN-file reconstruction from the
navigation path.

- [ ] **Step 2: Add file loading and saving**

Load a selected file from the handle, keep a dirty buffer, and write through the
adapter on Save. Refresh after saves and preserve the selected path.

- [ ] **Step 3: Connect structured VN editing to real files**

Parse the selected scene files into the structured editor, write changed
`meta.md`, `script.md`, and `stage.yml` files, and keep raw files available.

- [ ] **Step 4: Build AI context from disk**

Read `AGENTS.md`, nearest metadata, and selected source file from the directory;
never synthesize the context from unrelated IndexedDB projects.

### Task 5: Preview from the selected directory

**Files:**
- Create: `lib/vn/source-reader.ts`
- Modify: `lib/vn/compile.ts`
- Modify: `app/projects/preview/preview-client.tsx`
- Modify: `lib/vn/export.ts`

- [ ] **Step 1: Read OpenWebGal source files**

Implement a reader that loads visual-novel files from a directory handle and
returns the same scene/asset model currently consumed by the compiler.

- [ ] **Step 2: Compile the saved source**

Make preview and export read the directory first. The preview cache remains
ephemeral and is replaced on every preview start.

- [ ] **Step 3: Enforce save-before-preview**

If the editor has dirty state, save before navigation or show a clear error;
never preview stale IndexedDB data.

### Task 6: Verify the complete browser workflow

**Files:**
- Modify: `README.md`
- Modify: `docs/vn-browser-plan.md`

- [ ] **Step 1: Run unit tests**

Run `node --experimental-strip-types --test lib/**/*.test.ts`.

- [ ] **Step 2: Run static checks**

Run `npm run lint`, `npm run build`, and `git diff --check`.

- [ ] **Step 3: Run browser verification**

Start `npm run dev -- --hostname 127.0.0.1 --port 3000`. Create each project
type in a real directory, reopen it, edit and save a file, then preview the
visual novel and confirm the iframe reflects the saved scene.
