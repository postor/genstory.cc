<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-rules -->
# Project preferences

- **Rendering**: Prefer Static Site Generation (SSG). Reach for dynamic/server rendering only when a page genuinely needs it.
- **Stack**: Next.js + shadcn/ui + Tailwind CSS are the default first choices for UI work.
- **Best practices**: Follow current best practices and idiomatic patterns for the chosen stack.
- **No legacy compatibility**: Do not spend effort supporting old browsers, deprecated APIs, or historical versions. Target modern, current runtimes only.
- **Styling**: Avoid bespoke/custom styles. Prefer shadcn/ui's original components and design tokens. For anything without a shadcn primitive, use Tailwind utility classes that match the shadcn look. **Never use the inline `style` attribute** — express all styling via shadcn components or Tailwind classes. When building UI, reuse shadcn primitives (Dialog, Button, Input, Select, Textarea, ScrollArea, …) instead of re-implementing them with custom CSS. A custom re-implementation of a shadcn primitive (e.g. a hand-rolled modal that mimics `Dialog`) is considered redundant and should be removed in favor of the original.
<!-- END:project-rules -->

<!-- BEGIN:visual-novel-rules -->
# 视觉小说项目规则

## 使命

在本视觉小说项目中保持长期一致性。

优先级：

- 设定（Canon）
- 角色
- 时间线
- 视觉一致性
- 资产复用

---

## 命名约定

常用文件名：

- `meta.md` — 元数据
- `script.md` — 对话与叙事
- `stage.yml` — 场景状态
- `design.*` — 视觉参考
- `final.*` — 生成结果

一个事实，一个来源。

---

## 仓库结构

```text
/
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
│
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
```

---

## 上下文优先级

```
项目 project
    ↓
章节 chapter
    ↓
场景 scene
    ↓
角色 characters
    ↓
地点 locations
    ↓
参考 references
    ↓
当前任务 current task
```

高优先级覆盖低优先级。

---

## 舞台模型（Stage Model）

场景描述**状态**，绝不写渲染指令。

推荐（状态）：

- background（背景）
- characters（角色）
- expression（表情）
- pose（姿势）
- position（位置）
- motion（动作）
- music（音乐）

禁止（渲染指令）：

- playAnimation(...)
- changeFigure(...)
- hide(...)
- show(...)

状态变化是增量式的。

---

## 资产（Assets）

仅使用逻辑 ID。

绝不引用文件路径。

所有资产统一索引于：

```
assets/index.yml
```

可用资产类型（完整开放，不再限制）：

- Character（角色）
- Background（背景）
- CG（事件图）
- Motion（动作）
- Effect（特效）
- BGM（背景音乐）
- SFX（音效）
- Voice（配音）
- UI（界面元素）
- Font（字体）
- Video（视频/过场）
- Prop（道具）
- Tachie（立绘）
- Transition（转场）
- Ambience（环境音）
- Palette（色板/色彩方案）

> 分类保持可扩展：如需新增资产类型，在 `assets/index.yml` 中登记后即可使用，不设固定上限。

---

## 工作流

```
理解 Understand
    ↓
规划 Plan
    ↓
生成 Generate
    ↓
校验 Validate
```

始终校验：

- 设定 Canon
- 时间线 Timeline
- 角色状态 Character state
- 舞台状态 Stage state
- 资产引用 Asset references

---

## 规则

始终：

- 分离故事与呈现。
- 复用已有资产。
- 保持对话独立于渲染。
- 将可复用的知识向上层沉淀。

绝不：

- 重复设定。
- 硬编码资产路径。
- 改写已确立的事件。
- 将渲染逻辑混入故事。
<!-- END:visual-novel-rules -->

<!-- BEGIN:vn-browser-plan -->
# 视觉小说浏览器端方案

视觉小说（OpenWebGal）能力**在浏览器内闭环**实现：编辑（IndexedDB）、预览（桥接 Service
Worker 喂引擎）、发布（导出可独立运行的 OpenWebGal 项目 zip）。不再使用磁盘独立子项目
`vn-template/` 的 CLI 工作流（其 `source/` 仅作为内容/编译逻辑的参考来源）。

完整方案见 [`docs/vn-browser-plan.md`](./docs/vn-browser-plan.md)。

关键约定速记：
- 用户数据存 `Project.vn`（`lib/vn/types.ts`），种子为 小红帽（`lib/vn/seed.ts`）。
- 编译：`lib/vn/compile.ts`（markdown → `Record<path, Blob>`）。
- 引擎 vendored 于 `public/webgal/`（gitignored），由 `npm run sync-webgal` 生成。
- 预览靠 `public/webgal/webgal-serviceworker.js` 桥接 SW 从 IndexedDB 读 `game/*`。
- 导出 zip＝引擎 + 编译产物，且**还原原始引擎 SW**（不使用桥接 SW）。
<!-- END:vn-browser-plan -->
