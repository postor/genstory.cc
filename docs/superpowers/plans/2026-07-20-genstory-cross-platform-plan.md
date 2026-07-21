# GenStory.cc 全终端本地优先方案

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 覆盖浏览器、iOS、Android、Windows、macOS、Linux，同时保证项目以真实本地文件为源；云端只保存端到端加密的同步数据，不成为项目明文真源。

**Architecture:** 项目在每台设备上都是一个真实文件目录，源文件和资产直接落盘。Windows/macOS/Linux/iOS/Android 应用内置 loopback HTTP 服务，把项目目录或编译后的预览目录按静态网站提供给 WebView；浏览器端在支持时使用用户选择的本机目录，不能访问本机目录时使用源码 ZIP。每次本地文件提交先完成，再异步把端到端加密同步包上传到云端；其他设备下载后在本地解密、合并和写回文件。

**Tech Stack:** Next.js 16 静态 Web、React 19、Tauri 2、TypeScript、Rust、SQLite、IndexedDB、Web Worker、端到端加密、S3 兼容对象存储或普通 Blob 存储。

---

## 1. 正确的产品边界

```text
本地项目目录
  ├── 源文件
  ├── 资产
  ├── preview/ 编译产物
  ├── .genstory/ 版本和同步状态
  └── 本地预览/导出
          │
          │ 加密同步包
          ▼
云端同步中继
  ├── 只存密文
  ├── 不读项目内容
  ├── 不做故事合并
  └── 不负责项目运行
          │
          ▼
其他设备的本地项目仓库
```

云端可以知道：

- 用户账号或设备账号。
- 某个项目存在密文同步包。
- 密文包大小、哈希、版本号、设备 ID 和时间戳。

云端不能知道：

- 项目标题、脚本、角色、资产内容。
- `AGENTS.md`、`stage.yml`、`assets/index.yml` 的明文。
- 哪些文本行发生了什么故事变化。

## 2. 六端技术形态

### 浏览器

- Next.js 静态前端。
- 支持 File System Access API 的浏览器，使用用户明确选择的本机项目目录。
- 浏览器只通过 File System Access API 读写用户选中的真实文件。
- Web Worker 执行解密、合并、编译和导出。
- 不使用 OPFS，不把 LocalStorage/IndexedDB 当作项目源文件。
- 不支持目录访问的浏览器，使用源码 ZIP 导入/导出。

浏览器不能自行监听一个本地 HTTP 服务，所以浏览器预览采用 Blob/Service Worker 适配器；原生应用预览统一走内嵌 localhost HTTP 服务。

UI 必须明确区分：

```text
本地已保存
云端已同步
仅本地未备份
存在冲突
```

### iOS、Android、Windows、macOS、Linux

使用 Tauri 2 壳层复用 Web UI，并由 Rust 侧启动每个项目自己的 loopback HTTP 服务：

- 项目源文件直接保存到用户选择的项目目录；移动端保存到应用 Documents/Projects 目录。
- `.genstory/` 保存版本、同步队列、设备状态和预览会话信息。
- `preview/<session>/` 保存编译后的 OpenWebGal/Phaser 静态文件。
- HTTP 服务只监听 `127.0.0.1`，使用随机端口和随机 session token。
- 原生安全存储保存设备密钥和恢复信息。
- 原生文件选择器负责导入/导出。
- 原生壳提供通知、分享、深链和后台同步触发。

原生端本地文件是真正可工作的离线仓库；云端同步只是可选增强，不影响项目创建、编辑、预览和导出。

## 3. 本地文件仓库模型

```text
<project-root>/
  ├── AGENTS.md
  ├── meta.md
  ├── assets/
  ├── chapter-001/...
  ├── preview/
  └── .genstory/
      ├── manifest.json
      ├── revisions/
      ├── outbox/
      ├── conflicts/
      └── device.json
```

### 项目

```ts
interface LocalProject {
  id: string;
  type: ContentTypeId;
  title: string;
  lang: Lang;
  createdAt: number;
  updatedAt: number;
  localRevision: string;
  syncState: "local-only" | "syncing" | "synced" | "offline" | "conflict";
}
```

### 文档

```ts
interface LocalDocument {
  projectId: string;
  path: string;
  kind: "text" | "asset-index";
  content: string;
  contentHash: string;
  revision: string;
  updatedAt: number;
}
```

### 资产

