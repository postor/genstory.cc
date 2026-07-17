# Browser File System Projects Design

## Status

Approved direction for implementation on July 17, 2026.

## Goal

Every genstory.cc project is backed by a real browser-private project directory
created through Origin Private File System. The directory is the only source of
project content. IndexedDB stores only the project index, timestamps, type, and
last opened path.

The user workflow is:

1. Choose a project type and name.
2. Create `<opfs>/<template>/<projectId>/` without asking for a parent
   directory.
3. Use that OPFS directory as the project root.
4. Write the selected project template and its `AGENTS.md` constraints into
   that directory.
5. Edit files directly in the browser.
6. Preview by reading the same files from the directory and compiling them.
7. Export or download only when the user explicitly requests it.

The application must never use an unrelated IndexedDB project record to build
the current project's file tree.

## Architecture

```text
Origin Private File System
  navigator.storage.getDirectory()
          |
          v
  <opfs>/<template>/<projectId>/
    AGENTS.md
    meta.md
    project-type files
          |
          +--> file-system adapter: read/write/list/watch permissions
          |
          +--> editor: reads files and writes edits back
          |
          +--> AI context: reads AGENTS.md and relevant source files
          |
          +--> preview compiler: reads the same source files

IndexedDB
  project id, title, type, language, timestamps,
  project type, project id, last opened file
```

The file-system adapter is the boundary for browser APIs. React components do
not call `navigator.storage.getDirectory()`, `getFileHandle()`, or
`createWritable()` directly.

## Project metadata

The persisted browser record is reduced to:

```ts
interface LocalProjectRecord {
  id: string;
  template: ContentTypeId;
  title: string;
  lang: Lang;
  createdAt: number;
  updatedAt: number;
  lastOpenedPath?: string;
}
```

`content` and the structured `vn` object are not authoritative project data.
They may be used transiently by an editor while a file is open, but they are
not saved as the project source in IndexedDB.

The adapter must provide:

```ts
getBrowserFileSystemRoot(): Promise<FileSystemDirectoryHandle>;
initializeProjectDirectory(
  template: ContentTypeId,
  projectId: string,
  lang: Lang,
): Promise<FileSystemDirectoryHandle>;
openProjectDirectory(
  template: ContentTypeId,
  projectId: string,
): Promise<FileSystemDirectoryHandle>;
readTextFile(root: FileSystemDirectoryHandle, path: string): Promise<string>;
writeTextFile(
  root: FileSystemDirectoryHandle,
  path: string,
  content: string,
): Promise<void>;
listProjectFiles(root: FileSystemDirectoryHandle): Promise<ProjectFileEntry[]>;
ensurePermission(root: FileSystemDirectoryHandle, write: boolean): Promise<void>;
```

Paths are normalized relative paths using `/`. Path traversal, absolute paths,
and empty path segments are rejected.

## Template initialization

New project creation is “template + `AGENTS.md`” written to a real directory.
The templates are static assets or source directories in the repository, but
the created project contains independent copies.

All project types have:

```text
<project>/
├── AGENTS.md
└── meta.md
```

The default layouts are:

```text
book/
├── AGENTS.md
├── meta.md
├── references/
└── chapter-001/
    ├── meta.md
    └── pages/
        └── page-001.md

comic/
├── AGENTS.md
├── meta.md
├── assets/
│   └── index.yml
└── chapter-001/
    ├── meta.md
    └── pages/
        └── page-001/
            ├── meta.md
            └── script.md

visual-novel/
├── AGENTS.md
├── meta.md
├── references/
├── assets/
│   ├── index.yml
│   ├── characters/
│   ├── backgrounds/
│   ├── cg/
│   ├── motions/
│   ├── effects/
│   ├── bgm/
│   ├── sfx/
│   └── voice/
└── chapter-001/
    ├── meta.md
    ├── characters/
    ├── locations/
    ├── scenes/
    │   └── scene-001/
    │       ├── meta.md
    │       ├── script.md
    │       └── stage.yml
    └── cg/

interactive-video/
├── AGENTS.md
├── meta.md
├── assets/
│   └── index.yml
└── chapter-001/
    ├── meta.md
    └── segments/
        └── segment-001/
            ├── meta.md
            └── script.md
```

