# Unified Browser Storage and Backup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make user-owned GenStory.cc workspace state restorable from one versioned backup while keeping OPFS as the browser source of truth and excluding secrets and derived caches.

**Architecture:** OPFS stores project source files, assets, project index metadata, workspace preferences, and project-scoped chat transcripts/images/compression state. Existing IndexedDB project records and eligible LocalStorage keys are imported once and then removed from their legacy stores. OAuth credentials and PKCE callback state remain in namespaced LocalStorage because they are secrets or one-time authentication state; WebGL preview IndexedDB and Service Worker caches remain derived runtime caches. A workspace ZIP contains the OPFS catalog, preferences, chat state, and every project directory, and restore writes new project IDs transactionally before rebuilding the catalog.

**Tech Stack:** Next.js 16 App Router static export, React 19, TypeScript, OPFS, IndexedDB legacy migration, LocalStorage legacy migration, Service Worker preview cache, native STORE ZIP writer/reader, Node test runner.

---

## Storage audit

| Data | Current store | Backup decision | Migration |
| --- | --- | --- | --- |
| Project source and assets | OPFS | Include | Already canonical |
| Project index (`id`, type, title, language, timestamps, last path) | IndexedDB `genstory.projects` | Include | Write OPFS project manifests/catalog; delete legacy rows after success |
| Language preference (`genstory-lang`) | LocalStorage | Include as workspace preference | Copy to OPFS, delete legacy key |
| Selected chat model (`chatbox_model`) | LocalStorage | Include as workspace preference | Copy to OPFS, delete legacy key |
| Auto-compression preference (`chatbox_auto_compress`) | LocalStorage | Include as workspace preference | Copy to OPFS, delete legacy key |
| Project chat transcript | LocalStorage `chatbox_messages[_<id>]` | Include | Copy to OPFS `.genstory/chats/`, delete legacy key |
| Tool image data URLs | LocalStorage `chatbox_images[_<id>]` | Include | Copy to OPFS chat state, delete legacy key |
| Context compression summary | LocalStorage `chatbox_context_compression[_<id>]` | Include | Copy to OPFS chat state, delete legacy key |
| OAuth access/refresh tokens | `openrouter-mcp:tokens` in LocalStorage | Exclude from backup | Keep in LocalStorage; never copy to OPFS |
| OAuth PKCE verifier and state | `openrouter-mcp:pkce` in LocalStorage | Exclude from backup | Keep as one-time redirect state |
| OAuth authorization context | `openrouter-mcp:ctx` in LocalStorage | Exclude from backup | Keep as one-time redirect state |
| OpenWebGal compiled preview files | IndexedDB `webgal-preview` | Exclude | Regenerate from OPFS source |
| OpenWebGal build cache | CacheStorage `webgal-*` | Exclude | Regenerate or browser cache naturally |
| Temporary React state, dirty buffers, object URLs | Memory | Exclude | No persistence |

## Target layout

```text
<opfs>/
├── .genstory/
│   ├── catalog.json
│   ├── preferences.json
│   └── chats/
│       └── <encoded-chat-id>.json
└── <type>/<project-id>/
    ├── .genstory/
    │   └── manifest.json
    ├── AGENTS.md
    ├── meta.md
    └── assets/
```

The root catalog contains only project references. Project manifests are the canonical source for project metadata. The editor and source ZIP hide `.genstory` internals from the editable file tree; workspace backup includes them.

## Workspace backup format

```text
genstory-workspace.json
preferences.json
chats/<encoded-chat-id>.json
projects/<type>/<old-project-id>/...
```

Restore always creates new project IDs, rewrites each project manifest, maps project chat files to the new IDs, writes into temporary project directories, validates required files, and publishes only after all projects are written. Existing projects are never overwritten.

## Implementation tasks

### Task 1: Define storage data contracts and migration classification

**Files:**
- Create: `lib/project-types.ts`
- Create: `lib/workspace-data.ts`
- Test: `lib/workspace-data.test.ts`

- [ ] Write tests for catalog parsing, project/chat storage paths, eligible LocalStorage key classification, and exclusion of `openrouter-mcp:*` keys.
- [ ] Run `node --experimental-strip-types --test lib/workspace-data.test.ts` and confirm the tests fail because the contracts do not exist.
- [ ] Implement pure data contracts and migration helpers.
- [ ] Run the focused test again and confirm it passes.

### Task 2: Add OPFS workspace state adapter

**Files:**
- Modify: `lib/file-system/browser.ts`
- Create: `lib/workspace-state.ts`
- Test: `lib/workspace-state.test.ts`

- [ ] Write tests against a memory-backed workspace file adapter for preferences and chat state serialization.
- [ ] Run the focused test and confirm it fails for the missing adapter.
- [ ] Implement OPFS root `.genstory` reads/writes, one-time LocalStorage migration, and legacy IDB catalog migration helpers.
- [ ] Run the focused tests and confirm they pass.

### Task 3: Move project index from IndexedDB to OPFS

**Files:**
- Modify: `lib/local-projects.ts`
- Modify: `app/projects/new/new-client.tsx`
- Modify: `app/projects/projects-client.tsx`
- Modify: `app/projects/editor/editor-client.tsx`
- Test: `lib/local-projects.test.ts`

- [ ] Write tests proving OPFS catalog data is preferred, legacy IndexedDB records are imported once, project manifests are written, and deletion removes both the manifest and catalog reference.
- [ ] Run the focused tests and confirm they fail.
- [ ] Implement OPFS-first project CRUD with IndexedDB fallback only for migration.
- [ ] Run the focused tests and confirm they pass.

### Task 4: Move eligible LocalStorage application state to OPFS

**Files:**
- Modify: `lib/i18n.tsx`
- Modify: `openroutermcp/chatbox/ChatBox.tsx`
- Test: `openroutermcp/chatbox/storage.test.ts`

- [ ] Write tests for chat state load/save and preference migration without touching auth keys.
- [ ] Run the focused tests and confirm they fail.
- [ ] Replace direct LocalStorage persistence for language, model, auto-compress, transcript, images, and compression state with the OPFS adapter, retaining a browser fallback only when OPFS is unavailable.
- [ ] Run the focused tests and confirm they pass.

### Task 5: Implement unified workspace export/import

**Files:**
- Modify: `lib/vn/zip.ts`
- Create: `lib/workspace-backup.ts`
- Create: `lib/workspace-backup.test.ts`
- Modify: `app/projects/projects-client.tsx`
- Modify: `lib/i18n.tsx`

- [ ] Write tests for workspace ZIP contents, malformed paths, new-ID restore mapping, and exclusion of auth/cache data.
- [ ] Run the focused tests and confirm they fail.
- [ ] Implement STORE ZIP reading, workspace backup creation, validation, and transactional restore.
- [ ] Add “导出工作区” and unified import handling alongside existing single-project source backup.
- [ ] Run the focused tests and confirm they pass.

### Task 6: Document the storage contract and verify the full chain

**Files:**
- Modify: `README.md`
- Modify: `docs/vn-browser-plan.md`
- Modify: `docs/superpowers/plans/2026-07-20-unified-browser-backup-plan.md`

- [ ] Document which state is backed up, which state is intentionally excluded, and the restore behavior.
- [ ] Run `npm run lint`.
- [ ] Run `node --experimental-strip-types --test lib/**/*.test.ts openroutermcp/**/*.test.ts components/**/*.test.ts app/**/*.test.ts`.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check`.
- [ ] Inspect the final diff and verify no production path exports OAuth credentials or preview caches.