```ts
interface LocalAsset {
  projectId: string;
  logicalId: string;
  assetType: string;
  localKey: string;
  sha256: string;
  mime: string;
  size: number;
  remoteSyncState: "local-only" | "pending" | "synced";
}
```

故事层继续只引用逻辑资产 ID，不引用本机路径：

```yaml
background: bg_forest
character: red_normal
```

## 4. 本地文件适配器

统一接口：

```ts
interface LocalProjectStore {
  listProjects(): Promise<LocalProject[]>;
  createProject(project: LocalProject, files: SourceEntry[]): Promise<void>;
  readDocument(projectId: string, path: string): Promise<LocalDocument>;
  writeDocuments(projectId: string, changes: DocumentChange[]): Promise<LocalCommit>;
  readAsset(projectId: string, localKey: string): Promise<Blob>;
  writeAsset(projectId: string, asset: Blob): Promise<LocalAsset>;
  listOutbox(projectId: string): Promise<SyncOperation[]>;
  markSynced(projectId: string, ids: string[]): Promise<void>;
  exportSource(projectId: string): Promise<Blob>;
  importSource(blob: Blob): Promise<LocalProject>;
}
```

### WebStore

优先使用用户选择的真实目录：

- Chromium：File System Access API 选择目录。
- 不能访问目录的浏览器：只提供源码 ZIP 导入/导出，不伪造“持久项目目录”。
- IndexedDB 只能保存最近打开的路径、UI 状态和临时预览缓存，不保存唯一正文。

### NativeStore

原生端不使用 SQLite 作为正文容器：

- Markdown、YAML、JS、HTML 和资产都是普通项目文件。
- `.genstory/` 只保存版本索引、同步 outbox、冲突和设备元数据。
- 需要数据库查询时可使用 SQLite 作为索引，但它不能取代项目源文件。
- 删除项目时删除项目目录和 `.genstory/`，不留下孤立缓存。

## 5. 端到端加密

### 密钥层级

```text
用户恢复密钥
    ↓ 解包
用户根密钥
    ↓ 解包
项目密钥 DEK
    ↓ 加密
文档快照 / 操作包 / 资产 manifest / 资产内容
```

建议：

- 每个项目生成独立 DEK。
- 每台设备生成设备密钥对。
- 项目 DEK 用设备公钥分别加密，云端只保存加密后的 key envelope。
- 新设备通过恢复密钥、二维码设备配对或用户确认获得项目 DEK。
- 恢复密钥只在创建时展示一次，必须支持下载/打印源码备份。
- 云端永远不持有可解密项目的明文密钥。

加密包格式：

```ts
interface EncryptedSyncEnvelope {
  id: string;
  projectIdHash: string;
  deviceId: string;
  parentRevision: string;
  vectorClock: Record<string, number>;
  kind: "document-update" | "asset-manifest" | "asset-chunk" | "tombstone";
  nonce: Uint8Array;
  ciphertext: Uint8Array;
  authTag: Uint8Array;
  hash: string;
}
```

加密发生在客户端 Worker。主线程和服务端都不处理明文同步内容。

## 6. 同步协议

### 本地优先写入

```text
用户编辑
  ↓
本地事务提交
  ├── 更新文档
  ├── 生成 revision
  └── 写入 encrypted outbox
  ↓
立即显示“本地已保存”
  ↓ 在线时异步上传密文
  ↓
显示“云端已同步”
```

本地提交不依赖网络。网络失败不能回滚用户已经完成的本地保存。

### 云端只做中继

```text
Device A
  ├── encrypt
  ├── upload envelope
  └── pull other envelopes
         ↓
Cloud relay
  ├── auth
  ├── deduplicate by hash
  ├── retain envelopes
  └── return cursor
         ↓
Device B
  ├── download
  ├── decrypt
  ├── merge locally
  └── create local revision
```

云端不做：

- 明文三方合并。
- 故事语义校验。
- 资产路径解析。
- 预览编译。
- 运行包导出。

### 冲突策略

第一阶段不强行使用实时协作 CRDT，而采用可解释的本地合并：

1. Markdown、JavaScript、JSON 使用三方文本合并。
2. YAML 使用解析后的字段级合并。
3. 二进制资产使用 hash 版本，不自动覆盖。
4. 无法合并时保存双方版本，显示冲突面板。
5. 用户选择“采用本地”“采用远端”或“手工合并”。
6. 解决结果生成新的本地 revision，再进入 outbox。

后续多人协作可把 document operation 替换成 Yjs/Automerge，不改变本地仓库和云端密文中继边界。

## 6.1 账号、设备和项目密钥

