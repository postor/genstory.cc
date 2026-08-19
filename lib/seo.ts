import type { Metadata } from "next";

export type PublicLang = "zh" | "en";

export type PublicPageSlug =
  | "book"
  | "picture-book"
  | "comic"
  | "visual-novel"
  | "interactive-video"
  | "phaser-game";

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");

export const siteUrl = configuredSiteUrl || "https://www.genstory.cc";
export const ogImagePath = "/og/genstory-og.png";
export const ogImageUrl = `${siteUrl}${ogImagePath}`;

export const publicLanguages: PublicLang[] = ["zh", "en"];

export const defaultPublicLang: PublicLang = "zh";

export const languageLabels: Record<PublicLang, string> = {
  zh: "中文",
  en: "English",

};

export const languageAlternates: Record<string, string> = {
  "zh-CN": `${siteUrl}/zh`,
  en: `${siteUrl}/en`,
  "x-default": `${siteUrl}/zh`,

};

export const siteMetadata = {
  name: "GenStory.cc",
  zhTitle: "GenStory.cc - 本地优先的故事与游戏创作工具",
  enTitle: "GenStory.cc - Local-First Story and Game Creation Tool",
  zhDescription:
    "GenStory.cc 是一个 100% 开源、本地优先的浏览器创作工具，支持图书、绘本、漫画、视觉小说、互动视频和 Phaser 游戏。项目文件和素材默认保存在当前浏览器中，可下载源码 ZIP、恢复备份、选择性同步到自己的云盘，并在支持的类型中预览或导出运行包。",
  enDescription:
    "GenStory.cc is a 100% open-source, local-first browser workspace for books, picture books, comics, visual novels, interactive videos, and Phaser games. Keep project files on this device by default, download source ZIP backups, restore work later, optionally sync to your own cloud drive, and preview or export supported projects.",
  keywords: [
    "GenStory.cc",
    "100% 开源",
    "100% 本地数据",
    "开源故事创作工具",
    "本地优先故事创作工具",
    "浏览器创作工具",
    "AI故事生成器",
    "AI创作工具",
    "AI写作工具",
    "AI插图生成器",
    "AI角色设计",
    "视觉小说编辑器",
    "WebGAL 制作工具",
    "OpenWebGal 导出工具",
    "Phaser 游戏制作工具",
    "Phaser 游戏编辑器",
    "浏览器写作工具",
    "漫画分镜软件",
    "互动视频创作工具",
    "AI story generator",
    "AI creative writing tool",
    "AI writing tool",
    "AI illustration generator",
    "AI character design",
    "AI character sheet generator",
    "browser visual novel editor",
    "100% open source",
    "100% local project data",
    "local-first writing app",
    "OpenWebGal export tool",
    "comic storyboard software",
    "Phaser game maker",
    "Phaser game editor",
    "browser game editor",
    "interactive video authoring tool",
    "open-source story creation tool",
  ],
};

export const siteKeywords: Record<PublicLang, string[]> = {
  zh: [
    "GenStory.cc",
    "100% 开源",
    "100% 本地数据",
    "开源故事创作工具",
    "故事创作工具",
    "AI故事生成器",
    "AI创作工具",
    "AI写作工具",
    "AI插图生成器",
    "AI角色设计",
    "本地优先创作工具",
    "浏览器故事创作工具",
    "视觉小说编辑器",
    "WebGAL 制作工具",
    "OpenWebGal 导出工具",
    "Phaser 游戏制作工具",
    "Phaser 游戏编辑器",
    "浏览器写作工具",
    "漫画分镜软件",
    "互动视频创作工具",
  ],
  en: [
    "GenStory.cc",
    "100% open source",
    "100% local project data",
    "open-source story creation tool",
    "story creation tool",
    "AI story generator",
    "AI creative writing tool",
    "AI writing tool",
    "AI illustration generator",
    "AI character design",
    "local-first creative workspace",
    "browser story creation tool",
    "visual novel editor",
    "visual novel maker",
    "OpenWebGal export tool",
    "Phaser game maker",
    "Phaser game editor",
    "browser writing app",
    "comic storyboard software",
    "interactive video authoring tool",
  ],
};

export const sharedPageKeywords: Record<PublicLang, string[]> = {
  zh: ["GenStory.cc", "本地优先创作工具", "浏览器故事创作工具"],
  en: ["GenStory.cc", "local-first creative workspace", "browser story creation tool"],
};

