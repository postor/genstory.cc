# AGENTS.md

## 使命

维护本互动视频项目的长期一致性。

优先级：

- 正典
- 角色状态
- 时间线
- 视听连续性
- 分支逻辑
- 资产复用

互动视频由片段、时间轴、选择点、视频、音频和场景图组成。故事事实与播放逻辑必须分离。

---

## 命名约定

常用文件名：

- `meta.md` — 元数据
- `script.md` — 旁白、对白与片段正文
- `timeline.yml` — 片段内时间轴状态
- `choices.yml` — 选择点与分支
- `design.*` — 视觉 / 听觉参考
- `final.*` — 最终生成结果

一个事实，一个来源。

---

## 仓库结构

```text
/
├── meta.md
├── references/
├── assets/
│   ├── index.yml
│   ├── scenes/
│   ├── videos/
│   ├── audio/
│   ├── characters/
│   └── ui/
│
└── chapter-001/
    ├── meta.md
    ├── characters/
    ├── locations/
    └── segments/
        └── segment-001/
            ├── meta.md
            ├── script.md
            ├── timeline.yml
            └── choices.yml
```

---

## 上下文优先级

```text
project
    ↓
chapter
    ↓
segment
    ↓
characters
    ↓
locations
    ↓
references
    ↓
current task
```

高优先级覆盖低优先级。

---

## 时间轴模型

片段时间轴描述**状态**和**语义事件**，不写播放器实现细节。

推荐：

- video
- voice
- music
- caption
- choice
- state

禁止：

- player.seek(...)
- element.play()
- DOM 操作
- 外部绝对路径

---

## 资产

仅使用逻辑 ID。所有资产统一登记在：

```text
assets/index.yml
```

常用资产类型：

- Background
- Character
- Video
- Voice
- BGM
- SFX
- UI
- Transition
- Prop

视频生成资产建议字段：

- `model` — OpenRouter 视频模型 slug，例如 `google/veo-3.1-lite`
- `duration` — 片段秒数，必须符合模型支持范围
- `resolution` — 输出分辨率，例如 `720p`
- `aspect_ratio` — 画幅，例如 `16:9`
- `generation_status` — `planned`、`submitted`、`completed`、`failed`

---

## OpenRouter 视频生成

视频生成由项目工具完成，结果不会自动写入故事文件或下载到本地磁盘。

流程：

- 用 `genstory_submit_openrouter_video_generation` 提交生成任务，并记录返回的任务 ID 与状态。
- 用 `genstory_poll_openrouter_video_generation` 查询任务进度；只有状态完成后才能保存视频。
- 用 `genstory_save_openrouter_video_result` 在用户确认后把完成结果写入 `assets/videos/*.mp4`。
- 保存后更新 `assets/index.yml` 的逻辑 ID、文件位置和生成状态。
- 失败、取消或过期时要明确说明，不要把未完成任务登记为最终资产。

不需要让用户手动调用额外的“fetch tool”；使用上面的项目工具即可。

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

- 正典
- 时间线
- 角色状态
- 选择点可达性
- 资产引用
- 视听连续性

---

## 规则

始终：

- 分离故事、时间轴与播放实现。
- 复用已有视频、图片和音频资产。
- 保持分支可追踪、可回收。
- 将稳定知识向上层沉淀。

绝不：

- 在脚本中硬编码文件系统路径。
- 把播放器代码写进故事文件。
- 创建无法到达或无法返回的分支，除非明确设计为结局。
- 重复设定或资产事实。
