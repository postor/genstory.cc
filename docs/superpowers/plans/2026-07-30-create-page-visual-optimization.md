# 创建页视觉优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `/projects/new` 改成卡片直接打开命名弹窗的创建流程，同时复用首页视觉并保持顶部栏不变。

**Architecture:** 仅修改创建页客户端组件和创建页源代码测试。页面主体负责展示类型卡片；点击卡片设置 `createTemplate` 并生成默认标题；Dialog 承载命名输入、创建和取消；原创建初始化、保存、埋点和跳转流程继续复用。

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, shadcn/ui primitives, Tailwind CSS v4, lucide-react.

---

### Task 1: 重构创建状态

**Files:**
- Modify: `app/projects/new/new-client.tsx`

- [x] **Step 1: 去掉页面选中态**

移除以 `template` 作为页面选中状态的展示方式，改为 `createTemplate: ContentTypeId | null` 表示当前弹窗要创建的类型。

- [x] **Step 2: 默认命名进入弹窗**

点击类型时调用 `nextDefaultProjectTitle(type, lang, projects)`，将结果写入弹窗输入框 value。用户清空输入后提交时，再用最新项目列表重新计算默认命名兜底。

- [x] **Step 3: 明确去掉隐式预选**

页面不再使用 `?template=` 做隐式选中或自动弹窗，避免和“点击卡片或 Go 才弹窗”的交互冲突。

### Task 2: 调整卡片展示

**Files:**
- Modify: `app/projects/new/new-client.tsx`

- [x] **Step 1: 去掉选中表现**

删除选中边框、勾选图标、加号图标、`aria-pressed` 和当前选择说明。

- [x] **Step 2: 添加标题行 Go**

每张卡片标题行右侧显示 `Go` 操作。为了避免嵌套按钮，整张卡片是一个 button，`Go` 是卡片内的视觉操作区域；点击卡片或 `Go` 都触发同一个弹窗。

- [x] **Step 3: 移动端直接展示卡片**

移动端不再使用选中大卡/未选中紧凑行的手风琴表现，直接展示与桌面同一套卡片结构。

### Task 3: 实现命名弹窗

**Files:**
- Modify: `app/projects/new/new-client.tsx`

- [x] **Step 1: 使用 shadcn Dialog**

引入 `Dialog`、`DialogContent`、`DialogHeader`、`DialogTitle`、`DialogDescription`、`DialogFooter`，用项目原始弹窗 primitive 实现命名确认。

- [x] **Step 2: 输入框默认命名并自动聚焦**

弹窗内 `Input` 使用默认命名作为 value，并设置 `autoFocus`。输入框样式复用创建页紫色边框和焦点 ring。

- [x] **Step 3: 底部创建和取消**

弹窗底部放置取消按钮和创建按钮。创建按钮复用紫色主按钮风格，提交中显示 `Loader2` 并禁用按钮。

### Task 4: 测试与验证

**Files:**
- Modify: `app/projects/new/new-client.test.ts`

- [x] **Step 1: 更新源代码断言**

断言卡片复用 `type-icons` 和 `fg.png`，保留 `xl:grid-cols-[minmax(0,1fr)_320px]`，引入 Dialog，存在 `autoFocus` 和 `Go`，且不再出现 `aria-pressed`、`CheckCircle2` 或顶部栏引用。

- [ ] **Step 2: 运行验证**

Run:

```powershell
node --experimental-strip-types --test app/projects/new/new-client.test.ts
npx eslint app/projects/new/new-client.tsx app/projects/new/new-client.test.ts
npx tsc --noEmit --pretty false
npm run build
```

Expected: 全部通过；若全仓存在无关脏文件导致失败，先定位根因并只在本次范围内修复。

- [ ] **Step 3: 浏览器验证**

在桌面和移动视口检查：

- 顶部栏保持原样。
- 类型卡片无选中态，移动端直接展示卡片。
- 点击卡片和 `Go` 都打开弹窗。
- 弹窗输入框默认命名并自动 focus。
- 取消关闭弹窗，创建按钮继续触发现有创建流程。
- 页面没有横向溢出或文字裁切。