export const siteTrustSummary: Record<PublicLang, string> = {
  zh: "代码 100% 开源，项目数据默认保存在本地浏览器中；不会自动上传到 GenStory.cc 服务器，也可在授权后手动同步到自己的云盘。",
  en: "100% open source and local-first by default; your work is not automatically uploaded to GenStory.cc servers, and can be manually synced to your own cloud drive after authorization.",
};

export const publicPageSlugs: PublicPageSlug[] = [
  "book",
  "picture-book",
  "comic",
  "visual-novel",
  "interactive-video",
  "phaser-game",
];

export const siteFeatureList: Record<PublicLang, string[]> = {
  zh: [
    "作品保存在浏览器中",
    "图书、绘本、漫画、视觉小说、互动视频和 Phaser 游戏模板",
    "项目备份下载和导入",
    "可选的 Google Drive 同步",
    "视觉小说浏览器预览",
    "OpenWebGal 独立项目导出",
  ],
  en: [
    "Local-first project files",
    "Book, picture book, comic, visual novel, interactive video, and Phaser game templates",
    "Source ZIP backup and import",
    "Optional Google Drive sync",
    "Visual novel preview in the browser",
    "Standalone OpenWebGal project export",
  ],
};

export const publicRobots: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-video-preview": -1,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
};

export const publicPageKeywords: Record<
  PublicPageSlug,
  Record<PublicLang, string[]>
> = {
  book: {
    zh: ["浏览器写作工具", "小说创作软件", "AI小说生成器", "AI写作工具", "AI插图生成器", "文章插图生成", "开源写作工具", "本地优先写作"],
    en: ["book creation tool", "browser writing app", "AI novel generator", "AI writing tool", "AI illustration generator", "article illustration prompt", "local-first writing", "novel writing software"],
  },
  "picture-book": {
    zh: ["绘本创作工具", "AI绘本生成器", "儿童绘本制作", "绘本故事创作", "浏览器绘本编辑器", "绘本插画生成", "本地优先创作"],
    en: ["picture book maker", "AI picture book generator", "children's book creator", "picture book creation tool", "browser picture book editor", "storybook illustration prompts", "local-first creative workspace"],
  },
  comic: {
    zh: ["漫画分镜软件", "AI分镜生成器", "AI漫画生成器", "AI角色设计", "角色设定图生成", "漫画创作工具", "浏览器漫画编辑器", "漫画项目管理"],
    en: ["comic creation tool", "AI comic generator", "AI storyboard generator", "AI character design", "AI character sheet generator", "character reference sheet", "comic storyboard software", "browser comic editor", "comic project workspace"],
  },
  "visual-novel": {
    zh: ["视觉小说编辑器", "视觉小说制作工具", "AI视觉小说生成器", "AI互动故事生成器", "AI角色立绘生成", "角色设定图生成", "WebGAL 编辑器", "OpenWebGal 导出工具"],
    en: ["visual novel editor", "visual novel maker", "AI visual novel generator", "AI interactive story generator", "AI character sprite generator", "character reference sheet", "browser visual novel editor", "OpenWebGal export"],
  },
  "interactive-video": {
    zh: ["互动视频创作工具", "AI互动故事生成器", "AI分镜生成器", "AI视觉参考图", "互动短片制作", "分支视频编辑器", "互动叙事工具"],
    en: ["interactive video authoring", "AI interactive story generator", "AI storyboard generator", "AI visual reference prompt", "interactive short film maker", "branching video editor", "interactive storytelling tool"],
  },
  "phaser-game": {
    zh: ["Phaser 游戏制作工具", "AI游戏生成器", "AI游戏制作工具", "AI生成游戏代码", "AI角色设计", "游戏角色设定图", "Phaser 游戏编辑器", "HTML5 游戏制作工具", "浏览器游戏开发"],
    en: ["Phaser game maker", "AI game generator", "AI game maker", "AI game code generator", "AI character design", "AI sprite generator", "character sheet generator", "Phaser game editor", "HTML5 game maker", "browser game development"],
  },
};

export const publicPages: Record<
  PublicPageSlug,
  {
    title: Record<PublicLang, string>;
    description: Record<PublicLang, string>;
    kicker: Record<PublicLang, string>;
    heading: Record<PublicLang, string>;
    intro: Record<PublicLang, string>;
    sections: Array<{
      title: Record<PublicLang, string>;
      body: Record<PublicLang, string>;
    }>;
    faqs: Array<{
      question: Record<PublicLang, string>;
      answer: Record<PublicLang, string>;
    }>;
  }
