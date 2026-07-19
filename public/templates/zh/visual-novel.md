# AGENTS.md

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
│   ├── voice/
│   └── ui/
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

```text
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

## 舞台模型

场景描述**状态**，绝不写渲染指令。

推荐：

- background
- characters
- expression
- pose
- position
- motion
- music

禁止：

- playAnimation(...)
- changeFigure(...)
- hide(...)
- show(...)

状态变化是增量式的。

---

## 资产

仅使用逻辑 ID。

绝不引用文件路径。

所有资产统一索引于：

```text
assets/index.yml
```

菜单页背景使用固定项目路径：

```text
assets/ui/menu-background.png
```

该文件不写入舞台状态；预览和导出会将其编译为 OpenWebGal 的 `game/background/Title.png`。

可用资产类型保持开放，例如：

- Character
- Background
- CG
- Motion
- Effect
- BGM
- SFX
- Voice
- UI
- Font
- Video
- Prop
- Tachie
- Transition
- Ambience
- Palette

---

## 工作流

```text
理解
    ↓
规划
    ↓
生成
    ↓
校验
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