账号系统只解决“你是谁、你能同步哪些项目”，不直接作为项目解密密钥。

### 统一账号模型

```text
Account
  ├── Identity: google
  ├── Identity: apple
  ├── Identity: facebook
  ├── Identity: github
  ├── Identity: wechat
  └── Identity: qq

Account
  ├── Device: browser-chrome
  ├── Device: macos
  ├── Device: ios
  └── Device: android
```

数据库使用 provider subject 作为外部身份唯一键：

```ts
interface AccountIdentity {
  accountId: string;
  provider: "google" | "apple" | "facebook" | "github" | "wechat" | "qq";
  providerSubject: string;
  email?: string;
  displayName?: string;
  linkedAt: string;
}
```

不能用邮箱作为唯一身份，因为 Apple 私密中继邮箱、第三方邮箱变化和账号合并都会造成误绑定。

### Provider 方案

不要在 Web、Tauri、iOS、Android 里分别实现六套登录。使用一个 Identity Broker：

- Google、Apple、Facebook、GitHub：标准 OAuth/OIDC 连接。
- WeChat、QQ：通过 broker 的自定义 OAuth 连接或独立 provider adapter 接入。
- Web、桌面和移动端都只调用 GenStory.cc 的 `/auth/start` 和 `/auth/callback`。
- 后端统一产出 GenStory.cc session，不把第三方 access token 交给项目同步层。

如果使用托管 Auth 服务，应先确认 WeChat/QQ 是否有官方连接；否则采用支持自定义 provider 的身份中介，或在 API 服务中实现独立 adapter。

### Native OAuth

原生端登录使用系统浏览器或安全浏览器标签页 + PKCE + deep link/loopback callback，不把账号密码塞进 WebView。

### 项目密钥

```text
Account authentication
    ≠
Project encryption key
```

- 每个项目一个 DEK。
- 设备首次加入项目时，通过已授权设备、恢复密钥或二维码配对得到 DEK。
- 云端只保存被设备公钥包裹的 DEK。
- 换绑 Google/Apple/GitHub 等登录身份不会自动改变项目密钥。
- 用户可以在账号设置中绑定多个 provider。

## 6.2 兼容现有 Web 内容

同步协议不重写现有项目文件。当前 Web 项目的文件路径、Markdown、YAML、HTML、JavaScript、资产目录和 `AGENTS.md` 都作为原始 source tree 保留。

项目根新增的控制目录不参与故事运行：

```text
project/
  AGENTS.md
  meta.md
  assets/
  chapter-001/
  .genstory/
    manifest.json
    source-id
    revisions/
    sync/
```

兼容规则：

1. 未识别的文件原样保留并同步。
2. 已有 `meta.md`、`script.md`、`stage.yml`、`assets/index.yml` 不迁移成数据库字段。
3. Web 预览需要的 `/webgal`、`/game`、`vendor` 目录由 localhost 预览服务提供，不写入故事源文件。
4. 现有 Web 项目首次同步时生成 `projectId` 和 `sourceId`，不改变用户源文件内容。
5. 从 ZIP、旧 OPFS 或另一设备导入的项目，都先进入本地源项目，用户确认后再加入远端同步流。

## 6.3 多源同步与合并

“同一项目在不同设备继续编辑”和“两个独立源项目合并”都使用 source lineage，但入口不同。

### 设备继续编辑

```text
同一个 projectId
  ├── source-id: macos
  ├── source-id: ios
  └── source-id: browser
```

同步时按共同祖先 revision 做三方合并。

### 独立源项目合并

```text
project-a/source-a
project-b/source-b
        ↓ 用户选择“合并到新项目”
merge workspace
  ├── source-a branch
  ├── source-b branch
  └── merge result
```

独立源没有共同祖先时：

1. 先按相对路径匹配文件。
2. 同路径同 hash 直接复用。
3. 一方新增文件直接加入。
4. 同路径文本文件执行无共同祖先的双向合并，并生成冲突标记。
5. `assets/index.yml` 按逻辑资产 ID 合并。
6. 同一逻辑 ID 指向不同 hash 时进入资产冲突。
7. 合并结果写入新的本地项目目录和新的 merge revision。
8. 原始两个源保留，不覆盖、不删除。

合并必须是显式动作，不能因为两个项目标题相同就自动合并。

## 7. 预览和导出

所有预览从本地项目文件读取：

```text
LocalProjectStore
  → SourceSnapshot
  → ContentTypeAdapter.validate
  → ContentTypeAdapter.compile
  → PreviewHost
```

