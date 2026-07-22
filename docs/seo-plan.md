# GenStory.cc SEO 方案

## 目标

GenStory.cc 的公开 SEO 入口必须覆盖产品真实能力，而不是只为视觉小说提供一个入口。目标是让搜索引擎可以分别理解：

- GenStory.cc 是什么：本地优先、浏览器内运行的故事与游戏创作工作台。
- GenStory.cc 支持什么：图书、漫画、视觉小说、互动视频和 Phaser 游戏。
- GenStory.cc 如何交付：源码 ZIP、浏览器预览，以及 OpenWebGal 可运行项目导出。
- 每个页面服务哪种搜索意图：了解产品、选择创作类型、了解导出方式或开始创作。

## URL 与语言结构

公开页面使用稳定的静态 URL：

| 页面 | 中文 | English | 主要意图 |
| --- | --- | --- | --- |
| 首页 | `/zh` | `/en` | 产品认知与总入口 |
| 图书 | `/zh/book` | `/en/book` | 浏览器写作、长篇叙事 |
| 漫画 | `/zh/comic` | `/en/comic` | 分镜、页面、视觉资产 |
| 视觉小说 | `/zh/visual-novel` | `/en/visual-novel` | 视觉小说编辑与预览 |
| 互动视频 | `/zh/interactive-video` | `/en/interactive-video` | 时间线、媒体、分支选择 |
| Phaser 游戏 | `/zh/phaser-game` | `/en/phaser-game` | Phaser 浏览器游戏开发 |

每个公开页面都应具备：

- 唯一 `<title>` 和 description。
- 页面级关键词，而不是全站复制同一组关键词。
- canonical、中文/英文 hreflang 和 x-default。
- Open Graph 与 Twitter Card。
- 服务端生成的可读正文和内部链接。
- `WebPage`、`BreadcrumbList`；有 FAQ 时增加 `FAQPage`。

## 关键词分组

### 中文

- 品牌：`GenStory.cc`、`GenStory.cc 创作工具`
- 总类目：`故事创作工具`、`浏览器创作工具`、`本地优先写作工具`
- 图书：`图书创作工具`、`浏览器写作工具`、`小说创作软件`
- 漫画：`漫画创作工具`、`漫画分镜软件`、`浏览器漫画编辑器`
- 视觉小说：`视觉小说编辑器`、`视觉小说制作工具`、`OpenWebGal 编辑器`
- 互动视频：`互动视频创作工具`、`分支视频编辑器`、`互动叙事工具`
- Phaser：`Phaser 游戏编辑器`、`Phaser 游戏制作工具`、`浏览器游戏开发`
- 导出：`OpenWebGal 导出工具`、`视觉小说发布`、`可运行项目导出`

### English

- Brand: `GenStory.cc`, `GenStory.cc creative workspace`
- General: `story creation tool`, `browser-based creative workspace`, `local-first writing app`
- Books: `book creation tool`, `browser writing app`, `novel writing software`
- Comics: `comic creation tool`, `comic storyboard software`, `browser comic editor`
- Visual novels: `visual novel editor`, `visual novel maker`, `OpenWebGal editor`
- Interactive video: `interactive video authoring`, `branching video editor`, `interactive storytelling tool`
- Phaser: `Phaser game editor`, `Phaser game maker`, `browser game development`
- Export: `OpenWebGal export tool`, `visual novel export`, `visual novel publishing`

## 页面模板

首页：

1. 明确的产品 H1 和价值说明。
2. 所有作品类型的可抓取链接，以及视觉小说页中的 OpenWebGal 导出能力。
3. 本地优先、结构化创作、备份发布三组能力说明。
4. 创作到导出的流程说明。
5. `WebSite` 与 `WebApplication` JSON-LD。

类型页：

1. 类型关键词对应的 H1。
2. 该类型的文件结构、工作流和输出方式。
3. 面向真实搜索问题的 FAQ。
4. 返回首页和其他类型页的内部链接。
5. 进入创建工作台的 CTA。
6. `WebPage`、`BreadcrumbList` 与 `FAQPage` JSON-LD。

## 三优先级文案优化方案

