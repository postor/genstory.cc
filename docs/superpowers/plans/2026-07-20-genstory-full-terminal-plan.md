# GenStory.cc 全链路创作工作台实施方案

> **已被新方案取代（2026-07-20）：** 本文最初按“浏览器 + OPFS 本地真源”设计，不再适合作为全终端实施依据。请使用 [`2026-07-20-genstory-cross-platform-plan.md`](./2026-07-20-genstory-cross-platform-plan.md)；本文保留用于追溯已经完成的浏览器端设计。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立一套浏览器内闭环的 GenStory.cc 创作工作台，让用户从创建项目、编辑真实源文件、调用 AI、管理资产、预览运行、导入恢复到导出独立作品都使用同一套项目生命周期协议。

**Architecture:** GenStory.cc 保持无后端、Next.js SSG 和 local-first。OPFS 保存项目源文件与资产，IndexedDB 只保存项目索引、权限/恢复状态和 UI 状态；统一的内容类型适配器负责模板、读取、校验、编译、预览和发布。通用编辑器处理文件树、代码/Markdown、上传、AI 工具和源码备份，类型适配器只处理领域语义与运行时。

**Tech Stack:** Next.js 16 App Router + static export、React 19、TypeScript、Tailwind CSS 4、shadcn/ui、OPFS、IndexedDB、Service Worker、WebAssembly/浏览器原生 ZIP、OpenWebGal、Phaser。

---

## 1. 设计结论

“全终端”按完整产品链路理解，而不是再增加一个服务器端项目：

```text
首页/作品库
    ↓
选择内容类型 + 初始化模板
    ↓
OPFS 真实项目目录 ←→ IndexedDB 项目索引
    ↓
统一编辑器
  ├─ 文件树 / 源文件编辑
  ├─ 类型结构化编辑器
  ├─ 资产管理
  ├─ AI 上下文与文件工具
  └─ 校验与变更状态
    ↓
类型适配器
  ├─ 读取 source
  ├─ compile
  ├─ preview runtime
  └─ export package
    ↓
浏览器预览 / 独立 ZIP / 源码 ZIP
```

不引入账户、云端数据库、API Route 或服务器端项目文件系统。需要跨设备同步时，第一阶段通过“下载源码 ZIP / 用户自己的云盘”完成；云同步是后续可插拔能力，不改变本地项目模型。

## 2. 现有能力与复用边界

### 已有并继续复用

- `lib/file-system/browser.ts`：OPFS 项目目录的创建、枚举、读写、上传和权限处理。
- `lib/local-projects.ts`：IndexedDB 项目索引。
- `lib/project-templates.ts`：按内容类型生成模板文件。
- `lib/project-import.ts` / `lib/project-export.ts`：源码 ZIP 导入和通用导出。
- `lib/vn/*`：视觉小说源文件、OpenWebGal 编译、预览缓存和导出。
- `lib/phaser/*`：Phaser 源文件读取、预览和导出。
- `app/projects/editor/editor-client.tsx`：文件树、源文件编辑、AI 文件工具和保存流程。
- `app/projects/preview/preview-client.tsx`：预览入口。

### 需要收束的问题

1. 编辑器仍然直接判断 `visual-novel`、`phaser-game` 和其他类型，公共流程与类型语义耦合。
2. 预览、导出、导入推断、模板初始化缺少统一的类型适配器接口。
3. 项目索引没有明确记录 schema 版本、最后一次校验结果和运行时状态。
4. 保存、结构化编辑、AI 批量变更和导入没有统一的校验/冲突策略。
5. 预览缓存、桥接 Service Worker 和独立导出之间缺少明确的版本、清理和失败恢复协议。
6. 移动端只需要“可用的响应式编辑体验”，不应复制桌面三栏布局。

## 3. 统一领域协议

创建 `lib/project-runtime/types.ts`，公共层只依赖这些类型：

