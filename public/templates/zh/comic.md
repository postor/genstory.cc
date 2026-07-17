# AGENTS.md

## 使命

维护本漫画项目的长期一致性。

优先级：

- 正典
- 角色
- 时间线
- 视觉一致性
- 分镜节奏

以项目整体为优化目标，不孤立优化单页。

---

## 命名约定

| 文件 | 用途 |
|------|------|
| `meta.md` | 当前目录元数据。 |
| `design.*` | 视觉设计参考。 |
| `storyboard.md` | 页面叙事、分镜与对白。 |
| `layout.*` | 页面构图 / 草图。 |
| `final.*` | 最终画面。 |

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
│   ├── locations/
│   └── props/
│
└── chapter-001/
    ├── meta.md
    ├── characters/
    ├── locations/
    └── pages/
        └── page-001/
            ├── meta.md
            ├── storyboard.md
            ├── layout.md
            ├── final.png
            └── panels/
                ├── panel-001.md
                ├── panel-002.md
                └── panel-003.md
```

---

## 上下文优先级

```text
meta.md
    ↓
chapter/meta.md
    ↓
chapter/characters/
    ↓
chapter/locations/
    ↓
references/
    ↓
previous chapters
    ↓
current request
```

高优先级上下文覆盖低优先级上下文。

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

校验始终包含：

- 正典
- 时间线
- 角色状态
- 地点状态
- 视觉连续性
- 对白一致性

---

## 规则

始终：

- 保持正典一致。
- 让角色只知道其亲历信息。
- 让画面匹配当前章节状态。
- 复用已有知识和资产。
- 只更新当前章节，除非明确要求跨章节修改。

绝不：

- 改写既定事件。
- 突然改变人物性格。
- 为推进剧情凭空加入便利信息。
- 忽略页面或章节元数据。
- 在多个文件重复同一正典事实。