本轮优化先不调整 URL、页面组件、sitemap 或信息架构，优先通过 `<title>`、description、H1、首段、能力卡片、FAQ 和内部链接文案来覆盖搜索意图。目标不是把关键词堆进页面，而是让用户读到后能立刻判断：这个工具是否适合我、项目数据在哪里、能不能预览/导出、和常见工具有什么关系。

### 调研依据

- Google Search Central 明确说明 Google Search 不使用 `keywords` meta tag；同时，反复堆叠同义关键词会让用户读起来疲劳，并可能触发关键词堆砌问题。因此本方案把关键词主要放在标题、description、H1、首段、FAQ 和自然链接文案里，而不是依赖 meta keywords。
- 视觉小说方向的搜索表达应优先靠近 `visual novel editor`、`visual novel maker`、`WebGAL`、`OpenWebGal`。WebGAL 官方把自身定位为可制作视觉小说的工具，并提供 WebGAL / WebGAL Terre、文档、下载和现代浏览器运行环境；这与本项目“浏览器编辑、预览、导出 OpenWebGal”的真实能力贴合。
- Phaser 方向的搜索表达应优先靠近 `Phaser game maker`、`Phaser game editor`、`HTML5 game maker`、`browser game development`。Phaser 官方持续强调 HTML5、web/browser game、Phaser Editor、模板和开源框架；本项目适合承接“从浏览器创建可运行 Phaser 项目并导出源码”的轻量入口意图。
- 图书、漫画、互动视频和首页属于第三优先级：它们覆盖更宽的“浏览器写作工具”“漫画分镜软件”“互动叙事工具”“本地优先创作工具”等泛需求，但现阶段不应抢视觉小说和 Phaser 页的主关键词，也不应暗示尚未闭环的绘图或视频剪辑能力。

参考来源：

- Google Search Central: `https://developers.google.com/search/docs/fundamentals/seo-starter-guide`
- WebGAL / OpenWebGal: `https://www.openwebgal.com/`、`https://www.openwebgal.com/en/download/`
- Phaser: `https://phaser.io/phaser4`、`https://phasereditor2d.com/`
- 图像 prompt 方向可以覆盖 `AI角色设计`、`角色设定图生成`、`character reference sheet` 等搜索表达。特定模型名不进入通用标题、关键词组或说明文案；只有在 prompt 正文需要表达“把这段需求交给某个图像模型”时才出现。

### 文案原则

- 每个页面只主攻 1-2 个核心词，其他词自然放进首段、能力说明或 FAQ。
- 标题可以搜索化，正文必须像产品说明。避免“永久免费最好用”这类空泛承诺。
- 首屏先讲清楚使用场景，再讲本地优先和导出能力，避免用户误以为这是纯 AI 生成器或云端编辑器。
- 对能力边界说清楚：漫画页偏项目组织和分镜管理，不暗示完整绘图生成；互动视频页偏规划和资产管理，除非功能启用后再强调完整制作闭环。
- 中文页面使用创作者熟悉的词，如“视觉小说”“Galgame”“浏览器写作”“源码 ZIP 备份”；英文页面使用搜索更常见的 `maker`、`editor`、`browser`、`local-first`。

### 原有信息要素保留

SEO 文案可以更换表达，但不能删掉以下产品事实：

- GenStory.cc 是 `100% 开源 / 100% open source` 的浏览器创作工具。
- 项目数据默认保存在当前浏览器和这台设备中，不会自动上传到 GenStory.cc 服务器。
- 公开入口需要持续提到图书、漫画、视觉小说、互动视频和 Phaser 游戏五类项目，即使互动视频当前更偏规划和资产管理。
- 用户可以下载源码 ZIP 或项目备份，之后重新导入继续编辑。
- 授权后可以手动同步到自己的 Google Drive；同步不是默认自动行为。
- 视觉小说需要保留剧本、角色、场景、分支、选择项、预览和 OpenWebGal 导出这些要素。
- Phaser 游戏需要保留菜单、场景、可编辑 JavaScript、CSS、资产计划、浏览器预览和源码导出这些要素。
- 图书、漫画和互动视频的描述要保留原有结构：图书的根作品/章节/页面/媒体附件；漫画的分镜/页面/角色/视觉资产；互动视频的视频片段/音频/时间线/选择点。

### 第一优先级：视觉小说、WebGAL、OpenWebGal