```ts
export interface ProjectManifest {
  schemaVersion: 1;
  id: string;
  type: ContentTypeId;
  title: string;
  lang: Lang;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectValidationIssue {
  severity: "error" | "warning";
  path?: string;
  code: string;
  message: string;
}

export interface CompileResult {
  files: { path: string; blob: Blob }[];
  warnings: ProjectValidationIssue[];
}

export interface PreviewTarget {
  kind: "html" | "iframe-srcdoc" | "service-worker";
  url?: string;
  srcDoc?: string;
  cacheKey?: string;
}

export interface ContentTypeAdapter {
  type: ContentTypeId;
  initialize(input: {
    id: string;
    title: string;
    lang: Lang;
  }): Promise<ProjectTemplateFile[]>;
  read(root: FileSystemDirectoryHandle): Promise<unknown>;
  validate(
    root: FileSystemDirectoryHandle,
    model?: unknown
  ): Promise<ProjectValidationIssue[]>;
  compile(
    root: FileSystemDirectoryHandle,
    model?: unknown
  ): Promise<CompileResult>;
  preview(
    root: FileSystemDirectoryHandle,
    model?: unknown
  ): Promise<PreviewTarget>;
  export(
    root: FileSystemDirectoryHandle,
    title: string
  ): Promise<void>;
  canImport(paths: string[], files: Map<string, string>): boolean;
}
```

适配器必须是纯领域边界：不直接操作 React state，不直接修改 IndexedDB，不在故事源文件里写渲染指令，也不把物理资产路径当作逻辑资产 ID。

## 4. 存储方案

### OPFS：唯一源文件来源

```text
<opfs>/
  <content-type>/
    <project-id>/
      AGENTS.md
      meta.md
      assets/
      ...type-specific source files...
```

规则：

- 所有源文件和二进制资产都写入 OPFS。
- 编辑器、结构化编辑器、AI 工具、预览和导出都从 OPFS 读取。
- 内存中的 `VNProject`、`PhaserProject` 或通用 model 只能是当前操作的临时投影。
- 资产在故事文件中只使用逻辑 ID；资产索引统一放在 `assets/index.yml`。
- 用户主动下载源码 ZIP，才把项目取出浏览器。

### IndexedDB：索引和状态

将 `lib/local-projects.ts` 升级为：

```ts
interface ProjectIndex {
  id: string;
  template: ContentTypeId;
  title: string;
  lang: Lang;
  schemaVersion: 1;
  createdAt: number;
  updatedAt: number;
  lastOpenedPath?: string;
  lastValidation?: {
    at: number;
    errors: number;
    warnings: number;
  };
  recoveryState?: "normal" | "permission-needed" | "source-missing" | "corrupt";
}
```

IndexedDB 不保存正文、脚本、资产 Blob 或编译结果。预览缓存单独使用版本化 store，并支持按项目清理。

### 迁移和恢复

- 读取旧项目时，缺省 `schemaVersion` 视为 `1`。
- OPFS 目录不存在时，项目列表显示“源文件不可用”，不能伪造空项目。
- 权限丢失时先重新请求目录权限；失败后保持索引并显示恢复操作。
- 导入源码 ZIP 永远创建新项目 ID，不覆盖已有目录。

## 5. 内容类型适配器

| 类型 | 源文件 | 编译/预览 | 独立发布 |
|---|---|---|---|
| `book` | `chapter-*/content.md`、章节元数据、插图资产 | Markdown → 阅读器 HTML | 可读 HTML ZIP |
| `comic` | 页面元数据、`storyboard.md`、页面图片 | 页面/分镜阅读器 | 可读 HTML ZIP |
| `visual-novel` | `script.md`、`stage.yml`、`assets/index.yml` | OpenWebGal 编译 + 桥接 SW | OpenWebGal ZIP，恢复原始 SW |
| `interactive-video` | 片段、视频、音频、选择点 | HTML5 video + choice runtime | 自包含 HTML/媒体 ZIP |
| `phaser-game` | `index.html`、`src/**/*.js`、资产索引 | 本地 Phaser runtime + srcDoc | 自包含 Phaser ZIP |

每个适配器必须具备：

