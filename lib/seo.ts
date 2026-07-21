export type PublicLang = "zh" | "en";

export type PublicPageSlug =
  | "book"
  | "comic"
  | "visual-novel"
  | "interactive-video"
  | "phaser-game";

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://genstory.cc";
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
  zhTitle: "GenStory.cc - 在浏览器中创作故事",
  enTitle: "GenStory.cc - Create stories in the browser",
  zhDescription:
    "GenStory.cc 是一个在浏览器中运行的故事创作工作台，支持图书、漫画、视觉小说、互动视频和 Phaser 游戏。作品内容和素材保存在这台设备的浏览器中，可下载项目备份、选择性同步到自己的云盘并导出可运行项目。",
  enDescription:
    "GenStory.cc is a local-first creative workspace for books, comics, visual novels, interactive videos, and Phaser games. Projects stay in your browser, can be exported as source ZIPs or runnable projects, and can optionally sync to a cloud drive you authorize.",
  keywords: [
    "GenStory.cc",
    "视觉小说编辑器",
    "OpenWebGal 编辑器",
    "本地优先写作工具",
    "漫画创作工具",
    "互动视频创作工具",
    "Phaser 游戏编辑器",
    "browser visual novel editor",
    "local-first writing app",
    "OpenWebGal exporter",
    "comic writing workspace",
    "interactive video authoring tool",
    "Phaser game editor",
    "browser game editor",
  ],
};

export const publicPageSlugs: PublicPageSlug[] = [
  "book",
  "comic",
  "visual-novel",
  "interactive-video",
  "phaser-game",
];

export const siteFeatureList: Record<PublicLang, string[]> = {
  zh: [
    "作品保存在浏览器中",
    "图书、漫画、视觉小说、互动视频和 Phaser 游戏模板",
    "项目备份下载和导入",
    "可选的 Google Drive 和 Dropbox 同步",
    "视觉小说浏览器预览",
    "OpenWebGal 独立项目导出",
  ],
  en: [
    "Local-first project files",
    "Book, comic, visual novel, interactive video, and Phaser game templates",
    "Source ZIP backup and import",
    "Optional Google Drive and Dropbox sync",
    "Visual novel preview in the browser",
    "Standalone OpenWebGal project export",
  ],
};

export const publicPageKeywords: Record<
  PublicPageSlug,
  Record<PublicLang, string[]>