主承接页面：`/zh/visual-novel`、`/en/visual-novel`。

目标关键词：

- 中文核心：`视觉小说编辑器`、`视觉小说制作工具`、`WebGAL 编辑器`、`OpenWebGal 编辑器`、`Galgame 制作工具`
- 英文核心：`visual novel editor`、`visual novel maker`、`browser visual novel editor`、`OpenWebGal editor`、`OpenWebGal export`

推荐文案替换：

| 位置 | 中文建议 | English suggestion |
| --- | --- | --- |
| `<title>` | `视觉小说编辑器 / WebGAL 制作工具 - GenStory.cc` | `Visual Novel Editor and OpenWebGal Export Tool - GenStory.cc` |
| description | `在浏览器中制作视觉小说和 Galgame，管理剧本、场景、角色与素材，预览后导出可运行的 OpenWebGal 项目。项目数据默认保存在本地浏览器中。` | `Create visual novels in the browser, organize scripts, scenes, characters, and assets, preview your work, and export a runnable OpenWebGal project with local-first project data.` |
| H1 | `在浏览器中制作视觉小说和 WebGAL 项目` | `Create visual novels and OpenWebGal projects in the browser` |
| 首段 | `GenStory.cc 适合想把视觉小说剧本、舞台状态、角色和素材分开管理的创作者。你可以用 Markdown 写对白，用 YAML 维护场景状态，在浏览器中预览，并在完成后导出 OpenWebGal ZIP。` | `GenStory.cc is for creators who want visual novel scripts, stage state, characters, and assets kept in clear project files. Write dialogue in Markdown, maintain scene state in YAML, preview in the browser, and export an OpenWebGal ZIP when ready.` |

FAQ 增补方向：

- `GenStory.cc 和 WebGAL / OpenWebGal 是什么关系？`
- `可以把项目导出成可以发布的视觉小说吗？`
- `它适合 Ren'Py 用户吗？`
- `项目数据会不会上传到服务器？`

用户感受目标：搜索“视觉小说制作工具”的新手读到后觉得门槛低；搜索 `OpenWebGal export` 的用户读到后能确认这是一个真实导出链路，而不是只有静态模板。

### 第二优先级：Phaser、HTML5 游戏、浏览器游戏开发

主承接页面：`/zh/phaser-game`、`/en/phaser-game`。

目标关键词：

- 中文核心：`Phaser 游戏制作工具`、`Phaser 游戏编辑器`、`HTML5 游戏制作工具`、`浏览器游戏开发`
- 英文核心：`Phaser game maker`、`Phaser game editor`、`HTML5 game maker`、`browser game development`

推荐文案替换：

| 位置 | 中文建议 | English suggestion |
| --- | --- | --- |
| `<title>` | `Phaser 游戏制作工具 - GenStory.cc` | `Phaser Game Maker for Browser Projects - GenStory.cc` |
| description | `在浏览器中创建可运行的 Phaser 游戏项目，编辑 HTML、JavaScript、CSS、场景和资产计划，并下载源码 ZIP 继续开发或部署。` | `Create runnable Phaser game projects in the browser, edit HTML, JavaScript, CSS, scenes, and asset plans, then download the source ZIP for development or deployment.` |
| H1 | `从浏览器开始制作 Phaser 游戏` | `Build Phaser games from editable browser project files` |
| 首段 | `GenStory.cc 的 Phaser 模板不是空白占位，而是包含菜单、测试场景和可编辑源码的浏览器游戏项目。它适合快速验证玩法、整理资产计划，并把源码带出浏览器继续开发。` | `GenStory.cc starts Phaser projects with a menu, a playable test scene, and editable source files instead of an empty placeholder. Use it to test a game loop, plan assets, and take the source out of the browser when you are ready.` |

FAQ 增补方向：

- `Phaser 游戏可以直接运行吗？`
- `导出的源码 ZIP 里包含什么？`
- `没有图片和音频时能不能先测试玩法？`
- `它和完整游戏引擎有什么区别？`

用户感受目标：让开发者感到这是一个轻量项目起点，而不是声称替代 Phaser 官方工具；让非开发者知道可以先跑起来，但后续仍需要编辑源码。

### 第三优先级：浏览器写作、漫画分镜、互动叙事、总类目