### 原生应用：本地文件 + HTTP 服务

每次预览创建一个短生命周期 session：

```text
项目源文件
  → 编译到 <project>/preview/<session>/
  → 启动 127.0.0.1:<random-port>
  → /runtime/*  引擎静态资源
  → /game/*     编译后的游戏文件
  → WebView iframe / 浏览器
```

HTTP 服务要求：

- 只监听 loopback。
- 每个 URL 带不可猜的 session token。
- 只允许读取当前项目的 `preview/<session>/`。
- 禁止目录穿越、任意文件读取和跨项目访问。
- 页面关闭或预览切换后停止服务并删除临时产物。

VN 预览直接提供 OpenWebGal 的 `index.html`、引擎资源和 `game/*`，使用原始 Service Worker；不使用 IndexedDB bridge。

Phaser 预览直接提供项目的 `index.html`、`src/`、图片、音频、JSON 和其他资产，所有相对路径按真实 HTTP 项目根解析。

### 浏览器 Host

浏览器端不能自启 loopback 服务时：

- Chromium 用户目录：通过 Blob URL 或受控 Service Worker 映射虚拟文件。
- 不支持目录访问的浏览器：显示“请使用原生应用或导入源码 ZIP”。

平台 Host：

| 平台 | 预览方式 |
|---|---|
| 浏览器 | sandbox iframe、Blob URL、必要时使用专用 SW |
| Tauri 桌面 | `http://127.0.0.1:<port>/preview/<token>/` |
| Tauri 移动 | `http://127.0.0.1:<port>/preview/<token>/` |

Service Worker 只作为浏览器优化；原生端以 localhost HTTP 为基础设施。

导出：

- 源码 ZIP 从本地仓库导出。
- OpenWebGal、Phaser、互动视频运行包从本地编译结果导出。
- 不需要联网。
- 不需要登录。
- 不需要读取云端。

## 8. 内容类型统一适配器

```ts
interface ContentTypeAdapter {
  type: ContentTypeId;
  createTemplate(input: CreateProjectInput): Promise<SourceEntry[]>;
  read(source: SourceSnapshot): Promise<unknown>;
  validate(source: SourceSnapshot): Promise<ValidationIssue[]>;
  compile(source: SourceSnapshot): Promise<CompiledProject>;
  preview(compiled: CompiledProject, host: PreviewHost): Promise<void>;
  export(compiled: CompiledProject): Promise<Blob>;
  import(source: ImportedSource): Promise<ImportedProject>;
}
```

适配器：

| 类型 | 本地源文件 | 本地运行 |
|---|---|---|
| book | 章节 Markdown、插图索引 | HTML 阅读器 |
| comic | 页面、分镜、图片 | 漫画阅读器 |
| visual-novel | `script.md`、`stage.yml`、资产索引 | OpenWebGal |
| interactive-video | 视频、音频、节点 manifest | HTML5 runtime |
| phaser-game | HTML、JavaScript、资产索引 | Phaser runtime |

## 9. 平台能力抽象

```ts
interface PlatformServices {
  kind: "web" | "tauri";
  localStore: LocalStore;
  filePicker: FilePickerService;
  secureKeys: SecureKeyService;
  share: ShareService;
  notifications: NotificationService;
  previewHost: PreviewHost;
}
```

前端组件不得直接访问：

- `window.__TAURI__`
- SQLite 驱动
- IndexedDB transaction
- 原生文件路径
- 云端 API token

这些都必须留在 `lib/platform/`、`lib/storage/` 或 `lib/sync/`。

## 10. 实施阶段

### Phase 0：移除 OPFS 依赖边界

文件：

- Create: `lib/core/source.ts`
- Create: `lib/core/project.ts`
- Create: `lib/storage/types.ts`
- Create: `lib/platform/index.ts`
- Modify: `app/projects/editor/editor-client.tsx`
- Modify: `lib/local-projects.ts`

任务：

- 定义本地仓库接口。
- 把编辑器从 `FileSystemDirectoryHandle` 解耦。
- 现有 OPFS 项目只作为一次性迁移输入。
- 新项目禁止写入 OPFS。

验收：

- 新建项目不创建 OPFS 目录。
- 编辑器只依赖 `LocalStore`。

### Phase 1：Web 本地文件仓库

文件：

