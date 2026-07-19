export type PublicLang = "zh" | "en";

export type PublicPageSlug = "visual-novel" | "comic" | "book" | "openwebgal";

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
  name: "GenStory",
  zhTitle: "GenStory - 本地优先的故事创作工作台",
  enTitle: "GenStory - Local-first story creation workspace",
  zhDescription:
    "GenStory 是一个在浏览器中运行的本地优先创作工作台，支持图书、漫画、视觉小说和互动视频项目，项目文件保存在本地浏览器，可导出源码 ZIP 与 OpenWebGal 项目。",
  enDescription:
    "GenStory is a local-first creative workspace for books, comics, visual novels, and interactive videos. Projects stay in your browser and can be exported as source ZIPs or OpenWebGal projects.",
  keywords: [
    "GenStory",
    "视觉小说编辑器",
    "OpenWebGal 编辑器",
    "本地优先写作工具",
    "漫画创作工具",
    "browser visual novel editor",
    "local-first writing app",
    "OpenWebGal exporter",
    "comic writing workspace",
  ],
};

export const publicPageSlugs: PublicPageSlug[] = [
  "visual-novel",
  "comic",
  "book",
  "openwebgal",

];

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
      zh: "视觉小说编辑器 - GenStory",
      en: "Visual Novel Editor - GenStory",
    },
    description: {
      zh: "在浏览器中创作视觉小说，管理剧本、场景、角色和资产，并导出 OpenWebGal 项目。",
      en: "Create visual novels in the browser, manage scripts, scenes, characters, and assets, and export OpenWebGal projects.",
    },
    kicker: { zh: "视觉小说", en: "Visual novels" },
    heading: {
      zh: "用真实项目文件创作视觉小说",
      en: "Create visual novels with real project files",
    },
    intro: {
      zh: "GenStory 将剧本、舞台状态、角色和资产拆成清晰的项目文件，让互动叙事保持可维护、可预览、可导出。",
      en: "GenStory keeps scripts, stage state, characters, and assets in clear project files so interactive stories stay maintainable, previewable, and exportable.",
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
          zh: "项目从真实源文件编译为 OpenWebGal game/* 文件，再通过浏览器端预览缓存运行，不需要后端编译服务。",
          en: "Projects compile from source files into OpenWebGal game/* files and run through a browser preview cache without a backend build service.",
        },
      },
      {
        title: { zh: "导出 OpenWebGal", en: "Export OpenWebGal" },
        body: {
          zh: "完成后可以导出可独立运行的 OpenWebGal ZIP，也可以下载源码 ZIP 作为可编辑备份。",
          en: "When ready, export a standalone OpenWebGal ZIP or download a source ZIP that can be imported later for editing.",
        },
      },
    ],
    faqs: [
      {
        question: { zh: "GenStory 会把项目上传到服务器吗？", en: "Does GenStory upload my project to a server?" },
        answer: {
          zh: "不会。项目正文和资产保存在浏览器 OPFS 中，IndexedDB 只保存项目索引和 UI 状态。",
          en: "No. Project text and assets are stored in browser OPFS, while IndexedDB stores only the project index and UI state.",
        },
      },
      {
        question: { zh: "导出的 ZIP 可以直接发布吗？", en: "Can the exported ZIP be published directly?" },
        answer: {
          zh: "OpenWebGal 导出 ZIP 面向运行和发布；源码 ZIP 面向备份和再次导入编辑。",
          en: "The OpenWebGal export ZIP is for running and publishing; the source ZIP is for backup and later editing.",
        },
      },
    ],
  },
  comic: {
    title: { zh: "漫画创作工具 - GenStory", en: "Comic Creation Workspace - GenStory" },
    description: {
      zh: "用 GenStory 在浏览器中组织漫画项目、分镜、页面、角色和视觉资产，保持源码可备份、可恢复。",
      en: "Use GenStory to organize comic projects, panels, pages, characters, and visual assets in a browser workspace with restorable source backups.",
    },
    kicker: { zh: "漫画", en: "Comics" },
    heading: { zh: "把漫画创作拆成可维护的项目结构", en: "Structure comic creation into maintainable project files" },
    intro: {
      zh: "从分镜到页面，从角色到媒体附件，GenStory 用本地项目文件承载连续画面作品的创作过程。",
      en: "From panels to pages and characters to media attachments, GenStory stores the comic creation process in local project files.",
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
        title: { zh: "本地源码", en: "Local source files" },
        body: {
          zh: "项目文件存放在浏览器私有文件系统中，可以导出源码 ZIP，用于迁移、备份或恢复。",
          en: "Project files live in the browser private file system and can be exported as source ZIPs for migration, backup, or restore.",
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
          zh: "可以。使用 GenStory 导出的源码 ZIP 可以从项目列表导入，恢复为新的本地项目。",
          en: "Yes. Source ZIPs exported by GenStory can be imported from the project list and restored as new local projects.",
        },
      },
    ],
  },
  book: {
    title: { zh: "本地优先写作工具 - GenStory", en: "Local-first Writing App - GenStory" },
    description: {
      zh: "在浏览器中写作和管理图书项目，用章节、页面和媒体附件组织长篇文字叙事。",
      en: "Write and manage book projects in the browser with chapters, pages, and media attachments for long-form narrative work.",
    },
    kicker: { zh: "图书", en: "Books" },
    heading: { zh: "面向长篇叙事的本地优先写作空间", en: "A local-first writing space for long-form narratives" },
    intro: {
      zh: "GenStory 让图书项目以清晰的源文件存在于浏览器中，适合小说、设定集、章节式内容和带素材的长篇创作。",
      en: "GenStory keeps book projects as clear source files in the browser, suited for novels, lore documents, chaptered content, and media-rich writing.",
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
        title: { zh: "无后端保存", en: "No-backend storage" },
        body: {
          zh: "项目内容写入浏览器 OPFS，应用本身可以作为静态站部署，不需要维护服务器文件系统。",
          en: "Project content is written to browser OPFS, so the app can be deployed as a static site without a server-side project filesystem.",
        },
      },
      {
        title: { zh: "源码备份", en: "Source backups" },
        body: {
          zh: "下载源码 ZIP 能把当前项目带出浏览器，未来也可以重新导入为可编辑项目。",
          en: "Source ZIP downloads let you move a project out of the browser and import it later as an editable project.",
        },
      },
    ],
    faqs: [
      {
        question: { zh: "清除浏览器数据会影响项目吗？", en: "Does clearing browser data affect projects?" },
        answer: {
          zh: "会。因为项目保存在浏览器 OPFS 中，建议定期下载源码 ZIP 备份。",
          en: "Yes. Because projects are stored in browser OPFS, regular source ZIP backups are recommended.",
        },
      },
    ],
  },
  openwebgal: {
    title: { zh: "OpenWebGal 导出工具 - GenStory", en: "OpenWebGal Export Tool - GenStory" },
    description: {
      zh: "GenStory 在浏览器内编译视觉小说项目，支持预览并导出可独立运行的 OpenWebGal 项目 ZIP。",
      en: "GenStory compiles visual novel projects in the browser, supports preview, and exports standalone OpenWebGal project ZIPs.",
    },
    kicker: { zh: "OpenWebGal", en: "OpenWebGal" },
    heading: { zh: "从浏览器项目导出 OpenWebGal 游戏", en: "Export OpenWebGal games from browser projects" },
    intro: {
      zh: "GenStory 将视觉小说源文件编译为 OpenWebGal 所需的 game/* 产物，并在导出时合并引擎资源。",
      en: "GenStory compiles visual novel source files into OpenWebGal game/* output and bundles engine assets during export.",
    },
    sections: [
      {
        title: { zh: "预览与发布分离", en: "Preview and publishing stay separate" },
        body: {
          zh: "浏览器预览使用桥接 Service Worker 读取缓存；导出 ZIP 会还原原始引擎 Service Worker，面向独立运行。",
          en: "Browser preview uses a bridge Service Worker to read cached output; exported ZIPs restore the original engine Service Worker for standalone use.",
        },
      },
      {
        title: { zh: "真实源文件编译", en: "Compiled from real source files" },
        body: {
          zh: "导出流程读取 meta.md、assets/index.yml、script.md 和 stage.yml，而不是读取临时 UI 状态。",
          en: "The export flow reads meta.md, assets/index.yml, script.md, and stage.yml instead of temporary UI state.",
        },
      },
      {
        title: { zh: "源码 ZIP 另行备份", en: "Source ZIPs remain editable backups" },
        body: {
          zh: "OpenWebGal ZIP 用于运行；源码 ZIP 用于保留可编辑项目结构，二者用途不同。",
          en: "OpenWebGal ZIPs are for running the game; source ZIPs preserve the editable project structure for future work.",
        },
      },
    ],
    faqs: [
      {
        question: { zh: "GenStory 是否替代 OpenWebGal 引擎？", en: "Does GenStory replace the OpenWebGal engine?" },
        answer: {
          zh: "不替代。GenStory 使用 vendored OpenWebGal 引擎作为预览和导出的运行目标。",
          en: "No. GenStory uses a vendored OpenWebGal engine as the runtime target for preview and export.",
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
