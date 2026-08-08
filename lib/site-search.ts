import {
  contentTypeById,
  type ContentTypeId,
} from "./content-types.ts";
import {
  localizedPath,
  publicPageSlugs,
  publicPages,
  type PublicLang,
} from "./seo.ts";
import type { Lang } from "./i18n.ts";

export interface SearchLocalProject {
  id: string;
  title: string;
  template: ContentTypeId;
  lang: Lang;
  createdAt: number;
  updatedAt: number;
}

export interface SearchDocument {
  kind: "document";
  slug: string;
  title: string;
  label: string;
  description: string;
  keywords: string[];
  href: string;
}

export interface SearchDocumentResult {
  kind: "document";
  kindLabel: string;
  slug: string;
  title: string;
  content: string;
  label: string;
  description: string;
  href: string;
}

export interface SearchProjectResult {
  kind: "project";
  kindLabel: string;
  id: string;
  title: string;
  content: string;
  label: string;
  templateLabel: string;
  description: string;
  href: string;
}

export type SearchResult = SearchDocumentResult | SearchProjectResult;

const typeIndexCopy: Record<
  PublicLang,
  { title: string; label: string; description: string }
> = {
  zh: {
    title: "浏览器故事与游戏创作工具",
    label: "创作类型总览",
    description: "探索图书、漫画、视觉小说、互动视频和 Phaser 游戏的浏览器创作流程。",
  },
  en: {
    title: "Browser Story and Game Creation Tools",
    label: "Creation type guide",
    description:
      "Explore browser workflows for books, comics, visual novels, interactive videos, and Phaser games.",
  },
};

export function buildSearchDocuments(lang: PublicLang): SearchDocument[] {
  const typesDocument: SearchDocument = {
    kind: "document",
    slug: "types",
    title: typeIndexCopy[lang].title,
    label: typeIndexCopy[lang].label,
    description: typeIndexCopy[lang].description,
    keywords: [
      lang === "zh" ? "故事创作工具" : "story creation tool",
      lang === "zh" ? "浏览器创作工具" : "browser creative workspace",
    ],
    href: localizedPath(lang, "types"),
  };

  return [
    typesDocument,
    ...publicPageSlugs.map((slug) => {
      const page = publicPages[slug];
      return {
        kind: "document" as const,
        slug,
        title: page.heading[lang],
        label: page.kicker[lang],
        description: page.description[lang],
        keywords: [
          page.title[lang],
          ...page.description[lang].split(/[，。；、,\.;:：/ ]+/),
        ],
        href: localizedPath(lang, slug),
      };
    }),
  ];
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function matchScore(query: string, values: readonly string[]): number {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return 0;

  let score = 0;
  for (const value of values) {
    const normalizedValue = normalize(value);
    if (!normalizedValue) continue;
    if (normalizedValue === normalizedQuery) score = Math.max(score, 100);
    else if (normalizedValue.startsWith(normalizedQuery)) score = Math.max(score, 80);
    else if (normalizedValue.includes(normalizedQuery)) score = Math.max(score, 50);
  }
  return score;
}

function searchContext(
  text: string,
  query: string,
  radius = 84,
): string {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  const normalizedQuery = normalize(query);
  const matchIndex = normalizedText.toLocaleLowerCase().indexOf(normalizedQuery);

  if (matchIndex < 0 || normalizedText.length <= radius * 2) {
    return normalizedText;
  }

  const start = Math.max(0, matchIndex - radius);
  const end = Math.min(normalizedText.length, matchIndex + normalizedQuery.length + radius);
  return `${start > 0 ? "..." : ""}${normalizedText.slice(start, end)}${
    end < normalizedText.length ? "..." : ""
  }`;
}

export function searchSiteContent(
  query: string,
  documents: readonly SearchDocument[],
  projects: readonly SearchLocalProject[],
  lang: PublicLang,
): SearchResult[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];

  const documentResults: SearchDocumentResult[] = documents
    .map((document) => ({
      document,
      score: matchScore(normalizedQuery, [
        document.title,
        document.label,
        document.description,
        ...document.keywords,
      ]),
    }))
    .filter((entry) => entry.score > 0)
    .map(({ document }) => ({
      kind: "document" as const,
      kindLabel: lang === "zh" ? "页面" : "Page",
      slug: document.slug,
      title: document.title,
      content: searchContext(document.description, normalizedQuery),
      label: document.label,
      description: document.description,
      href: document.href,
    }));

  const projectResults = projects
    .map((project) => {
      const type = contentTypeById[project.template];
      const templateLabel = type.label[lang];
      return {
        result: {
          kind: "project" as const,
          kindLabel: lang === "zh" ? "项目" : "Project",
          id: project.id,
          title: templateLabel,
          content: project.title,
          label: lang === "zh" ? "本地项目" : "Local project",
          templateLabel,
          description: `${templateLabel} · ${new Date(project.updatedAt).toLocaleDateString(
            lang === "zh" ? "zh-CN" : "en-US",
          )}`,
          href: localizedPath(lang, `projects/editor?id=${encodeURIComponent(project.id)}`),
        },
        score: matchScore(normalizedQuery, [project.title, templateLabel]),
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.result.id.localeCompare(a.result.id))
    .map(({ result }) => result);

  return [...documentResults, ...projectResults];
}