> = {
  book: {
    zh: ["图书创作工具", "浏览器写作工具", "本地优先写作", "小说创作软件"],
    en: ["book creation tool", "browser writing app", "local-first writing", "novel writing software"],
  },
  comic: {
    zh: ["漫画创作工具", "漫画分镜软件", "浏览器漫画编辑器", "漫画项目管理"],
    en: ["comic creation tool", "comic storyboard software", "browser comic editor", "comic project workspace"],
  },
  "visual-novel": {
    zh: ["视觉小说编辑器", "视觉小说制作工具", "浏览器视觉小说引擎", "OpenWebGal 编辑器"],
    en: ["visual novel editor", "visual novel maker", "browser visual novel engine", "OpenWebGal editor"],
  },
  "interactive-video": {
    zh: ["互动视频创作工具", "互动短片制作", "分支视频编辑器", "互动叙事工具"],
    en: ["interactive video authoring", "interactive short film maker", "branching video editor", "interactive storytelling tool"],
  },
  "phaser-game": {
    zh: ["Phaser 游戏编辑器", "Phaser 游戏制作工具", "浏览器游戏开发", "JavaScript 游戏模板"],
    en: ["Phaser game editor", "Phaser game maker", "browser game development", "JavaScript game template"],
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
      zh: "视觉小说编辑器 - GenStory.cc",
      en: "Visual Novel Editor - GenStory.cc",
    },
    description: {
      zh: "在浏览器中创作视觉小说，管理剧本、场景、角色和资产，并导出 OpenWebGal 项目。",
      en: "Create visual novels in the browser, manage scripts, scenes, characters, and assets, and export OpenWebGal projects.",
    },
    kicker: { zh: "视觉小说", en: "Visual novels" },
    heading: {
      zh: "用清晰的项目结构创作视觉小说",
      en: "Create visual novels with a clear project structure",
    },
    intro: {
      zh: "GenStory.cc 将剧本、场景、角色和素材整理成清晰的项目结构，让互动叙事更容易维护、预览和导出。",
      en: "GenStory.cc organizes scripts, scenes, characters, and assets into a clear project structure for interactive stories that are easy to maintain, preview, and export.",
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
          zh: "视觉小说可以直接在浏览器中预览，无需额外安装编译环境。",
          en: "Visual novels can be previewed directly in the browser without installing a separate build environment.",
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
        question: { zh: "GenStory.cc 会把项目上传到服务器吗？", en: "Does GenStory.cc upload my project to a server?" },
        answer: {
          zh: "不会自动上传到 GenStory.cc 服务器。作品内容和素材默认保存在这台设备的浏览器中；如果你在设置页授权 Google Drive 或 Dropbox，项目页可以直接把文件同步到云盘的隔离目录。换设备或清理浏览器数据前，请先下载项目备份或完成一次云盘同步。",
          en: "Not to GenStory.cc servers. Work and assets stay in this browser by default; if you authorize Google Drive or Dropbox in Settings, Projects can sync files directly to that provider's isolated app folder. Before changing devices or clearing browser data, download a source ZIP or complete a cloud sync.",
        },
      },
      {
        question: { zh: "导出的 ZIP 可以直接发布吗？", en: "Can the exported ZIP be published directly?" },
        answer: {
          zh: "OpenWebGal 导出 ZIP 用于运行和发布；项目备份用于保存作品，并在之后重新导入继续编辑。",
          en: "The OpenWebGal export ZIP is for running and publishing; the project backup is for keeping your work and importing it later for editing.",
        },
      },
      {
        question: { zh: "OpenWebGal 在 GenStory.cc 中是什么？", en: "What is OpenWebGal in GenStory.cc?" },
        answer: {
          zh: "OpenWebGal 是视觉小说的预览和导出运行目标，不是独立的 GenStory.cc 项目类型。视觉小说项目可以编译并导出为 OpenWebGal 项目。",
          en: "OpenWebGal is the preview and export runtime target for visual novels, not a separate GenStory.cc project type. Visual novel projects can be compiled and exported as OpenWebGal projects.",
        },
      },
    ],
  },
  comic: {
    title: { zh: "漫画创作工具 - GenStory.cc", en: "Comic Creation Workspace - GenStory.cc" },
    description: {
      zh: "用 GenStory.cc 在浏览器中组织漫画项目、分镜、页面、角色和视觉资产，保持源码可备份、可恢复。",
      en: "Use GenStory.cc to organize comic projects, panels, pages, characters, and visual assets in a browser workspace with restorable source backups.",
    },
    kicker: { zh: "漫画", en: "Comics" },
    heading: { zh: "把漫画创作拆成可维护的项目结构", en: "Structure comic creation into maintainable project files" },
    intro: {
      zh: "从分镜到页面，从角色到媒体附件，GenStory.cc 用浏览器中的项目文件承载连续画面作品的创作过程。",
      en: "From panels to pages and characters to media attachments, GenStory.cc stores the comic creation process in project files in your browser.",
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
      zh: "在浏览器中写作和管理图书项目，用章节、页面和媒体附件组织长篇文字叙事。",
      en: "Write and manage book projects in the browser with chapters, pages, and media attachments for long-form narrative work.",
    },
    kicker: { zh: "图书", en: "Books" },
    heading: { zh: "适合长篇叙事的浏览器写作空间", en: "A browser writing space for long-form narratives" },
    intro: {
      zh: "GenStory.cc 让图书项目以清晰的源文件存在于浏览器中，适合小说、设定集、章节式内容和带素材的长篇创作。",
      en: "GenStory.cc keeps book projects as clear source files in the browser, suited for novels, lore documents, chaptered content, and media-rich writing.",
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
        title: { zh: "下载项目备份", en: "Download project backups" },
        body: {
          zh: "下载 ZIP 备份可以把作品带出浏览器，之后重新导入即可继续编辑。",
          en: "Download a ZIP backup to move your work out of the browser and import it later for continued editing.",
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
  "interactive-video": {
    title: {
      zh: "互动视频创作工具 - GenStory.cc",
      en: "Interactive Video Authoring Tool - GenStory.cc",
    },
    description: {
      zh: "用 GenStory.cc 组织互动视频的片段、镜头、视频、配音和选择点，规划可播放的分支叙事项目。",
      en: "Use GenStory.cc to organize interactive video segments, shots, video, voice, and choice points into playable branching narratives.",
    },
    kicker: { zh: "互动视频", en: "Interactive video" },
    heading: {
      zh: "把视频、声音和选择点组织成互动叙事",
      en: "Turn video, sound, and choices into interactive narratives",
    },
    intro: {
      zh: "互动视频项目以片段和时间线为骨架，将镜头、视频、配音与分支选择保存在清晰的浏览器项目文件中。",
      en: "Interactive video projects use segments and timelines as their structure, keeping shots, video, voice, and branching choices in clear project files in your browser.",
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
      zh: "Phaser 游戏创作工具 - GenStory.cc",
      en: "Phaser Game Creation Tool - GenStory.cc",
    },
    description: {
      zh: "在浏览器中创建可运行的 Phaser 游戏项目，编辑菜单、场景、JavaScript、样式和资产计划，并导出源码。",
      en: "Create runnable Phaser game projects in the browser, edit menus, scenes, JavaScript, styles, and asset plans, then export the source.",
    },
    kicker: { zh: "Phaser 游戏", en: "Phaser games" },
    heading: {
      zh: "从可编辑源文件开始制作 Phaser 浏览器游戏",
      en: "Build Phaser browser games from editable source files",
    },
    intro: {
      zh: "GenStory.cc 为 Phaser 游戏提供菜单场景、可操作测试场景和清晰的 HTML、JavaScript、CSS 项目结构，方便继续扩展。",
      en: "GenStory.cc gives Phaser games a menu scene, a playable test scene, and a clear HTML, JavaScript, and CSS structure that is ready to extend.",
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
        question: { zh: "Phaser 游戏可以导出吗？", en: "Can Phaser games be exported?" },
        answer: {
          zh: "可以。项目可以下载为 ZIP 备份，包含 HTML、JavaScript、CSS 和资产计划，适合继续开发或部署。",
          en: "Yes. Projects can be downloaded as ZIP backups containing HTML, JavaScript, CSS, and the asset plan for further development or deployment.",
        },
      },
      {
        question: { zh: "没有生成图片和音频也能运行吗？", en: "Can a game run before images and audio are generated?" },
        answer: {
          zh: "可以。Phaser 模板先提供无需外部媒体即可运行的菜单和测试场景，后续再按资产索引接入媒体。",
          en: "Yes. The Phaser template provides menu and test scenes that run without external media, which can be added later from the asset index.",
        },
      },
    ],
  },
};

export function localizedPath(lang: PublicLang, path = "") {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `/${lang}${suffix === "/" ? "" : suffix}`;

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