1. 完整模板初始化。
2. 真实文件读取和结构化 model。
3. 静态校验：路径、必需文件、逻辑资产 ID、引用存在性。
4. 预览入口。
5. 源码 ZIP 兼容导入。
6. 可运行发布包。
7. 失败时返回带文件路径和修复建议的错误。

## 6. 浏览器端页面与交互

### 路由

```text
/                       静态首页
/projects               作品库
/projects/new           新建项目
/projects/editor?id=   编辑器
/projects/preview?id=  预览
/[lang]                 内容类型说明
/[lang]/[slug]          SEO 公共说明页
```

### 桌面端编辑器

三列布局：

```text
文件树  |  编辑/结构化视图  |  AI 助手
```

顶部工具栏统一提供：

- 返回作品库
- 刷新文件树
- 上传资产
- 新建目录
- 删除
- 校验
- 预览
- 导出运行包
- 下载源码
- 保存

结构化编辑器只作为真实源文件的视图：

- VN 编辑器保存 `meta.md`、`script.md`、`stage.yml`。
- Phaser 编辑器保存 `index.html` 和 JavaScript 文件。
- 图书/漫画/互动视频先复用通用 Markdown/媒体编辑器；后续增加结构化视图时不得另建缓存模型。

### 移动端

移动端不保留三列同时展开：

```text
顶部操作栏
    ↓
当前视图（编辑器 / 预览 / AI）
    ↓
底部或抽屉式导航（文件、AI、项目操作）
```

要求：

- 文件树使用 Dialog/Sheet。
- AI 面板使用 Sheet。
- 操作按钮用 shadcn Button + lucide 图标，长文本动作保留图标与短标签。
- 代码编辑器、媒体预览和预览 iframe 保证横向可滚动且不挤压布局。
- 所有状态都能在窄屏完成：保存、校验、预览、导出、下载源码。

## 7. 编辑、校验和保存事务

### 保存状态机

```text
clean
  ↓ 用户修改 / AI 变更
dirty
  ├─ 保存成功 → validating → clean
  └─ 保存失败 → save-error → retry
```

保存顺序：

1. 对所有待写路径做 `normalizeRelativePath`。
2. 拒绝绝对路径、`..`、未知二进制扩展或越过项目根的路径。
3. 请求 OPFS 写权限。
4. 按路径写入临时缓冲，然后完成文件替换。
5. 重新读取受影响文件，确认磁盘内容与编辑缓冲一致。
6. 运行类型适配器校验。
7. 更新 IndexedDB 的 `updatedAt` 和 `lastValidation`。

保存失败不得静默清除 dirty 状态。

### AI 变更事务

AI 读取上下文顺序：

```text
AGENTS.md
→ 根 meta.md
→ 当前章节 meta.md
→ 当前场景/页面 meta.md
→ 当前脚本或源文件
```

AI 工具分为：

- `list_project_files`
- `read_project_file`
- `search_project_files`
- `validate_project`
- `propose_file_changes`

AI 不直接执行任意路径写入。变更必须经过：

```text
AI proposal → 用户可见 diff → 路径/类型校验 → 写入 OPFS → 重新读取 → 类型校验
```

## 8. 预览运行时

### 通用预览协议

编辑器点击预览时：

1. 如果 dirty，先保存。
2. 读取真实源文件。
3. 调用类型适配器 `validate`。
4. 有 error 时阻止运行，并定位到文件；只有 warning 时允许继续。
5. 调用 `compile`。
6. 按 `PreviewTarget` 启动对应 runtime。

### 视觉小说

```text
OPFS source
  → lib/vn/compile.ts
  → game/* Blob
  → versioned IndexedDB preview cache
  → bridge Service Worker
  → vendored OpenWebGal iframe
```

桥接 SW 只用于浏览器预览。独立导出必须：

- 包含引擎和编译结果。
- 包含项目资产。
- 恢复 OpenWebGal 原始 Service Worker。
- 不带 GenStory.cc 的 IndexedDB bridge 逻辑。

### Phaser

```text
OPFS index.html + src/**/*.js
  → lib/phaser/source-reader.ts
  → local Phaser runtime + sanitized srcDoc
  → iframe preview
```

