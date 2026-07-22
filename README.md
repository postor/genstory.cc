# GenStory.cc: Local-First Story Creation Tool

> **100% open source. 100% local project data by default.**
>
> A browser-based, local-first creative workspace for books, comics, visual novels, interactive videos, and Phaser games.

[![Live demo](https://img.shields.io/badge/Live%20demo-genstory.cc-111827?style=flat-square)](https://genstory.cc)
[![Open source](https://img.shields.io/badge/open%20source-MIT-2ea44f?style=flat-square)](./LICENSE)
[![Local-first](https://img.shields.io/badge/data-local--first-8250df?style=flat-square)](#100-local-project-data)
[![Next.js](https://img.shields.io/badge/Next.js-static%20export-000000?style=flat-square)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square)](https://www.typescriptlang.org/)

[Live app](https://genstory.cc) · [中文首页](https://genstory.cc/zh) · [English homepage](https://genstory.cc/en) · [GitHub repository](https://github.com/postor/genstory.cc)

**Like the project?** [Star it on GitHub](https://github.com/postor/genstory.cc) and [follow `@postor`](https://github.com/postor) for updates.

## Local-First Story Creation

GenStory.cc is a **browser-based creative workspace** and **local-first writing app** for creators who want a real project structure instead of a locked-in editor. Use it as a book writing tool, comic storyboard workspace, visual novel editor, interactive video authoring tool, or Phaser game editor. Write, organize, preview, back up, and export your work directly from a modern browser.

- **100% open-source codebase**: the application source, templates, build scripts, and documentation are visible in this repository under the MIT License.
- **100% local project data by default**: project source files and assets stay in this browser's Origin Private File System (OPFS), not in a GenStory account or application server.
- **No GenStory backend**: there is no GenStory application server, API route, or server-side project filesystem.
- **Structured creative projects**: scripts, scenes, characters, locations, code, styles, and assets remain editable and portable.
- **Source ZIP backup and import**: download an editable project backup, move it between devices, and restore it later.
- **Browser preview and export**: preview visual novels in the browser and export standalone OpenWebGal projects.
- **Optional cloud sync**: Google Drive or Dropbox sync is opt-in and only runs after you authorize it.

## Create More Than Stories

| Project type | Best for | Browser workflow | Output |
| --- | --- | --- | --- |
| **Books** | Novels, lore books, serialized writing | Chapters, pages, text, and media attachments | Source ZIP |
| **Comics** | Panels, pages, characters, and visual assets | Comic storyboard planning and structured asset management | Source ZIP |
| **Visual novels** | Interactive dialogue and scene-based stories | Markdown scripts, YAML stage state, browser preview | Source ZIP or OpenWebGal ZIP |
| **Interactive videos** | Branching shorts and interactive narratives | Interactive video authoring with segments, timelines, voice, and choices | Source ZIP |
| **Phaser games** | Browser games and JavaScript prototypes | Phaser game development with HTML, JavaScript, CSS, scenes, and asset plans | Source ZIP |

## 100% Local Project Data

GenStory.cc is designed around a clear data boundary. **“100% local project data” means local by default for project content and assets; it does not mean the browser can never access a provider that you explicitly authorize.**

| Where data lives | What it stores |
| --- | --- |
| **Browser OPFS** | Project source files, assets, chapters, scenes, scripts, code, and styles |
| **Browser IndexedDB** | Project index, timestamps, lightweight UI state, and visual novel preview cache |
| **GenStory servers** | No project storage, project API, or GenStory account required |
| **Google Drive / Dropbox** | Only when you explicitly connect a provider and start a sync |

The app does not automatically upload your work to GenStory.cc. AI assistance is optional; when configured, requests are sent from the browser to the provider you choose. Local storage can still be lost when site data is cleared, the browser profile changes, or the project origin changes, so use **Download source** for regular backups.

## How It Works

1. **Create** a book, comic, visual novel, interactive video, or Phaser game project from a structured template.
2. **Edit** real source files in the browser. Markdown, YAML, HTML, JavaScript, CSS, and asset indexes stay portable.
3. **Preview** the supported project flow in the browser, including visual novel and Phaser game previews.
4. **Back up** with a source ZIP or **export** a runnable project where supported.
5. **Restore** the source ZIP later as a new local project.

For visual novels:

- `script.md` contains narration and dialogue.
- `stage.yml` describes background, characters, expressions, poses, positions, motion, and music as state.
- `assets/index.yml` maps logical asset IDs to project assets.
- **Export OpenWebGal** creates a standalone runtime project; **Download source** creates the editable backup.

## Quick Start

### Requirements

- Node.js 20 or newer
- A modern Chromium-based browser with OPFS support
- Network access during the first setup if the vendored OpenWebGal engine dependencies are missing

### Run locally

```bash
git clone https://github.com/postor/genstory.cc.git
cd genstory.cc
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The development command syncs the Phaser runtime and the vendored OpenWebGal engine before starting Next.js.

### Build a static export

```bash
npm run build
```

The production site is emitted to `out/`. `next.config.ts` uses `output: "export"`, so the app can be hosted on static infrastructure without a GenStory backend.

## Project Structure

Each project keeps story facts and presentation state separate. A visual novel editor project looks like this:

```text
AGENTS.md
meta.md
assets/
  index.yml
chapter-001/
  meta.md
  scenes/
    scene-001/
      meta.md
      script.md
      stage.yml
```

The asset index uses logical IDs instead of hard-coded file paths. This keeps projects portable and makes assets easier to reuse across chapters and scenes.

## Documentation

- [Browser project plan](./docs/vn-browser-plan.md): OPFS projects, source ZIP import/export, preview bridge, and OpenWebGal export
- [Phaser browser plan](./docs/phaser-browser-plan.md): Phaser project structure and browser runtime
- [Visual novel editor plan](./docs/superpowers/plans/2026-07-17-openwebgal-project-editor-plan.md)

## Verification

```bash
npm run lint
npm run build
git diff --check
```

## Contributing

Issues, documentation improvements, templates, asset workflows, and code contributions are welcome. Please keep the project principles in mind:

- local-first by default
- source files remain portable
- story content stays separate from rendering state
- assets use logical IDs from `assets/index.yml`
- generated engine output stays generated

## 中文简介

GenStory.cc 是一个 **100% 开源、100% 本地优先** 的浏览器故事创作工作台，支持图书、漫画、视觉小说、互动视频和 Phaser 游戏。

- 项目正文和素材默认 **100% 保存在当前设备的浏览器中**，使用 OPFS 存储真实项目文件。
- GenStory.cc 不提供项目后端，不会自动把作品上传到 GenStory.cc 服务器。
- 可以下载源码 ZIP 备份，也可以从 ZIP 导入恢复。
- 视觉小说支持浏览器预览和 OpenWebGal 独立项目导出。
- Google Drive 和 Dropbox 同步是可选功能，只有在用户明确授权并主动同步时才会发生。

详细介绍请访问 [中文首页](https://genstory.cc/zh)。

## License

The GenStory.cc application source, templates, build scripts, and documentation are released under the [MIT License](./LICENSE). Third-party dependencies and vendored runtimes remain under their respective licenses.