主承接页面：`/zh`、`/en`、`/zh/book`、`/en/book`、`/zh/comic`、`/en/comic`、`/zh/interactive-video`、`/en/interactive-video`。

目标关键词：

- 首页：`故事创作工具`、`浏览器创作工具`、`本地优先创作工具`、`story creation tool`、`browser-based creative workspace`、`local-first creative workspace`
- 图书：`浏览器写作工具`、`小说创作软件`、`开源写作工具`、`browser writing app`、`novel writing software`、`local-first writing app`
- 漫画：`漫画创作工具`、`漫画分镜软件`、`浏览器漫画编辑器`、`comic storyboard software`、`comic creation tool`
- 互动视频：`互动视频创作工具`、`分支视频编辑器`、`互动叙事工具`、`interactive video authoring`、`branching video editor`

推荐文案替换：

| 页面 | 中文建议 | English suggestion |
| --- | --- | --- |
| 首页 `<title>` | `GenStory.cc - 本地优先的故事与游戏创作工具` | `GenStory.cc - Local-First Story and Game Creation Tool` |
| 首页首段 | `在浏览器中创作图书、漫画、视觉小说和 Phaser 游戏。GenStory.cc 默认把项目文件和素材保存在本地浏览器中，让长期创作可以备份、恢复、预览和导出。` | `Create books, comics, visual novels, and Phaser games in the browser. GenStory.cc keeps project files and assets local by default, so long-running creative work can be backed up, restored, previewed, and exported.` |
| 图书 H1 | `适合小说和长篇内容的浏览器写作工具` | `A browser writing app for novels and long-form projects` |
| 漫画 H1 | `用分镜、页面和素材管理漫画项目` | `Plan comic projects with panels, pages, and visual assets` |
| 互动视频 H1 | `规划带选择点的互动视频故事` | `Plan interactive video stories with choices and timelines` |

FAQ 增补方向：

- 首页：`GenStory.cc 是 AI 故事生成器吗？` 回答应说明 AI 可选，核心是本地项目工作台。
- 图书：`清除浏览器数据会影响作品吗？` 已有，保留并强调备份。
- 漫画：`GenStory.cc 可以直接画漫画吗？` 回答应说明可以使用 AI 生图绘制漫画，并同步管理分镜、页面、角色和资产。
- 互动视频：`互动视频项目适合什么阶段？` 回答应说明适合片段、时间线、配音和选择点规划。

用户感受目标：首页读起来要可靠、克制、有边界；图书页让写作者感到安心，尤其是数据不自动上传；漫画页正向说明 AI 生图与项目管理能力；互动视频页避免过度承诺，先服务策划和结构化项目管理意图。

### 内部链接与锚文本

不新增页面结构时，可以通过已有首页、类型页和相关类型区域调整链接文案：

- 首页到视觉小说页：`视觉小说编辑器与 OpenWebGal 导出`
- 首页到 Phaser 页：`Phaser 游戏制作工具`
- 首页到图书页：`浏览器写作工具`
- 首页到漫画页：`漫画分镜与项目管理`
- 首页到互动视频页：`互动视频和分支叙事规划`
- 视觉小说页正文中自然链接回首页时使用：`本地优先故事创作工具`
- Phaser 页正文中自然链接回首页时使用：`浏览器故事与游戏创作工作台`

链接文案必须像导航，而不是关键词清单。用户应该能通过链接预判下一页内容。

### 实施顺序

1. 先改第一优先级视觉小说页和第二优先级 Phaser 页的 metadata、H1、首段、FAQ。这两页搜索意图最集中，也最贴合现有完整能力。
2. 再改首页、图书页、漫画页和互动视频页的标题与首段，让总类目和第三优先级词自然覆盖。
3. 最后检查所有页面的 FAQ JSON-LD、canonical、hreflang、sitemap 和静态 HTML 输出，确保搜索引擎和用户看到的是同一套内容。
4. 发布后用 Google Search Console 观察实际查询词。如果出现 `WebGAL`、`OpenWebGal`、`Phaser game maker` 等高相关曝光，再决定是否新增专题页；没有数据前不先扩大结构。

## AI 助力与 Prompt 示例方案