发布包将运行时改写为相对路径 `vendor/phaser.min.js`，不依赖 GenStory.cc origin。

### 图书、漫画、互动视频

第一阶段共享轻量 HTML runtime：

- Markdown 只渲染安全子集。
- 资产通过 Blob URL 或导出包相对路径加载。
- 互动视频必须有播放、暂停、选择点和回到上一节点的状态。
- 不把阅读器 HTML 当作源文件保存。

## 9. 导入、导出和发布

### 源码 ZIP

用途：备份、跨浏览器恢复、迁移到另一台设备。

导出内容：

```text
AGENTS.md
meta.md
assets/
type-specific source files
```

导入校验：

1. ZIP 只接受 store/no-compression 的 GenStory.cc 格式。
2. 去除单一公共根目录。
3. 规范化路径并拒绝目录穿越。
4. 必须包含 `AGENTS.md` 和 `meta.md`。
5. 使用显式 `type` 优先，否则使用适配器 `canImport` 推断。
6. 校验必需文件和资产引用。
7. 生成新项目 ID 后写入 OPFS。
8. 写入 IndexedDB 索引。
9. 失败时删除本次新建目录，不能留下半个项目。

### 运行包

运行包不是源码备份，导出按钮按类型显示：

- `Export OpenWebGal`
- `Export Phaser game`
- `Export readable project`
- `Export interactive video`

运行包必须在脱离 GenStory.cc、脱离开发服务器、脱离 IndexedDB 的情况下打开。

## 10. 安全与可靠性

- 禁止 AI、ZIP 和上传文件写入项目根以外。
- ZIP 解包前限制文件数量、单文件大小和总大小，避免浏览器内存被耗尽。
- HTML/JS 预览使用 sandbox iframe；不把用户源代码注入宿主页面。
- Markdown 渲染默认转义 HTML，媒体源必须解析为项目内相对路径。
- 导出文件名使用统一的 `safeFilename`。
- 所有 blob URL 在切换文件、卸载页面和重建预览缓存时释放。
- Service Worker 使用项目 ID + 编译版本作为 cache key，删除项目时一并清理。
- 预览和导出失败展示 `path + code + message`，不要只显示通用“失败”。
- 不依赖浏览器本地化随机文件名；项目标题只是元数据和下载名。

## 11. 实施拆分

### Phase 1：统一项目运行时协议

文件：

- Create: `lib/project-runtime/types.ts`
- Create: `lib/project-runtime/registry.ts`
- Create: `lib/project-runtime/validation.ts`
- Modify: `lib/content-types.ts`
- Modify: `lib/local-projects.ts`

任务：

- 注册适配器。
- 增加 `schemaVersion`、恢复状态、最后校验摘要。
- 把通用错误和校验 issue 标准化。
- 为旧 IndexedDB 数据提供默认值。

验收：

- 现有项目列表、创建和删除测试全部通过。
- 旧索引读取不报错。

### Phase 2：抽离通用项目生命周期

文件：

- Create: `lib/project-runtime/project-service.ts`
- Create: `lib/project-runtime/save-transaction.ts`
- Modify: `app/projects/new/new-client.tsx`
- Modify: `app/projects/editor/editor-client.tsx`
- Modify: `app/projects/projects-client.tsx`

任务：

- 将初始化、打开、保存、刷新、源码下载、导入恢复改为调用公共 service。
- 编辑器不再根据内容类型分叉初始化/保存逻辑。
- 保留类型适配器对结构化编辑和运行时的控制。

验收：

- 五类项目都能创建、打开、保存、刷新、删除。
- 失败保存后 dirty 状态仍然存在。

### Phase 3：接入统一校验与 AI 变更事务

文件：

- Create: `lib/project-runtime/ai-context.ts`
- Create: `lib/project-runtime/change-set.ts`
- Modify: `app/projects/editor/editor-client.tsx`
- Modify: `components/openrouter-mcp/chatbox/ChatBox.tsx`

任务：

- 实现 AGENTS 优先的上下文构建。
- 增加可预览的文件 diff。
- AI 变更统一走路径、类型和领域校验。
- 在编辑器增加校验结果面板。

