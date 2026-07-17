# OpenWebGal Project Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a new visual-novel project start from the OpenWebGal source template, show its project files and chapter scenes, allow editing through the structured editor and AI context, and keep preview/export working.

**Architecture:** Use the real browser File System Access project directory as
the single source of truth. New projects are initialized by writing the
OpenWebGal template plus `AGENTS.md` into
`<opfs>/<template>/<projectId>/`. The editor enumerates and writes those
files directly; `VNProject` is only a temporary parsed view used by the
structured editor, preview, and export. Keep compiled OpenWebGal output in
`lib/vn/compile.ts`, and make preview read the same saved source files.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, shadcn/ui/Tailwind, IndexedDB, OpenWebGal vendored engine.

---

### Task 1: Define the virtual OpenWebGal source tree

**Files:**
- Create: `lib/vn/project-files.ts`
- Create: `lib/vn/project-files.test.ts`

- [ ] **Step 1: Write the failing test**

Add Node's built-in test coverage for the expected default tree:

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { seedRedRidingHood } from "./seed.ts";
import { buildVNProjectFiles } from "./project-files.ts";

test("builds an OpenWebGal source tree without a title.md project file", () => {
  const vn = seedRedRidingHood();
  const files = buildVNProjectFiles(vn, "# AGENTS.md\n\nKeep canon consistent.");
  const paths = files.map((file) => file.path);

  assert.deepEqual(paths.slice(0, 4), [
    "AGENTS.md",
    "meta.md",
    "assets/index.yml",
    "chapter-001/meta.md",
  ]);
  assert.ok(paths.includes("chapter-001/scenes/scene-001/script.md"));
  assert.ok(paths.includes("chapter-001/scenes/scene-001/stage.yml"));
  assert.ok(!paths.some((path) => path.endsWith("小红帽.md")));
});

test("uses structured scene data as the editable source", () => {
  const vn = seedRedRidingHood();
  const files = buildVNProjectFiles(vn, "# AGENTS.md");
  const script = files.find(
    (file) => file.path === "chapter-001/scenes/scene-001/script.md"
  );
  assert.match(script?.content ?? "", /小红帽: 终于可以出门啦/);
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `node --experimental-strip-types --test lib/vn/project-files.test.ts`

Expected: FAIL because `lib/vn/project-files.ts` does not exist.

- [ ] **Step 3: Implement the file-tree builder**

Create `VNProjectFile` and `buildVNProjectFiles(vn, agents)` that returns:

```ts
type VNProjectFile = {
  path: string;
  content: string;
  kind: "constraint" | "metadata" | "asset-index" | "scene-meta" | "stage" | "script";
  sceneId?: string;
};
```

Generate `AGENTS.md`, `meta.md`, `assets/index.yml`, each chapter's `meta.md`, and each scene's `meta.md`, `stage.yml`, and `script.md`. Use logical asset IDs in generated YAML/stage content; do not expose source file paths as identifiers.

- [ ] **Step 4: Run the test and verify it passes**

Run: `node --experimental-strip-types --test lib/vn/project-files.test.ts`

Expected: PASS with 2 tests.

### Task 2: Make new visual-novel projects seed the complete source template

**Files:**
- Modify: `lib/vn/seed.ts`
- Modify: `app/projects/new/new-client.tsx`
- Modify: `lib/local-projects.ts`

- [ ] **Step 1: Extend the seed with template metadata**

Keep the existing Red Riding Hood structured data, but make the seed's title and chapter/scene IDs match the OpenWebGal source template and ensure the default project content is the visual-novel `AGENTS.md` document.

- [ ] **Step 2: Remove IndexedDB content import as a primary path**

New projects are initialized directly into OPFS from template files plus
`AGENTS.md`. Do not convert a visual-novel project into a title-named markdown
file, and do not keep an IndexedDB `vn` or `content` copy as project source.

- [ ] **Step 3: Run type checking through the production build**

Run: `npm run build`

Expected: the project compiles with the existing static export configuration.

### Task 3: Replace the all-projects list with the current project's OpenWebGal tree

**Files:**
- Modify: `app/projects/editor/editor-client.tsx`
- Modify: `app/projects/editor/vn-editor.tsx`
- Modify: `lib/i18n.tsx`

- [ ] **Step 1: Build the tree from the selected project**

For visual novels, enumerate the real project root containing `AGENTS.md`,
`meta.md`, `assets`, and chapter/scene files initialized by the template. Do
not render `projects.map(...)` and do not call the file `test2.md`.

- [ ] **Step 2: Wire tree selection to real editing**

Selecting `AGENTS.md` opens the markdown editor and edits the real file.
Selecting a scene `script.md`, `stage.yml`, or `meta.md` selects that scene in
`VNEditor`; the structured editor is a view over those files and writes the
affected files after changes. Asset and metadata files are visible and
read-only until their owning structured editor controls are used.

- [ ] **Step 3: Keep non-VN projects working**

For books, comics, and interactive videos, keep the existing single-document editor but display only the current project's document tree. Preserve `AGENTS.md` as the book constraint filename and use the project title only as visible project metadata, never as an arbitrary `.md` file.

- [ ] **Step 4: Include AGENTS constraints in AI context**

Change `buildContext` so it reads the full `AGENTS.md` first, followed by
project/chapter/scene metadata and the selected scene script. This makes the
real file constraints apply to chat-assisted editing.

### Task 4: Verify editing and preview together

**Files:**
- Modify: `app/projects/preview/preview-client.tsx` only if the saved-project flow exposes a mismatch.

- [ ] **Step 1: Run focused helper tests**

Run: `node --experimental-strip-types --test lib/vn/project-files.test.ts`

Expected: PASS.

- [ ] **Step 2: Run lint and build**

Run: `npm run lint`

Expected: ESLint exits 0.

Run: `npm run build`

Expected: Next.js build exits 0.

- [ ] **Step 3: Exercise the browser flow**

Start: `npm run dev -- --hostname 127.0.0.1 --port 3000`

Verify the flow:

1. Open `/projects/new?template=visual-novel`.
2. Create a project with the default name.
3. Confirm the editor tree contains `AGENTS.md`, `meta.md`, `assets`, and `chapter-001/scenes/scene-001`.
4. Edit a scene title/script and save.
5. Open preview and confirm the OpenWebGal iframe loads the saved project.
6. Return to the editor and confirm the changed scene remains.

- [ ] **Step 4: Inspect the final diff**

Run: `git diff --check`

Expected: no whitespace errors and no unrelated files changed.
