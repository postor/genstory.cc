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
    heroTitle: "让想象，成为世界",
    heroSubtitle: "CC 你 AI 创作伙伴，陪你创造故事、角色与世界。",
    heroBody:
      "GenStory.cc 是 100% 开源、本地优先的浏览器创作工作台，支持图书、漫画、视觉小说、互动视频和 Phaser 游戏。项目文件和素材默认留在这台设备中，不会自动上传。",
    ctaCreate: "开始创作",
    ctaBrowseTypes: "探索创作类型",
    pillarsTitle: "为长期创作设计",
    localProjects: "我的作品",
    faqTitle: "常见问题",
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
        body: "备份后可以继续编辑，也可以授权后手动同步到自己的云盘；视觉小说和 Phaser 游戏还可以在浏览器中预览并导出运行包。",
      },
    ],
    faqs: [
      {
        question: "GenStory.cc 是 AI 故事生成器吗？",
        answer:
          "不是单纯的 AI 生成器。GenStory.cc 的核心是浏览器里的项目工作台，用来组织源码文件、脚本、场景、素材和备份；AI 辅助是可选能力。",
      },
      {
        question: "作品会自动上传到 GenStory.cc 吗？",
        answer:
          "不会。项目文件和素材默认保存在当前浏览器中。需要换设备或清理浏览器数据前，请先下载源码 ZIP，或在设置中授权后手动同步到 Google Drive。",
      },
    ],
  },
  en: {
    heroTitle: "Let imagination become a world",
    heroSubtitle: "CC is your AI creative partner for stories, characters, and worlds.",
    heroBody:
      "GenStory.cc is a 100% open-source, local-first browser workspace for books, comics, visual novels, interactive videos, and Phaser games. Project files and assets stay on this device by default and are not automatically uploaded.",
    ctaCreate: "Start creating",
    ctaBrowseTypes: "Explore creation types",
    pillarsTitle: "Designed for long-running creative work",
    localProjects: "My works",
    faqTitle: "FAQ",
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
        body: "Project backups can be imported for continued editing or manually synced to your own cloud drive after authorization, while visual novels and Phaser games preview and export as runnable packages.",
      },
    ],
    faqs: [
      {
        question: "Is GenStory.cc an AI story generator?",
        answer:
          "Not primarily. GenStory.cc is a browser project workspace for source files, scripts, scenes, assets, and backups. AI assistance is optional.",
      },
      {
        question: "Does GenStory.cc automatically upload my work?",
        answer:
          "No. Project files and assets stay in this browser by default. Before changing devices or clearing browser data, download a source ZIP or manually sync to Google Drive after authorization.",
      },
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
    localProjects: string;
    faqTitle: string;
    pillars: Array<{ title: string; body: string }>;
    faqs: Array<{ question: string; answer: string }>;
  }
>;
