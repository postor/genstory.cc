# 创建页视觉优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按 `docs/design/create` 的桌面与移动设计稿优化 `/projects/new` 主体，同时复用首页视觉并保持顶部栏和创建业务逻辑不变。

**Architecture:** 仅修改 `app/projects/new/new-client.tsx`，通过现有 shadcn `Card`、`Button`、`Input` 和首页使用的类型图片实现创建页主体。桌面端使用双栏布局，移动端使用选中大卡与未选中紧凑行；业务状态和提交函数保持原有接口。

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, shadcn/ui primitives, Tailwind CSS v4, lucide-react.

---

### Task 1: 建立创建页共享视觉数据和页面背景

**Files:**
- Modify: `app/projects/new/new-client.tsx`

- [ ] **Step 1: 引入页面视觉所需组件与数据**

加入 `Image`、`ArrowRight`、`ChevronDown`、`Feather`、`Sparkles` 等图标，并定义与首页一致的 `typeImages` 映射，以及按类型提供助手副标题的本地文案映射。映射只引用逻辑类型 ID 和已有 `/home/type-icons/*.png` 资产。

- [ ] **Step 2: 运行针对页面的类型检查**

Run: `npx tsc --noEmit`

Expected: 现有页面仍可通过类型检查；新增映射中的 key 必须覆盖 `ContentTypeId`。

### Task 2: 重组创建页桌面主体

**Files:**
- Modify: `app/projects/new/new-client.tsx`

- [ ] **Step 1: 保持现有提交逻辑，只替换 JSX 布局**

保留 `handleSubmit`、`notice`、`submitting`、`template` 和 `title` 状态，只将返回的 `<main>` 改为：

```tsx
<main className="relative overflow-hidden bg-[linear-gradient(180deg,#f7f3ff_0%,#ffffff_38%,#fbfaff_100%)] text-[#121331]">
  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(190,162,255,0.26),transparent_38%)]" />
  <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
    {/* title row */}
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
      {/* form */}
      {/* assistant */}
    </div>
  </div>
</main>
```

标题、副标题和取消按钮保持原有文案与导航行为，仅使用首页的深紫、淡紫边框和按钮样式。

- [ ] **Step 2: 使用首页卡片令牌承载类型选择**

桌面端类型卡沿用首页 `Card` 组合：白色半透明背景、`border-[#e9e5fb]`、柔和紫色阴影、hover 上浮；图片放在固定高度容器内并使用 `object-contain`。选中状态使用紫色边框、`ring-2`、轻紫背景和 `CheckCircle2`。

- [ ] **Step 3: 加入 CC 助手说明区**

在桌面右栏加入一个 `Card`，使用已有 `/home/fg.png` 和静态说明行；卡片只是辅助视觉，不改变创建流程，也不添加不可实现的按钮。

### Task 3: 实现移动端选中大卡与紧凑行

**Files:**
- Modify: `app/projects/new/new-client.tsx`

- [ ] **Step 1: 为类型选择提供响应式两种表现**

使用 Tailwind 响应式类：
- `sm` 以下：选中项显示图片、标题、描述和收起图标；未选中项显示缩略图、标题和 `Plus`。
- `sm` 以上：所有类型继续使用首页风格的网格卡。

所有条目继续是 `button`，保留 `aria-pressed` 和 `onClick={() => setTemplate(c.id)}`。

- [ ] **Step 2: 让输入和主操作匹配设计稿**

作品名称区域使用带 `Feather` 图标的包裹布局，内部继续使用 shadcn `Input`，不使用 inline style。创建按钮在移动端 `w-full`，桌面端保持合理宽度；提交中保留 loader。

- [ ] **Step 3: 移动助手区和底部安全间距**

在移动端把助手卡放到表单之后，并给页面底部添加足够 padding，确保主按钮和助手内容不被固定导航或浏览器边缘遮挡。

### Task 4: 补充源代码回归测试

**Files:**
- Modify: `app/projects/new/new-client.test.ts`

- [ ] **Step 1: 添加页面视觉结构断言**

增加轻量源代码断言，覆盖：

```ts
assert.match(source, /home\/type-icons/);
assert.match(source, /xl:grid-cols-\[minmax\(0,1fr\)_320px\]/);
assert.match(source, /aria-pressed/);
  assert.match(source, /home\/fg\.png/);
```

- [ ] **Step 2: 运行创建页测试**

Run: `node --experimental-strip-types --test app/projects/new/new-client.test.ts`

Expected: PASS。

### Task 5: 全量验证与浏览器截图检查

**Files:**
- Modify: `app/projects/new/new-client.tsx` only if verification finds a defect.

- [ ] **Step 1: 运行 lint 和 TypeScript**

Run: `npm run lint`
Run: `npx tsc --noEmit`

Expected: PASS。

- [ ] **Step 2: 启动开发服务器并检查 `/projects/new`**

Run: `npm run dev`

检查桌面视口与移动视口：
- 顶部栏保持原样。
- 类型图片和选中状态可见。
- 输入框、取消按钮、创建按钮不溢出。
- 切换类型后 placeholder 和选中表现更新。

- [ ] **Step 3: 使用浏览器截图进行视觉回归**

保存桌面和移动截图，检查背景层次、卡片密度、按钮层级、助手卡位置和移动端底部安全区；若出现溢出或文字裁切，优先调整 Tailwind 断点和间距，不修改顶部栏。