AI 相关流量需要补充，但表达必须贴合产品现状：GenStory.cc 不是承诺“一键完成作品”的纯生成器，而是一个本地优先项目工作台，AI 助手可以在用户授权模型服务后读取项目上下文、参考 `AGENTS.md` 约束，辅助生成草稿、结构、分镜、场景脚本、代码片段和资产提示词。最终写入、保存、预览和导出仍以用户确认的项目文件为准。

### AI 关键词分组

中文可用词：

- 总类目：`AI故事生成器`、`AI创作工具`、`AI自动化创作`、`AI写作工具`
- 图书：`AI小说生成器`、`AI写作工具`、`AI剧本生成器`、`AI插图生成器`、`文章插图生成`
- 漫画：`AI漫画生成器`、`AI分镜生成器`、`漫画分镜生成器`、`AI角色设计`、`角色设定图生成`
- 视觉小说：`AI视觉小说生成器`、`AI互动故事生成器`、`AI剧本生成器`、`AI角色立绘生成`、`角色设定图生成`
- 互动视频：`AI互动故事生成器`、`AI分镜生成器`、`AI剧本生成器`、`AI视觉参考图`
- Phaser 游戏：`AI游戏生成器`、`AI游戏制作工具`、`AI生成游戏代码`、`AI角色设计`、`游戏角色设定图`

English keywords:

- General: `AI story generator`, `AI creative writing tool`, `AI writing tool`, `AI illustration generator`, `AI character design`
- Books: `AI novel generator`, `AI story writing tool`, `AI script generator`, `article illustration prompt`
- Comics: `AI comic generator`, `AI storyboard generator`, `AI comic storyboard`, `AI character sheet generator`, `character reference sheet`
- Visual novels: `AI visual novel generator`, `AI interactive story generator`, `AI script generator`, `AI character sprite generator`, `character reference sheet`
- Interactive video: `AI interactive story generator`, `AI storyboard generator`, `AI branching story`, `AI visual reference prompt`
- Phaser games: `AI game generator`, `AI game maker`, `AI game code generator`, `AI sprite generator`, `character sheet generator`

不建议主打的词：`free`、`unlimited`、`no sign up`、`no filter`。这些搜索建议常见，但容易引来低质量流量，也和 OpenRouter 授权、可选 AI 助手、用户自带模型服务的边界冲突。

### Prompt 板块内容规则

- 每个类型页展示 4 条示例，覆盖生成、整理、检查或资产规划等不同需求，而不是堆满关键词。
- 每条示例由“需求场景 / 适合产出 / 可复制 prompt”组成，让用户知道可以怎样和 AI 助手协作。
- 用户端看到的是 prompt 示例，不是模型选择说明。特定模型名只允许出现在可复制 prompt 正文这类细节描述中；用例标题、SEO 关键词、段落介绍和表格规划都使用通用表达。prompt 本体应像创作者正在描述需求：角色是谁、画面要什么、交付要什么、哪些内容不要出现。
- Prompt 必须要求 AI 保持项目结构、逻辑 ID、本地文件和用户确认流程，不暗示 AI 会绕过编辑器直接发布。
- 漫画与互动视频继续说明边界：可辅助分镜、镜头、素材提示词和结构整理，不承诺完整绘图或视频剪辑。
- Phaser 示例可以包含代码方向，但要强调“生成可编辑片段 / 场景计划 / 资产 prompt”，不承诺完整专业游戏引擎。
- 插图和角色设定图示例要先写成清晰的创作需求，通用描述自然覆盖 `AI角色设计`、`角色设定图生成`、`character reference sheet` 等搜索词；不要把正文写成模型选择问答。
- 角色设定图 prompt 要覆盖用户真实会搜、也真实会填写的要素：年龄、性别/呈现、性格、职业/身份、作品类型、画布尺寸、正面/侧面/背面/3/4 视角、表情表、衣着细节、配色、负面约束和资产逻辑 ID。

### 各类型示例规划

