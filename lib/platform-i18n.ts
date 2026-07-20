import type { PublicLang } from "./seo.ts";
import { siteMetadata } from "./seo.ts";

export const languageInfo = {
  zh: {
    htmlLang: "zh-CN",
    contentLanguage: "zh-CN",
    schemaLanguage: "zh-CN",
    dateLocale: "zh-CN",
    ogLocale: "zh_CN",
    alternateOgLocale: "en_US",
  },
  en: {
    htmlLang: "en",
    contentLanguage: "en",
    schemaLanguage: "en",
    dateLocale: "en-US",
    ogLocale: "en_US",
    alternateOgLocale: "zh_CN",
  },
} satisfies Record<
  PublicLang,
  {
    htmlLang: string;
    contentLanguage: string;
    schemaLanguage: string;
    dateLocale: string;
    ogLocale: string;
    alternateOgLocale: string;
  }
>;

export const localizedSiteMetadata = {
  zh: {
    title: siteMetadata.zhTitle,
    description: siteMetadata.zhDescription,
  },
  en: {
    title: siteMetadata.enTitle,
    description: siteMetadata.enDescription,
  },
} satisfies Record<PublicLang, { title: string; description: string }>;

export const publicTopicChrome = {
  zh: {
    create: "开始创作",
    home: "返回首页",
    homeBreadcrumb: "首页",
    coreWorkflow: "核心能力",
    relatedTypes: "探索其他创作类型",
    faq: "常见问题",
  },
  en: {
    create: "Start creating",
    home: "Back home",
    homeBreadcrumb: "Home",
    coreWorkflow: "Core workflow",
    relatedTypes: "Explore other creation types",
    faq: "FAQ",
  },
} satisfies Record<
  PublicLang,
  {
    create: string;
    home: string;
    homeBreadcrumb: string;
    coreWorkflow: string;
    relatedTypes: string;
    faq: string;
  }
>;

export const publicHomeCopy = {
  zh: {
    heroTitle: "GenStory",
    heroSubtitle: "在浏览器中创作故事和游戏",
    heroBody:
      "在浏览器里创作图书、漫画、视觉小说、互动视频和 Phaser 游戏。作品内容和素材保存在这台设备的浏览器中，不会自动上传到 GenStory 服务器。可随时备份，也可以导出可运行项目。",
    ctaCreate: "开始创作",
    ctaBrowseTypes: "探索创作类型",
    pillarsTitle: "为长期创作设计",
    workflowTitle: "从创作到导出",
    localProjects: "我的作品",
    pillars: [
      {
        title: "保存在你的浏览器里",
        body: "作品内容和素材直接保存在这台设备的浏览器中。换设备或清理浏览器数据前，请先备份。",
      },
      {
        title: "结构化创作",
        body: "按章节、场景、脚本和素材组织故事，方便持续创作和维护。",
      },
      {
        title: "备份与发布",
        body: "备份后可以继续编辑；视觉小说和 Phaser 游戏还可以在浏览器中预览并导出运行包。",
      },
    ],
    workflows: [
      "选择图书、漫画、视觉小说、互动视频或 Phaser 游戏模板。",
      "直接在浏览器中编辑作品内容。",
      "预览作品，下载备份或导出运行包。",
    ],
  },
  en: {
    heroTitle: "GenStory",
    heroSubtitle: "Create stories and games in the browser",
    heroBody:
      "Create books, comics, visual novels, interactive videos, and Phaser games in the browser. Your work and assets stay in this browser on this device and are not automatically uploaded to GenStory servers. Back up your work or export runnable projects when ready.",
    ctaCreate: "Start creating",
    ctaBrowseTypes: "Explore creation types",
    pillarsTitle: "Designed for long-running creative work",
    workflowTitle: "From creation to export",
    localProjects: "My works",
    pillars: [
      {
        title: "Saved in your browser",
        body: "Your work and assets stay in this browser on this device. Back up before changing devices or clearing browser data.",
      },
      {
        title: "Structured creation",
        body: "Organize stories with chapters, scenes, scripts, and assets so they remain easy to grow and maintain.",
      },
      {
        title: "Backup and publish",
        body: "Project backups can be imported for continued editing, while visual novels and Phaser games preview and export as runnable packages.",
      },
    ],
    workflows: [
      "Choose a book, comic, visual novel, interactive video, or Phaser game template.",
      "Edit your work directly in the browser.",
      "Preview it, download a backup, or export a runnable package.",
    ],
  },
} satisfies Record<
  PublicLang,
  {
    heroTitle: string;
    heroSubtitle: string;
    heroBody: string;
    ctaCreate: string;
    ctaBrowseTypes: string;
    pillarsTitle: string;
    workflowTitle: string;
    localProjects: string;
    pillars: Array<{ title: string; body: string }>;
    workflows: string[];
  }
>;