> = {
  "visual-novel": {
    title: {
      zh: "视觉小说编辑器 / WebGAL 制作工具 - GenStory.cc",
      en: "Visual Novel Editor and OpenWebGal Export Tool - GenStory.cc",
    },
    description: {
      zh: "在浏览器中制作视觉小说和 Galgame，可选 AI 助手辅助剧本、分支、场景与素材提示词，预览后导出可运行的 OpenWebGal 项目。",
      en: "Create visual novels in the browser with optional AI assistance for scripts, branches, scenes, and asset prompts, then preview and export a runnable OpenWebGal project.",
    },
    kicker: { zh: "视觉小说编辑器", en: "Visual novel editor" },
    heading: {
      zh: "在浏览器中制作视觉小说和 WebGAL 项目",
      en: "Create visual novels and OpenWebGal projects in the browser",
    },
    intro: {
      zh: "GenStory.cc 适合想把视觉小说剧本、舞台状态、角色、分支和选择项分开管理的创作者。你可以用 Markdown 写对白，用 YAML 维护场景状态，也可以让可选 AI 助手基于项目上下文生成场景草稿和资产 prompt，确认后再预览并导出 OpenWebGal ZIP。",
      en: "GenStory.cc is for creators who want visual novel scripts, stage state, characters, branches, choices, and assets kept in clear project files. Write dialogue in Markdown, maintain scene state in YAML, and optionally ask the AI assistant to draft scenes or asset prompts from project context before you preview and export an OpenWebGal ZIP.",
    },
    sections: [
      {
        title: { zh: "故事与呈现分离", en: "Separate story from presentation" },
        body: {
          zh: "script.md 保存叙事和对白，stage.yml 只描述背景、角色、表情、姿势和位置，资产统一通过 assets/index.yml 的逻辑 ID 引用。",
          en: "script.md stores narration and dialogue, stage.yml describes background and character state, and assets are referenced through logical IDs in assets/index.yml.",
        },
      },
      {
        title: { zh: "浏览器内预览", en: "Preview in the browser" },
        body: {
          zh: "创建后可以直接打开预览，快速检查对白、角色状态和场景衔接，无需单独安装运行环境。",
          en: "Open a preview after creating the project to check dialogue, character state, and scene flow without installing a separate runtime.",
        },
      },
      {
        title: { zh: "导出 OpenWebGal", en: "Export OpenWebGal" },
        body: {
          zh: "完成后可以导出可独立运行的 OpenWebGal ZIP，也可以下载项目备份，之后重新导入继续编辑。",
          en: "When ready, export a standalone OpenWebGal ZIP or download a project backup that can be imported later for editing.",
        },
      },
    ],
    faqs: [
      {
        question: { zh: "GenStory.cc 和 WebGAL / OpenWebGal 是什么关系？", en: "How does GenStory.cc relate to WebGAL or OpenWebGal?" },
        answer: {
          zh: "GenStory.cc 负责浏览器内的项目编辑、文件组织、预览准备和导出流程；OpenWebGal 是视觉小说项目的运行目标。完成后可以导出 OpenWebGal ZIP，用于运行或继续发布。",
          en: "GenStory.cc handles browser-based editing, project files, preview preparation, and export. OpenWebGal is the runtime target for visual novel projects, so a finished work can be exported as an OpenWebGal ZIP.",
        },
      },
      {
        question: { zh: "可以把项目导出成可以发布的视觉小说吗？", en: "Can I export a visual novel that can be published?" },
        answer: {
          zh: "可以。OpenWebGal 导出 ZIP 面向运行和发布；源码 ZIP 面向备份和继续编辑。两者用途不同，建议在发布前同时保留源码备份。",
          en: "Yes. The OpenWebGal export ZIP is for running or publishing, while the source ZIP is for backup and continued editing. Keep both when you are preparing a release.",
        },
      },
      {
        question: { zh: "它适合 Ren'Py 用户吗？", en: "Is this useful for Ren'Py users?" },
        answer: {
          zh: "如果你想要浏览器内的轻量工作流、清晰的项目文件和 WebGAL/OpenWebGal 导出，它会很合适。它不是 Ren'Py 的完整替代品，也不会隐藏项目结构。",
          en: "It is useful if you want a lighter browser workflow, clear project files, and WebGAL/OpenWebGal export. It is not a full Ren'Py replacement, and it keeps the project structure visible.",
        },
      },
      {
        question: { zh: "项目数据会不会上传到服务器？", en: "Does my project data get uploaded to GenStory.cc servers?" },
        answer: {
          zh: "不会自动上传到 GenStory.cc 服务器。作品内容和素材默认保存在这台设备的浏览器中；如果你授权 Google Drive，同步也只会在你主动操作后发生。",
          en: "Not automatically. Work and assets stay in this browser by default. If you authorize Google Drive, sync only happens after you start it.",
        },
      },
    ],
  },
  comic: {
    title: { zh: "漫画分镜与项目管理工具 - GenStory.cc", en: "Comic Storyboard Workspace - GenStory.cc" },
    description: {
      zh: "用 GenStory.cc 在浏览器中组织漫画分镜、页面、角色和视觉资产，可选 AI 助手辅助分镜和图像提示词，管理连续画面作品的项目文件、备份和恢复。",
      en: "Use GenStory.cc to organize comic panels, pages, characters, and visual assets with optional AI assistance for storyboards and image prompts in a browser workspace with restorable backups.",
    },
    kicker: { zh: "漫画分镜", en: "Comic storyboard" },
    heading: { zh: "用分镜、页面和素材管理漫画项目", en: "Plan comic projects with panels, pages, and visual assets" },
    intro: {
      zh: "漫画和连续画面项目常常难在设定、页面、角色和素材越写越散。GenStory.cc 更适合做结构化的漫画创作工作台：先整理分镜和资产，也可以让可选 AI 助手生成分镜草稿和图像 prompt，再把源码 ZIP 保存下来，方便之后继续制作。",
      en: "Comic and serial visual projects often become scattered across notes, pages, characters, and assets. GenStory.cc gives that planning work a structured browser workspace, can optionally help draft storyboards and image prompts with AI, then lets you keep a source ZIP for continued production.",
    },
    sections: [
      {
        title: { zh: "分镜和页面优先", en: "Panels and pages first" },
        body: {
          zh: "漫画项目围绕分镜、页面、角色和视觉资产组织，方便在文本规划和视觉制作之间保持一致。",
          en: "Comic projects are organized around panels, pages, characters, and visual assets to keep writing and visual production aligned.",
        },
      },
      {
        title: { zh: "项目备份", en: "Project backups" },
        body: {
          zh: "项目文件保存在浏览器中，可以下载 ZIP 备份，用于换设备、备份或恢复。",
          en: "Project files stay in your browser and can be downloaded as ZIP backups for moving, backing up, or restoring your work.",
        },
      },
      {
        title: { zh: "适合长线创作", en: "Built for long-running work" },
        body: {
          zh: "一个事实保留一个来源，减少重复设定，让章节、角色和资产在长期创作中持续一致。",
          en: "Each fact keeps one source of truth, reducing duplicated lore and keeping chapters, characters, and assets consistent over time.",
        },
      },
    ],
    faqs: [
      {
        question: { zh: "GenStory.cc 可以直接画漫画吗？", en: "Can GenStory.cc draw finished comic pages?" },
        answer: {
          zh: "可以。GenStory.cc 支持使用 AI 生图绘制漫画，并把分镜规划、页面组织、角色设定和素材登记放在同一个项目中管理，方便从构思到成稿持续迭代。",
          en: "Yes. GenStory.cc can use AI image generation to create comic artwork while keeping storyboards, pages, character references, and assets organized in one project, so you can keep iterating from idea to finished pages.",
        },
      },
      {
        question: { zh: "漫画项目可以导入恢复吗？", en: "Can comic projects be imported again?" },
        answer: {
          zh: "可以。使用 GenStory.cc 导出的项目备份可以从作品列表导入，恢复为新的作品。",
          en: "Yes. Project backups exported by GenStory.cc can be imported from the works list and restored as new works.",
        },
      },
    ],
  },
  book: {
    title: { zh: "浏览器写作工具 - GenStory.cc", en: "Browser Writing App - GenStory.cc" },
    description: {
      zh: "在浏览器中写小说、设定集和长篇内容，可选 AI 助手辅助大纲、续写和角色设定，用章节、页面和媒体附件组织项目，并保留项目备份或手动同步到自己的网盘。",
      en: "Write novels, lore documents, and long-form projects in the browser with optional AI assistance for outlines, continuation drafts, and character notes, organized by chapters, pages, media attachments, restorable backups, and optional cloud drive sync.",
    },
    kicker: { zh: "浏览器写作", en: "Browser writing" },
    heading: { zh: "适合小说和长篇内容的浏览器写作工具", en: "A browser writing app for novels and long-form projects" },
    intro: {
      zh: "GenStory.cc 让图书项目以清晰的源文件存在于浏览器中，适合小说、设定集、章节式内容和带素材的长篇创作。可选 AI 助手可以参考项目上下文辅助大纲、续写和设定整理；作品仍关注可整理、可备份、可恢复，而不是把写作过程锁进单一云端编辑器。",
      en: "GenStory.cc keeps book projects as clear source files in the browser, suited for novels, lore documents, chaptered content, and media-rich writing. The optional AI assistant can use project context to help with outlines, continuation drafts, and lore organization, while the project remains portable instead of being locked into one cloud editor.",
    },
    sections: [
      {
        title: { zh: "章节化组织", en: "Chaptered organization" },
        body: {
          zh: "根作品、章节、页面和媒体附件共同承载长篇内容，便于持续扩写和整理。",
          en: "Root work, chapters, pages, and media attachments carry long-form content so it can be expanded and organized over time.",
        },
      },
      {
        title: { zh: "作品保存在浏览器中", en: "Your work stays in the browser" },
        body: {
          zh: "作品内容和素材保存在这台设备的浏览器中，不会自动上传到 GenStory.cc 服务器。换设备或清理浏览器数据前，请先下载项目备份。",
          en: "Your work and assets stay in this browser on this device and are not automatically uploaded to GenStory.cc servers. Download a project backup before changing devices or clearing browser data.",
        },
      },
      {
        title: { zh: "备份与网盘同步", en: "Backup and cloud drive sync" },
        body: {
          zh: "下载 ZIP 备份可以把作品带出浏览器，之后重新导入即可继续编辑。也可以在设置中授权自己的网盘后，手动把作品同步过去；同步不会自动运行。",
          en: "Download a ZIP backup to move your work out of the browser and import it later for continued editing. You can also authorize your own cloud drive in Settings and sync manually; sync does not run automatically.",
        },
      },
    ],
    faqs: [
      {
        question: { zh: "清除浏览器数据会影响项目吗？", en: "Does clearing browser data affect projects?" },
        answer: {
          zh: "会。作品保存在浏览器中，清除网站数据可能会删除本地作品。建议定期下载项目备份，或在设置页授权云盘后手动同步；云盘同步不会自动运行。",
          en: "Yes. Clearing site data can delete work stored in the browser. Download regular project backups, or authorize a drive in Settings and sync manually; cloud sync is not automatic.",
        },
      },
    ],
  },
  "picture-book": {
    title: {
      zh: "绘本创作工具与 AI 绘本生成器 - GenStory.cc",
      en: "Picture Book Maker and AI Storybook Workspace - GenStory.cc",
    },
    description: {
      zh: "在浏览器中创作绘本故事，组织分页文字、横版插画、角色和配音，可选 AI 助手辅助故事大纲与绘本插画提示词，并下载项目备份继续编辑。",
      en: "Create picture book stories in the browser with page text, landscape illustrations, characters, and narration. Optionally use AI for story outlines and illustration prompts, then download a project backup for continued editing.",
    },
    kicker: { zh: "绘本创作", en: "Picture book creation" },
    heading: {
      zh: "在浏览器中制作有画面和声音的绘本",
      en: "Create picture books with art, text, and narration in the browser",
    },
    intro: {
      zh: "GenStory.cc 适合把绘本的故事文字、分页节奏、角色设定、横版画面和配音计划放在同一个项目中管理。可选 AI 助手可以辅助大纲、页面文案和插画 prompt；作品文件仍保存在本地浏览器中，可以备份、恢复并继续编辑。",
      en: "GenStory.cc keeps picture book story text, page pacing, character references, landscape art, and narration plans in one browser project. The optional AI assistant can help with outlines, page copy, and illustration prompts while your files remain local, portable, and editable.",
    },
    sections: [
      {
        title: { zh: "分页故事结构", en: "Page-based story structure" },
        body: {
          zh: "绘本项目按页面组织文字、画面和配音，让故事节奏、阅读顺序和后续修改保持清晰。",
          en: "Organize text, art, and narration by page so story pacing, reading order, and later edits stay clear.",
        },
      },
      {
        title: { zh: "插画与角色设定", en: "Illustrations and character references" },
        body: {
          zh: "角色、地点和页面画面可以通过资产索引登记逻辑 ID 与生成提示词，方便长期保持视觉一致。",
          en: "Register characters, locations, and page art with logical asset IDs and prompts to keep visual continuity over time.",
        },
      },
      {
        title: { zh: "配音与项目备份", en: "Narration and project backups" },
        body: {
          zh: "页面可以关联配音和其他媒体附件；项目文件保存在浏览器中，也可以下载 ZIP 备份并在之后重新导入。",
          en: "Pages can reference narration and other media attachments. Project files stay in the browser and can be downloaded as ZIP backups for later import.",
        },
      },
    ],
    faqs: [
      {
        question: { zh: "可以制作适合儿童阅读的绘本吗？", en: "Can I make picture books for children?" },
        answer: {
          zh: "可以。绘本模板适合组织适合亲子阅读的故事、分页文字、横版画面和可选配音；具体画风和内容由你的项目设定与资产决定。",
          en: "Yes. The picture book template is suited to read-aloud stories, page text, landscape artwork, and optional narration. Your project settings and assets determine the final style and content.",
        },
      },
      {
        question: { zh: "绘本插画会自动生成吗？", en: "Are picture book illustrations generated automatically?" },
        answer: {
          zh: "AI 生图是可选的辅助流程，不会替你默默生成并覆盖作品。你可以先整理页面和插画 prompt，再按需要生成、保存并登记资产。",
          en: "AI image generation is an optional assisted workflow and does not silently generate or overwrite your work. Plan pages and prompts first, then generate, save, and register assets as needed.",
        },
      },
      {
        question: { zh: "绘本项目可以导出和恢复吗？", en: "Can picture book projects be exported and restored?" },
        answer: {
          zh: "可以。你可以下载项目源码 ZIP 作为备份，之后从项目列表导入并继续编辑；页面和资产会按项目结构恢复。",
          en: "Yes. Download a source ZIP as a backup, then import it from the project list to continue editing with the project structure and assets restored.",
        },
      },
    ],
  },
  "interactive-video": {
    title: {
      zh: "互动视频与分支叙事规划工具 - GenStory.cc",
      en: "Interactive Video and Branching Story Planner - GenStory.cc",
    },
    description: {
      zh: "用 GenStory.cc 组织互动视频的片段、音频、时间线、镜头、配音和选择点，可选 AI 助手辅助分镜和选择点设计，规划可互动的分支叙事项目。",
      en: "Use GenStory.cc to organize interactive video segments, audio, timelines, shots, voice, and choice points with optional AI assistance for storyboards and choice design.",
    },
    kicker: { zh: "互动视频规划", en: "Interactive video planning" },
    heading: {
      zh: "规划带选择点的互动视频故事",
      en: "Plan interactive video stories with choices and timelines",
    },
    intro: {
      zh: "互动视频项目以片段和时间线为骨架，将镜头、视频、音频、配音与分支选择保存在清晰的浏览器项目文件中。你可以让可选 AI 助手辅助设计选择点、镜头清单和配音计划；这个页面先服务可互动叙事的策划、整理和备份意图，避免把早期项目包装成完整的视频剪辑软件。",
      en: "Interactive video projects use segments and timelines as their structure, keeping shots, video, audio, voice, and branching choices in clear project files in your browser. You can optionally use AI to draft choice points, shot lists, and voice plans; this page focuses on interactive narrative planning, organization, and backup rather than pretending to be a full video editor.",
    },
    sections: [
      {
        title: { zh: "片段和时间线", en: "Segments and timelines" },
        body: {
          zh: "每个片段可以拥有独立的元数据、时间线和选择点，适合规划多段式互动内容。",
          en: "Each segment can have its own metadata, timeline, and choices for planning multi-part interactive content.",
        },
      },
      {
        title: { zh: "媒体资产可追踪", en: "Traceable media assets" },
        body: {
          zh: "视频、画面和配音通过 assets/index.yml 登记逻辑 ID，镜头方案与实际文件保持对应。",
          en: "Video, visual, and voice assets are registered with logical IDs in assets/index.yml so shot plans stay aligned with files.",
        },
      },
      {
        title: { zh: "分支叙事", en: "Branching narratives" },
        body: {
          zh: "在脚本中描述选择项和后续片段，让观众的操作成为故事结构的一部分。",
          en: "Describe choices and subsequent segments in the script so the viewer's actions become part of the story structure.",
        },
      },
    ],
    faqs: [
      {
        question: { zh: "互动视频项目适合什么内容？", en: "What is interactive video useful for?" },
        answer: {
          zh: "它适合带有视频片段、配音、时间线和分支选择的叙事内容，例如互动短片、分支剧情和沉浸式故事。",
          en: "It fits narrative work built from video clips, voice, timelines, and branching choices, such as interactive shorts and branching stories.",
        },
      },
      {
        question: { zh: "互动视频项目适合什么阶段？", en: "What stage of an interactive video project is this for?" },
        answer: {
          zh: "它尤其适合前期策划和结构整理：先把片段、镜头、选择点和素材关系放进项目文件，再进入实际拍摄、剪辑或发布流程。",
          en: "It is especially useful during planning and structure work: map segments, shots, choices, and asset relationships before moving into shooting, editing, or publishing.",
        },
      },
      {
        question: { zh: "互动视频的媒体文件如何管理？", en: "How are interactive video media files managed?" },
        answer: {
          zh: "媒体资产在 assets/index.yml 中使用逻辑 ID 登记，项目内容通过这些 ID 引用镜头、视频和配音。",
          en: "Media assets are registered with logical IDs in assets/index.yml, and project files reference shots, video, and voice through those IDs.",
        },
      },
    ],
  },
  "phaser-game": {
    title: {
      zh: "Phaser 游戏制作工具 - GenStory.cc",
      en: "Phaser Game Maker for Browser Projects - GenStory.cc",
    },
    description: {
      zh: "在浏览器中创建可运行的 Phaser 游戏项目，可选 AI 助手辅助玩法循环、场景代码和资产 prompt，编辑 HTML、JavaScript、CSS 并下载源码 ZIP。",
      en: "Create runnable Phaser game projects in the browser with optional AI assistance for gameplay loops, scene code, and asset prompts, then edit HTML, JavaScript, CSS, and download the source ZIP.",
    },
    kicker: { zh: "Phaser 游戏制作", en: "Phaser game maker" },
    heading: {
      zh: "从浏览器开始制作 Phaser 游戏",
      en: "Build Phaser games from editable browser project files",
    },
    intro: {
      zh: "GenStory.cc 的 Phaser 模板不是空白占位，而是包含菜单、测试场景和可编辑源码的浏览器游戏项目。它适合快速验证玩法、整理资产计划，也可以让可选 AI 助手生成场景代码草稿和图片/音乐/音效 prompt，再把源码带出浏览器继续开发。",
      en: "GenStory.cc starts Phaser projects with a menu, a playable test scene, and editable source files instead of an empty placeholder. Use it to test a game loop, plan assets, optionally draft scene code and image, music, or sound prompts with AI, and take the source out of the browser when you are ready.",
    },
    sections: [
      {
        title: { zh: "浏览器内可运行", en: "Playable in the browser" },
        body: {
          zh: "项目模板包含菜单和测试游戏场景，创建后即可在浏览器中预览基本运行链路。",
          en: "The template includes menu and test-game scenes so the basic playable loop can be previewed in the browser.",
        },
      },
      {
        title: { zh: "真实代码可编辑", en: "Edit real source code" },
        body: {
          zh: "index.html、JavaScript 场景、配置和 CSS 都是可直接编辑的项目文件，也会包含在项目备份中。",
          en: "index.html, JavaScript scenes, configuration, and CSS are editable project files included in the project backup.",
        },
      },
      {
        title: { zh: "资产计划先行", en: "Plan assets before production" },
        body: {
          zh: "图片、角色、音乐和音效先通过 assets/index.yml 登记逻辑 ID 与生成提示词，再接入游戏场景。",
          en: "Images, characters, music, and sound effects start as logical IDs and prompts in assets/index.yml before being wired into scenes.",
        },
      },
    ],
    faqs: [
      {
        question: { zh: "Phaser 游戏可以直接运行吗？", en: "Can Phaser games run right away?" },
        answer: {
          zh: "可以。模板包含菜单和测试场景，创建后即可在浏览器中预览基本运行链路，再逐步替换为自己的角色、关卡和资源。",
          en: "Yes. The template includes a menu and test scene, so the basic loop can be previewed in the browser before you replace it with your own characters, levels, and assets.",
        },
      },
      {
        question: { zh: "导出的源码 ZIP 里包含什么？", en: "What is included in the source ZIP?" },
        answer: {
          zh: "源码 ZIP 包含 HTML、JavaScript、CSS、项目元数据和资产计划，适合带出浏览器继续开发、备份或接入自己的部署流程。",
          en: "The source ZIP contains HTML, JavaScript, CSS, project metadata, and the asset plan, making it suitable for continued development, backup, or your own deployment flow.",
        },
      },
      {
        question: { zh: "没有生成图片和音频也能运行吗？", en: "Can a game run before images and audio are generated?" },
        answer: {
          zh: "可以。Phaser 模板先提供无需外部媒体即可运行的菜单和测试场景，后续再按 assets/index.yml 中的资产计划接入图片、音乐和音效。",
          en: "Yes. The Phaser template provides menu and test scenes that run without external media. Images, music, and sound effects can be added later from assets/index.yml.",
        },
      },
      {
        question: { zh: "它和完整游戏引擎有什么区别？", en: "How is this different from a full game engine?" },
        answer: {
          zh: "GenStory.cc 更像一个浏览器内的项目起点和源码工作台。它帮助你创建、编辑、预览和备份 Phaser 项目，但不会取代完整的专业游戏编辑器。",
          en: "GenStory.cc is closer to a browser-based project starter and source workspace. It helps create, edit, preview, and back up Phaser projects, but it does not replace a full professional game editor.",
        },
      },
    ],
  },
};