- Create: `lib/storage/web/file-access-store.ts`
- Create: `lib/storage/web/browser-fallback.ts`
- Create: `lib/core/transactions.ts`
- Modify: `lib/project-templates.ts`
- Modify: `app/projects/new/new-client.tsx`

任务：

- 模板直接写入用户选择的真实目录。
- `.genstory/` 写入版本和同步状态。
- 不支持目录 API 时只允许 ZIP 导入/导出。
- 加入源码 ZIP 导入/导出。

验收：

- 断网创建、编辑、预览、导出全部可用。
- 刷新页面后项目仍可打开。

### Phase 2：端到端加密与云端中继

文件：

- Create: `lib/crypto/keys.ts`
- Create: `lib/crypto/envelope.ts`
- Create: `lib/sync/client.ts`
- Create: `lib/sync/outbox.ts`
- Create: `server/relay/*`

任务：

- 生成设备密钥和项目 DEK。
- 加密文档、revision、资产 manifest。
- 云端只提供鉴权、密文保存、去重和 cursor。
- 实现重试、断点续传和本地状态提示。

验收：

- 服务端日志和数据库中没有项目明文。
- 清空 Web 本地数据后用恢复密钥重新下载并解密项目。

### Phase 3：冲突和版本历史

文件：

- Create: `lib/sync/merge-markdown.ts`
- Create: `lib/sync/merge-yaml.ts`
- Create: `lib/sync/conflicts.ts`
- Modify: `app/projects/editor/editor-client.tsx`
- Create: `app/projects/editor/conflict-panel.tsx`

任务：

- 实现版本向量。
- 文本三方合并。
- YAML 字段级合并。
- 二进制资产版本冲突。
- 冲突解决后生成新 revision。

验收：

- 两台设备离线修改同一文件不会静默覆盖。
- 用户可以查看双方内容并完成合并。

### Phase 4：Tauri 原生端和 localhost 预览服务

文件：

- Create: `src-tauri/*`
- Create: `lib/platform/tauri.ts`
- Create: `lib/runtime/local-http-preview-host.ts`
- Create: `src-tauri/src/preview_server.rs`

任务：

- 接入真实项目目录和 `.genstory/` 状态目录。
- 实现 Rust loopback HTTP 服务。
- 接入系统密钥存储。
- 接入打开/保存/分享/通知。
- 为 VN 和 Phaser 提供真实静态文件 URL。
- 配置 Windows、macOS、Linux、iOS、Android 构建。

验收：

- 五类项目可离线编辑、预览和导出。
- 删除预览缓存后可以从项目源文件重新编译。

### Phase 5：旧 OPFS 项目迁移

文件：

- Create: `lib/migrations/opfs-import.ts`
- Modify: `lib/project-import.ts`
- Modify: `app/projects/projects-client.tsx`

迁移流程：

```text
选择旧 OPFS 项目
  → 读取源文件
  → 写入 LocalStore
  → 生成本地 revision
  → 用户选择是否加密同步
  → 验证通过后标记迁移完成
```

旧目录读取失败时不得删除索引或创建空项目。

### Phase 6：全端验收

```text
浏览器：Chrome / Safari / Firefox
原生：Windows / macOS / Linux / iOS / Android
```

必须验证：

1. 不联网创建和编辑项目。
2. 本地预览和独立导出。
3. 联网后上传加密 outbox。
4. 另一设备下载、解密和合并。
5. 服务端无法读取项目明文。
6. 清除浏览器站点数据后恢复。
7. 原生端清除 App Data 后恢复。
8. 同一文件产生冲突后可见、可解决。
9. 资产上传中断后可继续。
10. 删除项目后密文和本地缓存都按策略回收。

## 11. 不在范围

- 云端保存明文项目。
- 云端作为唯一真源。
- 云端执行故事合并或预览编译。
- 新项目继续使用 OPFS。
- 同时维护 Electron 和 Capacitor 两套原生壳。
- 第一阶段实时多人协作。

## 12. 完成标准

1. 六个平台都能在离线状态创建、编辑、预览和导出。
2. 本地提交不依赖网络。
3. 云端只保存端到端加密同步包。
4. 服务端无法读取项目明文。
5. 多设备同步由客户端解密和合并。
6. 冲突不会静默覆盖。
7. 浏览器目录或源码备份可以重新导入；原生端删除预览缓存后可以从项目源文件重新编译。
8. 原生端使用真实项目文件目录和 localhost HTTP 预览服务，不使用 OPFS；SQLite 仅可作为索引。
9. 现有视觉小说规则、资产逻辑 ID 和舞台模型保持不变。
