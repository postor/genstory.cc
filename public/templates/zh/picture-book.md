# AGENTS.md

## 绘本使命

维护横版画面、文字和配音共同组成的连续阅读体验。

## 项目结构

```text
/
├── meta.md
└── chapter-001/
    └── pages/
        └── page-001/
            ├── meta.md
            ├── story.md
            ├── page.png
            └── voice.mp3
```

## 页面规则

- 每页的 `story.md`、`page.png` 和 `voice.mp3` 必须放在同一页目录中。
- `story.md` 保存故事文字和覆盖层参数：`text_position`、`text_size`、`text_color`、`text_stroke`、`text_width`。
- 页面用 `order` 或文件名保持稳定顺序，图片默认使用横版构图。
- 配音是页面状态的一部分；缺少配音时仍应保留可阅读的文字。
- 文字是铺在插画上的状态，不把播放函数或渲染函数写入故事文件。

## 项目封面

- 根目录的 `cover.jpg` 或 `cover.png` 是作品卡片和继续创作卡片显示的封面图；系统会优先读取 `cover.jpg`，找不到时读取 `cover.png`。
- 封面图只用于项目列表展示，不是页面图片或配音资产；若同一图片也参与绘本页面，需另行登记到 `assets/index.yml`。
- 推荐使用接近 2.2:1 的横版构图，主体清晰居中，避免重要文字和角色贴近边缘。

## 校验流程

理解设定与时间线，编辑页面，检查资产索引和角色状态，再预览翻页、播放配音并导出 PDF。
