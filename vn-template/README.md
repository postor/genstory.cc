# 视觉小说项目模板（小红帽示例）

本模板演示如何按照 GenStory.cc 仓库 `AGENTS.md` 中的「视觉小说项目规则」编写一个**可玩的视觉小说**，
并将其构建为 **OpenWebGal** 项目，支持本地预览与一键导出 `.zip`。

示例故事为经典童话《小红帽》的简化改编，包含完整第一章与多个场景、一个分支选择。

---

## 目录结构

```text
vn-template/
├── package.json          # 脚本：build / preview / export
├── README.md            # 本文件
├── source/              # 源文件（遵循 AGENTS.md 约定，是「事实的唯一来源」）
│   ├── meta.md          # 项目元数据（含 frontmatter）
│   ├── assets/
│   │   └── index.yml    # 资产索引：逻辑 ID → 类型 / 文件 / 名称
│   └── chapter-001/
│       ├── meta.md
│       └── scenes/
│           ├── scene-001/ { meta.md, script.md, stage.yml }
│           ├── scene-002/ { meta.md, script.md, stage.yml }
│           └── scene-003/ { meta.md, script.md, stage.yml }
├── scripts/             # 构建工具（纯 Node，无前端框架依赖）
│   ├── lib/png.mjs      # 生成占位图（无需真实美术即可预览）
│   ├── lib/compile.mjs  # 源文件 → OpenWebGal 项目 的编译器
│   ├── build.mjs        # npm run build
│   ├── preview.mjs      # npm run preview（零依赖静态服务器）
│   └── export.mjs       # npm run export（打包 zip）
├── dist/               # 构建产物（OpenWebGal 项目，自动生成，已 gitignore）
└── export/             # 导出的 zip（自动生成，已 gitignore）
```

> 约定说明：源文件只描述「状态」（舞台模型），不含任何渲染指令；
> 对话与呈现分离，资产只用逻辑 ID，所有资产统一登记在 `assets/index.yml`。

---

## 使用方法

```bash
cd vn-template
npm install          # 安装 webgal-engine / js-yaml / adm-zip
npm run build        # 编译 source/ → dist/（OpenWebGal 项目）
npm run preview      # 启动本地预览（http://localhost:3000）
npm run export       # 导出 dist/ 为 export/redhood-openwebgal.zip
```

### 预览（Preview）
`npm run preview` 会启动一个本地静态服务器并自动打开浏览器，加载 `dist/` 中的 OpenWebGal 引擎与游戏。
**必须通过 HTTP 访问**（直接双击 `index.html` 会被浏览器的模块/CORS 限制拦截，无法运行）。

### 导出（Export）
`npm run export` 将整个 `dist/` 打包为 `export/redhood-openwebgal.zip`。
该 zip 是一个**完整、自包含的 OpenWebGal 项目**，可直接部署到任意静态服务器，
或用 OpenWebGal Editor 的「Export to Web」流程继续编辑。

---

## 替换为真实美术 / 音频

构建时会优先拷贝 `source/assets/<类型目录>/` 下已生成的真实素材
（本模板已用 **GPT Image 2** 生成《小红帽》示例图，对应的生成 prompt 保留在 `assets/index.yml` 的 `prompt` 字段）；
若某资产缺失，则自动生成**占位图**（纯色 PNG），因此始终可以预览。
要替换素材，只需把同名文件放到 `source/assets/<类型目录>/` 或构建产物对应目录：

- 背景：`dist/game/background/<file>`
- 立绘：`dist/game/figure/<file>`
- 背景音乐：`dist/game/bgm/<file>`（在 `stage.yml` 或脚本中用 `bgm:` 引用）
- 音效 / 配音：`dist/game/vocal/` 或 `dist/game/sfx/`

资产文件名由 `source/assets/index.yml` 中的 `file` 字段决定。

---

## 源文件格式速查

- `stage.yml`（场景状态，非渲染指令）：
  ```yaml
  background: bg_forest
  characters:
    - id: fig_red
      expression: 普通
      pose: 站立
      position: left      # left | right | center
  music: null
  ```
- `script.md`（对话与叙事，使用 ASCII 冒号）：
  ```markdown
  # 旁白（# 开头的行是场景提示，会转为注释）
  : 这是一句旁白。
  小红帽: 这是一句角色对话。
  >> 选项A:scene-002 | 选项B:scene-003      # 分支选择
  changeScene:scene-002.txt;                   # 跳转到下一场景
  end;                                         # 回到标题
  ```
- `assets/index.yml`：逻辑 ID 统一登记，类型包括 Background / Character / CG 等。
