import type { Lang } from "@/lib/i18n";

export type ContentTypeId =
  | "book"
  | "comic"
  | "visual-novel"
  | "interactive-video"
  | "phaser-game";

export interface ContentTypeInfo {
  id: ContentTypeId;
  /** Bilingual display label. */
  label: Record<Lang, string>;
  /** Bilingual short description shown on the home page. */
  description: Record<Lang, string>;
  /** Whether this type appears on the home page work-type sections. */
  enabled: boolean;
}

// Mirrors backup's enabledContentCategoryConfigs (book + comic are enabled).
export const contentTypes: ContentTypeInfo[] = [
  {
    id: "book",
    label: { zh: "图书", en: "Book" },
    description: {
      zh: "适合小说、设定集和长篇内容的浏览器写作项目，以根作品、章节、页面和媒体附件整理。",
      en: "Browser writing projects for novels, lore documents, and long-form work organized as root work, chapters, pages, and media attachments.",
    },
    enabled: true,
  },
  {
    id: "comic",
    label: { zh: "漫画", en: "Comic" },
    description: {
      zh: "围绕分镜、页面、角色和视觉资产管理连续画面作品，适合前期规划和长期整理。",
      en: "Manage serial visual works around panels, pages, characters, and visual assets for planning and long-running organization.",
    },
    enabled: true,
  },
  {
    id: "visual-novel",
    label: { zh: "视觉小说", en: "Visual Novel" },
    description: {
      zh: "用剧本、角色、场景、分支和选择项组织互动故事，预览后导出 OpenWebGal 项目。",
      en: "Organize interactive stories with scripts, characters, scenes, branches, and choices, then preview and export an OpenWebGal project.",
    },
    enabled: true,
  },
  {
    id: "interactive-video",
    label: { zh: "互动视频", en: "Interactive Video" },
    description: {
      zh: "用视频片段、音频、时间线和选择点规划可播放、可互动的分支叙事作品。",
      en: "Plan playable, interactive branching narratives from video clips, audio, timelines, and choice points.",
    },
    enabled: false,
  },
  {
    id: "phaser-game",
    label: { zh: "游戏", en: "Game" },
    description: {
      zh: "用菜单、场景、可编辑 JavaScript、样式和资产计划创建可运行的 Phaser 浏览器游戏。",
      en: "Create runnable Phaser browser games from menus, scenes, editable JavaScript, styles, and asset plans.",
    },
    enabled: true,
  },
];

export const contentTypeById: Record<ContentTypeId, ContentTypeInfo> =
  Object.fromEntries(contentTypes.map((c) => [c.id, c])) as Record<
    ContentTypeId,
    ContentTypeInfo
  >;

/** Types shown on the home page (matches backup's enabled set). */
export const enabledContentTypes = contentTypes.filter((c) => c.enabled);
