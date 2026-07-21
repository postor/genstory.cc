# GenStory.cc

GenStory.cc is a local-first creative workspace for books, comics, visual novels, interactive videos, and Phaser games. The app is a static Next.js export: there is no backend, API route, or server-side project filesystem. Project source files live in the browser Origin Private File System (OPFS), and IndexedDB stores only the project index and UI state.

[SEO plan](./docs/seo-plan.md) documents the public URL structure, keyword map, bilingual metadata, structured data, sitemap policy, and post-launch search monitoring.

# What Local Means

- Project text and assets are written to OPFS under `<type>/<projectId>/`.
- The editor always reads and saves real project files such as `AGENTS.md`, `meta.md`, `script.md`, `stage.yml`, and `assets/index.yml`.
- IndexedDB keeps lightweight metadata: project id, template, title, language, timestamps, and last opened path.
- Visual novel preview uses a browser-only IndexedDB cache for compiled OpenWebGal `game/*` files. That cache is runtime output, not a project source of truth.
- AI assistance is optional and browser-side. If the user connects OpenRouter, requests go to OpenRouter from the browser; the GenStory.cc app still does not run its own backend.

# Requirements

- Node.js 20 or newer for development.
- A modern Chromium-based browser with `navigator.storage.getDirectory()` / OPFS support for project editing.
- Network access during first setup if `vn-template/node_modules` is missing, because `npm run sync-webgal` installs the vendored OpenWebGal engine dependencies there.

# Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The `dev` script runs `npm run sync-webgal` first so visual novel preview has `public/webgal/` available.

# Build

```bash
npm run build
```

`next.config.ts` uses `output: "export"`, so the production app is emitted to `out/`. The `build` script also runs `npm run sync-webgal` first. If `vn-template/node_modules/webgal-engine/dist` is absent, the sync script runs `npm ci` inside `vn-template/` and then copies the engine into `public/webgal/`.

`public/webgal/` is generated and gitignored. Do not edit it by hand.

# Backups and Restore

The browser owns OPFS storage. Clearing site data, switching browsers, or changing origins can remove local projects. Users should regularly use **Download source** from the project list or editor.

A downloaded source ZIP can be restored from the project list with **Import source ZIP**. GenStory.cc imports ZIP files produced by its own source exporter, restores all files into a new OPFS project directory, and rebuilds the IndexedDB project index from `meta.md`.

For visual novels, **Export OpenWebGal** creates a standalone OpenWebGal project ZIP. That export is for running the game, not for editing. Use **Download source** for editable backups.

# Verification

```bash
npm run lint
node --experimental-strip-types --test lib/**/*.test.ts
npm run build
git diff --check
```

# Project Model

Each project contains editable source files:

```text
AGENTS.md
meta.md
assets/index.yml
chapter-001/
  meta.md
  scenes/scene-001/
    meta.md
    script.md
    stage.yml
```

Visual novel rules keep story facts, stage state, and render output separate. `script.md` carries narration and dialogue, `stage.yml` describes state, and `assets/index.yml` maps logical asset IDs to project assets.
