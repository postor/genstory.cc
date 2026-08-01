<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-rules -->
# Project preferences

- **Rendering**: Prefer Static Site Generation (SSG). Reach for dynamic/server rendering only when a page genuinely needs it.
- **Stack**: Next.js + shadcn/ui + Tailwind CSS are the default first choices for UI work.
- **Best practices**: Follow current best practices and idiomatic patterns for the chosen stack.
- **Consumer product mindset**: Always treat this as a consumer-facing product. Consider visual polish, user-facing wording, and whether each piece of content should be shown to end users at all.
- **No legacy compatibility**: Do not spend effort supporting old browsers, deprecated APIs, or historical versions. Target modern, current runtimes only.
- **Styling**: Avoid bespoke/custom styles. Prefer shadcn/ui's original components and design tokens. For anything without a shadcn primitive, use Tailwind utility classes that match the shadcn look. **Never use the inline `style` attribute** — express all styling via shadcn components or Tailwind classes. When building UI, reuse shadcn primitives (Dialog, Button, Input, Select, Textarea, ScrollArea, …) instead of re-implementing them with custom CSS. A custom re-implementation of a shadcn primitive (e.g. a hand-rolled modal that mimics `Dialog`) is considered redundant and should be removed in favor of the original.
<!-- END:project-rules -->

<!-- BEGIN:delivery-quality-rules -->
# 交付质量规则

- **禁止半成品交付**：不要用“只生成几个源码文件”“只接入一个入口”“只做静态占位预览”或其他缩水方案应付完整需求。实现前先梳理需求涉及的完整链路、验收标准和依赖；实现后逐项验证。
- **功能必须闭环**：新增项目类型或模板时，按实际需要完整覆盖类型注册、创建初始化、编辑/读取、预览/运行、导出/导入、资产处理和文档；不能默默跳过其中一环并将其称为完成。
- **占位必须明确**：只有用户明确要求暂不生成的资源（例如音频、图片）才可以保留注释或空资源位；这不等于省略场景、交互、状态流转或运行入口。
- **遇到阻塞要明示**：如果完整实现需要外部资源、产品决策或额外权限，必须明确说明缺口和影响，先请求确认，不得擅自降级为半吊子实现。
<!-- END:delivery-quality-rules -->







<!-- BEGIN:test-policy-rules -->

# 测试限制

- **不要做测试**：默认不要运行测试命令、测试套件、端到端测试、浏览器测试或任何会被视为测试执行的验证流程，除非用户之后明确要求。
- **不要写测试代码**：默认不要新增或修改测试文件、测试夹具、mock、snapshot 或测试专用脚本，除非用户之后明确要求。
- **交付说明**：如未运行测试，应在最终回复中简要说明“未运行测试（按要求）”。

<!-- END:test-policy-rules -->

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

视觉小说（OpenWebGal）能力**在浏览器内闭环**实现：编辑（OPFS 真实项目文件）、预览（桥接 Service
Worker 喂引擎）、发布（导出可独立运行的 OpenWebGal 项目 zip）。不再使用磁盘独立子项目
`vn-template/` 的 CLI 工作流；`vn-template/` 只保留为 OpenWebGal 引擎依赖和历史内容/编译参考。

完整方案见 [`docs/vn-browser-plan.md`](./docs/vn-browser-plan.md)。

关键约定速记：
- 用户项目正文和资产存浏览器 OPFS：`<type>/<projectId>/`。IndexedDB 只存项目索引、时间戳和 UI 状态。
- 编译：`lib/vn/compile.ts`（markdown → `Record<path, Blob>`）。
- 引擎 vendored 于 `public/webgal/`（gitignored），由 `npm run sync-webgal` 生成；`npm run dev` 和 `npm run build` 会先执行同步。
- 预览靠 `public/webgal/webgal-serviceworker.js` 桥接 SW 从 IndexedDB 读 `game/*`。
- 导出 zip＝引擎 + 编译产物，且**还原原始引擎 SW**（不使用桥接 SW）。
- 可编辑备份靠“下载源码”导出 source ZIP；项目列表的“导入源码 ZIP”可恢复该 ZIP 到新的 OPFS 项目目录。
<!-- END:vn-browser-plan -->

<!-- BEGIN:interactive-video-openrouter-rules -->
# 互动视频 OpenRouter 生成约定

- OpenRouter 视频模型走异步 REST 流程，不走 `chat/completions`：`POST /api/v1/videos` 提交任务，`GET /api/v1/videos/{jobId}` 或 `polling_url` 轮询，状态为 `completed` 后才可取结果。
- 终态处理：`completed` 表示可下载；`failed`、`cancelled`、`expired` 必须作为失败明示；`pending`、`in_progress` 只能继续轮询，不能写成最终资产。
- 下载职责：浏览器端项目不需要额外的“fetch tool”概念；实现层用 `fetch` 调 OpenRouter。如果完成状态给出 `unsigned_urls`，可直接取第一个 URL；否则用 `GET /api/v1/videos/{jobId}/content?index=0`，指向 OpenRouter API 的 URL 必须带 Bearer token。
- 用户触发：视频二进制较大，禁止自动后台下载到本地磁盘。只能在用户/助手明确触发保存时，把完成任务的结果写入 OPFS 项目文件（如 `assets/videos/*.mp4`），或在用户点击导出/下载时打包进 ZIP。
- 资产登记：`assets/index.yml` 中 Video 资产记录逻辑 ID、`file`、`prompt`、`model`、`duration`、`resolution`、`aspect_ratio`、`generation_status`；故事和时间轴只引用逻辑 ID，不引用 OpenRouter job URL。
<!-- END:interactive-video-openrouter-rules -->
