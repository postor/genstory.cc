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
      zh: "以根作品、章节、页面和媒体附件承载长篇文字叙事。",
      en: "Long-form written narratives organized as root work, chapters, pages, and media attachments.",
    },
    enabled: true,
  },
  {
    id: "comic",
    label: { zh: "漫画", en: "Comic" },
    description: {
      zh: "围绕分镜、页面、角色和视觉资产发布连续画面作品。",
      en: "Serial visual works built around panels, pages, characters, and visual assets.",
    },
    enabled: true,
  },
  {
    id: "visual-novel",
    label: { zh: "视觉小说", en: "Visual Novel" },
    description: {
      zh: "用角色、场景、分支和选择项组织可阅读的互动故事。",
      en: "Readable interactive stories organized with characters, scenes, branches, and choices.",
    },
    enabled: true,
  },
  {
    id: "interactive-video",
    label: { zh: "互动视频", en: "Interactive Video" },
    description: {
      zh: "视频片段、音频和选择点组成可播放、可互动的叙事作品。",
      en: "Playable, interactive narratives composed of video clips, audio, and choice points.",
    },
    enabled: false,
  },
  {
    id: "phaser-game",
    label: { zh: "Phaser 游戏", en: "Phaser Game" },
    description: {
      zh: "用菜单、场景和可编辑 JavaScript 创建可运行的 Phaser 浏览器游戏。",
      en: "Build runnable Phaser browser games from menus, scenes, and editable JavaScript.",
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