| 页面 | 搜索意图 | 示例 prompt 覆盖 |
| --- | --- | --- |
| 图书 | `AI小说生成器`、`AI写作工具`、`AI插图生成器` | 长篇大纲、章节续写、文章/章节插图 prompt、角色设定一致性 |
| 漫画 | `AI漫画生成器`、`AI分镜生成器`、`AI角色设计` | 分镜拆解、角色/场景图像 prompt、角色设定图 prompt、页面节奏检查 |
| 视觉小说 | `AI视觉小说生成器`、`AI互动故事生成器`、`AI角色立绘生成` | 分支剧情、舞台状态检查、资产逻辑 ID、角色立绘设定图 prompt |
| 互动视频 | `AI互动故事生成器`、`AI分镜生成器`、`AI视觉参考图` | 选择点设计、镜头清单、拍摄前视觉参考 prompt、音频/配音规划与风险检查 |
| Phaser 游戏 | `AI游戏生成器`、`AI游戏制作工具`、`AI sprite generator` | 玩法循环、Phaser 场景代码、图片/音乐/音效 prompt、游戏角色设定图与关卡调参 |

### 可落地示例方向

- 文章/章节插图：读取正文后挑选适合配图的段落，输出 3 条图像 prompt。每条说明画面主体、构图、光线、情绪、时代或地点细节、禁止出现的文字/商标，以及应登记到 `assets/index.yml` 的逻辑 ID。
- 角色设定图：把“年龄、性别/呈现、性格、职业/身份、作品类型”变成 1024x768 角色设计 prompt，明确多角度全身视图、表情头像、发型、眼睛、服装层次、鞋子、随身物、徽章和配色；如需点名某个图像模型，只放在 prompt 正文里。
- 视觉小说立绘：输出时同时考虑 `tachie`、`expression`、`prop`、`palette` 等资产拆分，遵守视觉小说项目规则：只写逻辑 ID，不写本地文件路径，不把渲染调用混进 `stage.yml`。
- Phaser 游戏角色：角色设定图 prompt 需方便后续拆成 idle/run/jump/expression 等 sprite 资产；正文只承诺“资产计划和 prompt”，不承诺自动生成可直接导入的 sprite sheet。

### 页面位置

Prompt 示例板块放在“核心能力”和 FAQ 之间。用户先理解产品能力，再看到 AI 能怎样参与，最后通过 FAQ 确认边界。样式使用现有 shadcn `Card`，避免复杂交互；prompt 文本使用可读的等宽块，保证移动端可换行，不做横向滚动优先的代码展示。

## 技术 SEO

- 使用 Next.js `output: "export"`，公开页面通过 `generateStaticParams()` 生成 SSG HTML。
- sitemap 只收录公开页面，并为每个 URL 提供语言替代链接。
- `/projects/*` 使用 `noindex, nofollow`，不进入 sitemap。
- `/webgal/` 是运行时引擎资源，不作为搜索页面。
- 公开页面使用稳定 slug，不依赖 query 参数生成 SEO 页面。
- Open Graph 图片统一使用 `public/og/genstory-og.png`。
- 页面正文在静态 HTML 中输出，不能只依赖客户端状态或本地项目数据。

## 内部链接规则

- 首页必须链接所有公开类型页。
- 每个类型页必须链接首页和其他类型页。
- 视觉小说页直接覆盖 OpenWebGal 预览、编译和导出意图，不再创建重复的 OpenWebGal 类型页。
- Phaser、互动视频等新类型加入项目注册表时，同时加入 SEO 注册表、首页入口和 sitemap。
- 私有工作台链接只承担产品转化，不作为 SEO 内容入口。

## 内容与增长

第一阶段先完成当前类型页的静态覆盖。后续新增内容时按搜索意图扩展：

- `visual-novel-editor`：编辑器功能与工作流专题。
- `openwebgal-export`：作为视觉小说页下的导出、部署与发布专题内容。
- `phaser-browser-game`：Phaser 模板与浏览器运行指南。
- `local-first-writing`：本地优先、OPFS 和源码备份说明。
- 模板案例：图书、漫画、视觉小说、互动视频和 Phaser 游戏各一个可索引案例。

新增文章必须链接回对应类型页和 `/zh`、`/en` 首页，避免形成孤立内容。

## 发布后的衡量

部署后在 Google Search Console 和 Bing Webmaster Tools 中：

1. 提交 `/sitemap.xml`。
2. 验证中文与英文 URL 的 canonical/hreflang。
3. 观察每个类型页的展示、点击、平均排名和收录状态。
4. 根据实际查询词补充 FAQ 和专题内容。
5. 每月检查 404、重复 canonical、未收录页面和 sitemap 错误。
