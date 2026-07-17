# 视觉小说（Visual Novel）浏览器内创作方案

> 状态：已采用。GenStory 是无后端、SSG 的浏览器应用。视觉小说项目的正文和资产
> 来源保存在浏览器 Origin Private File System 中；IndexedDB 只保存项目索引、时间戳
> 和 UI 状态。

## 目标

用户在浏览器内完成：

```text
初始化（模板 + AGENTS.md）
    ↓
读取真实项目文件
    ↓
编辑并保存真实项目文件
    ↓
从真实文件编译预览
    ↓
导出独立 OpenWebGal zip
```

不需要后端、API Route、常驻编译服务或磁盘 CLI。Next.js 只负责 SSG；浏览器端
组件在用户操作后调用 File System Access API。

## 目录与持久化

创建项目时不需要上传文件，也不需要选择父目录。应用直接在浏览器的 Origin Private
File System 中根据类型和项目 ID 自动创建：

```text
<opfs>/<type>/<projectId>/
```

例如：

```text
<opfs>/visual-novel/2e.../
├── AGENTS.md
├── meta.md
├── assets/
│   ├── index.yml
│   ├── backgrounds/
│   └── characters/
└── chapter-001/
    └── scenes/
        └── scene-001/
            ├── meta.md
            ├── script.md
            └── stage.yml
```

浏览器私有文件目录是唯一的项目正文来源。IndexedDB 不保存 `content`、`vn` 或文件
内容副本，只保存：

```ts
interface Project {
  id: string;
  template: ContentTypeId;
  title: string;
  lang: "zh" | "en";
  createdAt: number;
  updatedAt: number;
  lastOpenedPath?: string;
}
```

项目目录始终由 `template + id` 解析为 `<type>/<projectId>`，不依赖用户选择的父目录，也不能用缓存
内容伪造文件树。需要让用户取出项目时，通过导出 ZIP 完成。

## 模板初始化

新项目初始化就是把项目类型模板和根部 `AGENTS.md` 写入真实目录。所有类型至少
包含 `AGENTS.md` 与 `meta.md`，并拥有自己的章节、页面、场景或片段源文件。

视觉小说模板来自小红帽示例，包含完整的：

- `meta.md`
- `assets/index.yml`
- `chapter-001/meta.md`
- `chapter-001/scenes/*/meta.md`
- `chapter-001/scenes/*/script.md`
- `chapter-001/scenes/*/stage.yml`
- `assets/` 下的模板图片

模板中不生成 `test2.md`，也不生成以项目标题命名的随机 markdown 文件。

## 视觉小说数据约定

- 故事与呈现分离。
- `script.md` 保存叙事和对白。
- `stage.yml` 只描述背景、角色、表情、姿势、位置等舞台状态，不写渲染调用。
- `assets/index.yml` 是资产索引，故事文件只引用逻辑资产 ID。
- `AGENTS.md` 是可编辑的 AI 约束文件，也是聊天上下文的第一来源。

`lib/vn/source-reader.ts` 从真实目录读取这些文件，解析成编译器使用的临时
`VNProject`。该对象只存在于当前编辑或预览操作期间，不写回 IndexedDB。

## 编辑器

编辑器打开项目时：

1. 读取 IndexedDB 中的项目索引。
2. 通过 `navigator.storage.getDirectory()` 打开 OPFS 根目录。
3. 递归枚举真实项目目录，文件树只显示该目录中的条目。
4. 按需读取文件，编辑缓冲区只存在于当前页面内。
5. 保存时通过适配层写回对应真实文件。

视觉小说结构化编辑器是 `meta.md`、`script.md`、`stage.yml` 等真实文件的视图。
保存结构化修改会写入受影响的真实文件；刷新或重新打开项目后仍从这些文件读取。

AI 上下文按以下顺序从磁盘读取：

```text
AGENTS.md → 项目/章节/场景 meta.md → 当前选中的源文件
```

## 预览与导出

预览流程：

1. 从当前项目目录读取 `meta.md`、`assets/index.yml`、场景脚本和舞台状态。
2. 在内存中编译为 OpenWebGal `game/*` 文件。
3. 写入浏览器预览缓存，供 vendored OpenWebGal iframe 读取。

预览缓存只是运行时缓存，不是项目来源。导出 zip 时使用真实源文件编译结果和引擎
资源，并还原原始引擎 Service Worker，不把浏览器桥接 SW 带入独立项目。

## SSG 与浏览器 API

客户端组件在构建期间只渲染静态壳；`window`、`navigator.storage` 和
`indexedDB` 只在用户交互或 `useEffect` 中访问。应用不依赖服务器端
文件系统，也不提供 API Route。

## 验证

```text
npm run lint
npm run build
node --experimental-strip-types --test lib/**/*.test.ts
git diff --check
```

浏览器验证必须覆盖：创建多个类型项目、确认目录为
`<opfs>/<type>/<projectId>`、编辑保存真实文件、刷新后内容仍在，以及视觉小说预览
和导出。
