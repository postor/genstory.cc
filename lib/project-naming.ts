import type { Lang } from "./i18n";
import type { ContentTypeId } from "./content-types";
import type { Project } from "./local-projects";

const TYPE_NAMES: Record<ContentTypeId, Record<Lang, string>> = {
  book: { zh: "图书", en: "Book" },
  comic: { zh: "漫画", en: "Comic" },
  "visual-novel": { zh: "视觉小说", en: "Visual Novel" },
  "interactive-video": { zh: "互动视频", en: "Interactive Video" },
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function defaultProjectTitlePrefix(type: ContentTypeId, lang: Lang): string {
  return lang === "zh" ? `新的${TYPE_NAMES[type][lang]}` : `New ${TYPE_NAMES[type][lang]}`;
}

export function nextDefaultProjectTitle(
  type: ContentTypeId,
  lang: Lang,
  projects: readonly Project[]
): string {
  const prefix = defaultProjectTitlePrefix(type, lang);
  const pattern = new RegExp(`^${escapeRegExp(prefix)}-(\\d+)$`);
  let max = 0;
  for (const project of projects) {
    if (project.template !== type) continue;
    const match = project.title.match(pattern);
    if (!match) continue;
    max = Math.max(max, Number.parseInt(match[1], 10));
  }
  return `${prefix}-${String(max + 1).padStart(2, "0")}`;
}