function metadataLocale(lang: PublicLang) {
  return lang === "zh"
    ? {
        contentLanguage: "zh-CN",
        ogLocale: "zh_CN",
        alternateOgLocale: "en_US",
      }
    : {
        contentLanguage: "en",
        ogLocale: "en_US",
        alternateOgLocale: "zh_CN",
      };
}

export function publicPageMetadata({
  lang,
  path = "",
  title,
  description,
  keywords = siteKeywords[lang],
}: {
  lang: PublicLang;
  path?: string;
  title: string;
  description: string;
  keywords?: string[];
}): Metadata {
  const locale = metadataLocale(lang);
  const url = pageUrl(lang, path);

  return {
    title: { absolute: title },
    description,
    keywords,
    other: {
      "content-language": locale.contentLanguage,
    },
    alternates: {
      canonical: url,
      languages: pageLanguageAlternates(path),
    },
    robots: publicRobots,
    openGraph: {
      type: "website",
      siteName: siteMetadata.name,
      title,
      description,
      url,
      locale: locale.ogLocale,
      alternateLocale: [locale.alternateOgLocale],
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImagePath],
    },
  };
}

export function privatePageMetadata({
  lang,
  path,
  title,
  description,
}: {
  lang: PublicLang;
  path: string;
  title: string;
  description: string;
}): Metadata {
  const locale = metadataLocale(lang);
  const url = pageUrl(lang, path);

  return {
    title: { absolute: title },
    description,
    other: {
      "content-language": locale.contentLanguage,
    },
    alternates: {
      canonical: url,
      languages: pageLanguageAlternates(path),
    },
    openGraph: {
      type: "website",
      siteName: siteMetadata.name,
      title,
      description,
      url,
      locale: locale.ogLocale,
      alternateLocale: [locale.alternateOgLocale],
      images: [
        {
          url: ogImagePath,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImagePath],
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export function localizedPath(lang: PublicLang, path = "") {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `/${lang}${suffix === "/" ? "" : suffix}`;

}

export function isPublicLang(value: string | undefined): value is PublicLang {
  return value === "zh" || value === "en";
}

export function pathnameWithoutPublicLang(pathname: string) {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const segments = normalized.split("/");
  return isPublicLang(segments[1])
    ? `/${segments.slice(2).join("/")}`.replace(/\/$/, "") || "/"
    : normalized;
}

export function localizedRoutePath(lang: PublicLang, pathname = "/") {
  return localizedPath(lang, pathnameWithoutPublicLang(pathname));

}

export function pageUrl(lang: PublicLang, path = "") {
  return `${siteUrl}${localizedPath(lang, path)}`;

}

export function pageLanguageAlternates(path = "") {
  return {
    "zh-CN": pageUrl("zh", path),
    en: pageUrl("en", path),
    "x-default": pageUrl(defaultPublicLang, path),
  };

}

export function normalizePublicLang(value: string | undefined): PublicLang {
  return value === "en" ? "en" : "zh";

}