验收：

- AI 不能写出项目根目录。
- AI 改动在用户确认前不会写入 OPFS。
- 错误包含具体文件路径。

### Phase 4：统一预览路由和运行缓存

文件：

- Create: `lib/project-runtime/preview-service.ts`
- Create: `lib/project-runtime/preview-cache.ts`
- Modify: `app/projects/preview/page.tsx`
- Modify: `app/projects/preview/preview-client.tsx`
- Modify: `lib/vn/preview-store.ts`
- Modify: `lib/vn/original-sw.ts`

任务：

- 统一“保存 → 校验 → 编译 → 运行”的流程。
- 统一 cache key、TTL/清理和 SW 注册状态。
- VN、Phaser、通用 HTML runtime 使用适配器，不让页面承担类型判断。

验收：

- 五类项目预览入口一致。
- 预览错误能返回到对应源文件。
- 刷新页面后不会使用旧编译缓存。

### Phase 5：补齐互动视频和通用运行包

文件：

- Create: `lib/interactive-video/adapter.ts`
- Create: `lib/interactive-video/source-reader.ts`
- Create: `lib/interactive-video/preview.ts`
- Create: `lib/interactive-video/export.ts`
- Modify: `lib/project-source.ts`
- Modify: `lib/project-export.ts`
- Modify: `lib/project-import.ts`

任务：

- 完成片段、媒体、选择点和分支状态模型。
- 使用 HTML5 video/audio 和本地媒体路径。
- 导出后在 `file://` 或静态托管目录下可运行。

验收：

- 片段播放、暂停、选择、分支跳转、重新开始闭环。
- 源码 ZIP 与运行包分别可导入/运行。

### Phase 6：响应式 UI 和移动端工作流

文件：

- Modify: `app/projects/editor/editor-client.tsx`
- Create: `app/projects/editor/mobile-project-sheet.tsx`
- Create: `app/projects/editor/validation-panel.tsx`
- Modify: `components/ui/*`（只补缺失的 shadcn primitive）

任务：

- 桌面三栏，移动端 Sheet/Drawer。
- 使用 shadcn/ui 原语和 Tailwind，不使用 inline style。
- 补齐 loading、empty、permission-needed、dirty、save-error、preview-error 状态。

验收：

- 390px、768px、1280px 三种宽度下无重叠和横向溢出。
- 移动端能完成创建、编辑、保存、预览、导出。

### Phase 7：全链路验证和文档

文件：

- Modify: `README.md`
- Modify: `docs/vn-browser-plan.md`
- Create: `docs/full-terminal-acceptance.md`
- Modify: `lib/**/*.test.ts`

任务：

- 增加浏览器验收脚本/手工清单。
- 覆盖创建多个项目、刷新、权限恢复、源码导入、运行包独立打开。
- 明确浏览器能力要求和数据丢失风险。

## 12. 测试矩阵

### 单元测试

- OPFS 路径规范化和目录穿越拒绝。
- 项目模板必需文件。
- 项目类型注册和适配器查找。
- `meta.md` 标题/type 解析。
- ZIP 导入公共根目录去除。
- ZIP 导入失败后的清理。
- 资产逻辑 ID 引用校验。
- AI change set 的路径和扩展名校验。
- preview cache key 不碰撞。

### 类型专项测试

- VN：`stage.yml` 增量状态、脚本编译、导出原始 SW。
- Phaser：入口脚本顺序、Phaser 本地 runtime、菜单到测试场景。
- Book：章节排序和 Markdown 图片路径。
- Comic：页面排序、分镜和图片。
- Interactive video：节点、媒体、选择和回退。

### 浏览器验收

```text
1. 新建五类项目。
2. 关闭并刷新页面，再打开项目。
3. 修改源文件，保存，刷新，确认内容仍在。
4. 上传图片/音频/视频，确认文件树和预览正确。
5. 运行校验，确认错误定位到文件。
6. 运行预览，确认编译结果是最新源文件。
7. 下载源码 ZIP，再导入为新项目。
8. 导出运行 ZIP，解压后不启动 GenStory.cc 仍能运行。
9. 清除预览缓存，重新预览。
10. 拒绝/恢复 OPFS 权限，确认提示和重连路径。
```