The visual-novel template is copied from the existing OpenWebGal source
template and includes the complete Red Riding Hood seed. Its `stage.yml` files
contain state only, and all asset references use logical IDs from
`assets/index.yml`.

For non-visual-novel types, the first implementation uses markdown source
files and metadata files with the same real-file semantics. Their existing
single-document content is migrated into `AGENTS.md` only when it is actually
an AI constraint document; narrative content is written to the corresponding
`meta.md` or page/segment source file.

## Editor behavior

On open:

1. Load the project record from IndexedDB.
2. Open the OPFS root and resolve `<template>/<projectId>/`.
3. Recursively enumerate the real directory.
4. Render only those entries in the current project's tree.
5. Read the selected file on demand.

On edit:

1. Update the in-memory editor buffer.
2. Mark the file dirty.
3. On Save, write the file through the adapter.
4. Refresh the project record timestamp and last opened path.

The visual-novel structured editor is a view over real files:

- Selecting `script.md` loads and parses that scene's real script.
- Selecting `stage.yml` loads and parses the real stage state.
- Structured changes write the affected real files.
- The raw file editor is available for files without a structured control.

There is no generated virtual OpenWebGal source tree in the editor. The tree
always comes from directory enumeration.

`AGENTS.md` is shown as a normal editable file and is included first in the AI
context. Context then includes the nearest project/chapter/scene metadata and
the selected source file. The context builder reads files from the directory
instead of reconstructing them from an IndexedDB object.

## Preview

Preview uses the current OPFS project directory as its source:

1. Open the OPFS project directory.
2. Read the project files required by the selected project type.
3. For visual novels, parse `meta.md`, `assets/index.yml`, scene
   `script.md`, and `stage.yml`.
4. Compile the read source into OpenWebGal game files.
5. Place those compiled files in the existing browser preview store.
6. Start the vendored OpenWebGal iframe.

The preview store is a runtime cache only. It is never treated as the source
of the project and is cleared or replaced on every preview start.

Saving is required before preview. If dirty buffers exist, the preview action
offers a save-and-preview path and does not silently preview stale content.

## Permissions and error states

The UI must represent these states explicitly:

- OPFS unavailable: show an unsupported-browser message and
  disable local project creation.
- Project directory missing: mark the project unavailable and offer to recreate
  from template; do not fabricate files from cached data.
- File deleted externally: remove it from the tree and show a non-blocking
  refresh notice.
- File changed externally while open: offer reload or keep the in-memory
  buffer; never overwrite without an explicit save.
- Write failure: keep the buffer dirty and show the failing path and retry
  action.

The app must feature-detect the API and avoid referencing browser-only globals
during SSG or server rendering.

## Migration

Existing IndexedDB-only projects are legacy records. They remain visible in
the project list but must be migrated into OPFS before opening. Opening one
does not construct a fake file tree.

The migration flow:

1. User chooses “迁移到浏览器文件系统”.
2. The app opens OPFS and creates `<template>/<projectId>/`.
3. The app writes the legacy content into the appropriate template files.
4. For legacy visual-novel records that contain structured data, it writes the
   OpenWebGal files, including `AGENTS.md`.
5. Only after all writes succeed is the project index marked migrated.

No legacy content is deleted automatically. A failed migration leaves the
legacy record unchanged.

## Testing and acceptance

Unit tests cover:

- path normalization and traversal rejection
- recursive file enumeration
- template file manifests for all content types
- visual-novel parsing and writing of `script.md` and `stage.yml`
- metadata-only IndexedDB records
- migration failure atomicity

Browser verification covers:

1. Create a book, comic, visual novel, and interactive-video project.
2. Confirm each creates an OPFS child directory and writes `AGENTS.md` plus
   type-specific template files.
3. Edit and save a real file, close and reopen the project, and confirm the
   change persists.
4. Confirm the editor tree contains only the selected project's real files.
5. Edit a visual-novel scene, save, preview, and confirm the OpenWebGal iframe
   reflects the saved scene.
6. Delete a project file through the app or devtools and verify refresh behavior.

Required commands before completion:

```text
npm run lint
npm run build
node --experimental-strip-types --test lib/**/*.test.ts
git diff --check
```
