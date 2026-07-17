# 视觉小说（Visual Novel）浏览器内创作方案

> 状态：已采用。本方案把 OpenWebGal 视觉小说能力从「磁盘上的独立子项目 `vn-template/`」
> 改为「genstory.cc 应用内的浏览器端能力」，与项目「本地优先、SSG、无后端」的定位一致。
> 详见 `AGENTS.md` 中对本文件的引用。

## 问题

原 `vn-template/` 是独立子项目：用户在磁盘上编辑 `source/*.md`，用 node CLI（`build`/`preview`/
`export`）构建、起静态服务器预览、打 zip。这与 genstory.cc（IndexedDB 本地存储、SSG、无后端）
是两套范式，且 `app/` 内没有任何对它的引用——用户无法在站内编辑/预览/发布。

此外 `Project.content` 只是一个 markdown 字符串，装不下视觉小说（章节/场景/分支/资产）。

## 目标

用户在浏览器内闭环完成：编辑 → 预览 → 发布（导出 OpenWebGal 项目 zip）。
不需要后端、不需要 umd 解释器、不需要常驻编译服务。

## 架构

```
浏览器内 VN 数据模型 (IndexedDB: Project.vn)
        │  编辑 UI (app/projects/editor/vn-editor.tsx)
        ▼
lib/vn/compile.ts  (纯 JS：markdown → OpenWebGal 文件 map<path,Blob>)
        ├─ 预览：写入 IndexedDB 的 webgal-preview 槽
        │        → 预览页 iframe 加载 /webgal/ (vendored 引擎)
        │        → 桥接 Service Worker (public/webgal/webgal-serviceworker.js)
        │          拦截 /webgal/game/* 并从 IDB 返回 Blob
        └─ 发布：lib/vn/export.ts 把编译产物 + 引擎打成一个可独立运行的 zip 下载
```

### 关键决策

1. **引擎 vendor 进 `public/webgal/`**（由 `scripts/sync-webgal.mjs` 从
   `vn-template/node_modules/webgal-engine/dist` 拷贝并生成 `engine-manifest.json`）。
   SSG 无运行时 node_modules，引擎不能作为 npm 依赖在运行时加载。
   `public/webgal` 体积约 59MB（主要是 CJK 字体），故加入 `.gitignore`，靠 sync 脚本本地生成。

2. **预览用 Service Worker 桥接**：OpenWebGal 引擎按相对路径 `game/` 走 HTTP fetch 加载。
   纯前端、运行时不能写磁盘。引擎自带 `webgal-serviceworker.js` 注册机制（仅缓存构建资源，
   不过问 `game/`）。我们用**同路径的桥接 SW** 替换它：保留原构建资源缓存逻辑，并新增对
   `/webgal/game/*` 的拦截——从 IndexedDB 的 `webgal-preview` 槽读取编译产物 Blob 返回。
   预览页在加载 iframe 前先编译并写入该槽。

3. **发布（导出）不含桥接 SW**：导出 zip 用「原始引擎 SW」替换桥接 SW（否则磁盘部署时
   `game/` 会被桥接 SW 拦截成 404）。原始 SW 源码作为常量内嵌于 `lib/vn/export.ts`。

4. **编译逻辑纯前端**：移植 `vn-template/scripts/lib/compile.mjs` 的 `parseScript` 与
   场景组装；占位 PNG 用浏览器 Canvas 生成（`lib/vn/png.ts`）；资产若有用户上传
   `dataUrl` 则转 Blob 覆盖占位图。

5. **数据模型升级**：`Project` 增加可选 `vn?: VNProject`（结构化章节/场景/资产），以
   `vn-template` 的 小红帽 内容作种子（`lib/vn/seed.ts`）。`content` 字段对 VN 不再使用。

### 数据模型（`lib/vn/types.ts`）

```ts
interface VNAsset { id; type: "Background"|"Character"|"CG"; name; file; dataUrl? }
interface VNStageCharacter { id; position?: "left"|"center"|"right"; expression? }
interface VNScene { id; title; background?; characters: VNStageCharacter[]; script: string }
interface VNChapter { id; title; scenes: VNScene[] }
interface VNProject { title; chapters: VNChapter[]; assets: VNAsset[] }
```

`script` 沿用 vn-template 的简洁 markdown 文法（旁白 `:`、对话 `说话者: 文本`、`>> a:场景| b:场景`
分支、`~~ 毫秒` 等待、`changeScene:` 跳转、`#` 注释、`end;` 结束），由 `compile` 转成 OpenWebGal
`.txt`。

## 文件清单

- `docs/vn-browser-plan.md` — 本方案
- `lib/vn/types.ts` — 类型
- `lib/vn/seed.ts` — 小红帽示例
- `lib/vn/png.ts` — 浏览器占位 PNG
- `lib/vn/compile.ts` — 编译为 `Record<string, Blob>`
- `lib/vn/zip.ts` — 最小 store 模式 zip 写入（无依赖）
- `lib/vn/export.ts` — 取引擎 + 编译产物 → zip 下载
- `lib/vn/preview-store.ts` — 预览游戏槽的 IDB 读写（与 SW 共用）
- `scripts/webgal-bridge-sw.js` — 桥接 SW 源码（sync 时拷到 public/webgal/）
- `scripts/sync-webgal.mjs` — 引擎拷贝 + manifest + 桥接 SW
- `public/webgal/` — vendored 引擎（gitignored，由 sync 生成）
- `app/projects/editor/vn-editor.tsx` — VN 编辑 UI
- `app/projects/preview/page.tsx`(+`preview-client.tsx`) — 预览页
- `app/projects/editor/editor-client.tsx` / `new-client.tsx` — 接入 VN 分支
- `lib/content-types.ts` — `visual-novel` `enabled: true`
- `lib/local-projects.ts` — `Project.vn`
- `lib/i18n.tsx` — VN 相关文案

## 验证

- `npm run lint` / `npm run build`（SSG 导出）通过。
- 浏览器手测：新建视觉小说 → 编辑场景/资产 → 预览（iframe 跑 OpenWebGal）→ 导出 zip
  （解压后可直接作为 OpenWebGal 项目运行）。
- 注意：`public/webgal` 需先 `npm run sync-webgal` 生成，否则预览/导出的引擎资源缺失。