### 最终命令

```bash
npm run lint
node --experimental-strip-types --test lib/**/*.test.ts
npm run build
git diff --check
```

## 13. 失败模式和用户可见结果

| 场景 | 测试 | 处理 | 用户结果 |
|---|---|---|---|
| OPFS 权限失效 | 浏览器测试 | 重新请求权限 | 显示“重新连接项目” |
| OPFS 目录被清理 | 导入/打开测试 | 标记 `source-missing` | 项目仍在列表，可导入源码恢复 |
| 保存中途写失败 | save transaction 测试 | 不清 dirty，保留缓冲 | 显示失败路径和重试 |
| ZIP 路径穿越 | ZIP 单测 | 立即拒绝并清理新目录 | 显示 ZIP 无法导入 |
| 资产引用缺失 | 适配器测试 | 返回 validation error | 阻止预览并定位索引/脚本 |
| 预览缓存过期 | cache 测试 | 丢弃旧 key 重新编译 | 用户只看到一次重新加载 |
| AI 输出非法文件 | change set 测试 | 不写入磁盘 | 显示未应用的变更 |
| 导出包缺少 runtime | 导出测试 | 在打包前验证 entry | 导出失败，说明缺少运行时 |
| 移动端 iframe 过宽 | Playwright 视觉测试 | 响应式容器滚动 | 预览不遮挡工具栏 |

任何“无测试、无错误处理、用户看不到失败”的路径都视为发布阻断项。

## 14. 并行实施策略

| Step | Modules touched | Depends on |
|---|---|---|
| A. 运行时协议与索引 | `lib/project-runtime/`, `lib/local-projects.ts` | — |
| B. 适配器迁移 | `lib/vn/`, `lib/phaser/`, `lib/project-source.ts` | A |
| C. 编辑器生命周期 | `app/projects/`, `components/openrouter-mcp/chatbox/` | A |
| D. 互动视频 | `lib/interactive-video/`, templates | A |
| E. 运行缓存与 SW | `lib/vn/`, `app/projects/preview/` | A, B |
| F. 响应式 UI | `app/projects/editor/`, `components/ui/` | C |
| G. 全链路测试与文档 | `docs/`, `lib/**/*.test.ts` | B, C, D, E, F |

执行顺序：

```text
Lane A: A
Lane B: D（可与 A 并行，最终接入时等待 A）
Lane C: A → B → E
Lane D: A → C → F
Lane E: B + C + D + E + F → G
```

`lib/vn/` 同时被 B 和 E 修改，建议顺序合并，避免预览缓存与 VN 适配器发生冲突。

## 15. 明确不在本阶段范围

- 用户账户、云端数据库和多人协作：会改变 local-first 数据模型，先以源码 ZIP 作为跨设备边界。
- 服务端 AI 代理：当前 OpenRouter 浏览器直连；后续如需密钥保护，再增加独立后端边界。
- 自动图片、音频、视频生成：只保留资产索引和提示词，不把未生成的资源伪装成可运行资源。
- 浏览器之外的原生桌面客户端：Electron 可以复用本方案，但不是当前交付目标。
- 旧浏览器兼容：只支持现代 Chromium/OPFS 能力。

## 16. 完成标准

只有满足以下条件才算完成：

1. 所有启用内容类型都能创建、编辑、保存、刷新和删除。
2. 所有类型都从真实 OPFS 源文件预览，不使用 IndexedDB 内容副本。
3. 视觉小说和 Phaser 能导出独立可运行包。
4. 图书、漫画和互动视频有完整的预览与导出闭环。
5. 源码 ZIP 可以导入为新项目，失败不会留下半成品目录。
6. AI 变更有可见 diff、路径校验和领域校验。
7. 桌面和移动端完成核心操作且无布局重叠。
8. lint、native tests、build、diff check 和浏览器验收全部通过。
