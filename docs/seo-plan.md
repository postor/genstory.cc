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
