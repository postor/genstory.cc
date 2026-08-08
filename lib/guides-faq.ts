import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";

import { localizedPath, type PublicLang } from "@/lib/seo";

export type DocumentationKind = "guides" | "faq";

type FrontMatter = {
  title?: string;
  slug?: string;
  seoTitle?: string;
  description?: string;
  route?: string;
  locale?: PublicLang;
  contentType?: "guide" | "faq";
  category?: string;
  draft?: boolean;
};

export type DocumentationArticle = {
  id: string;
  lang: PublicLang;
  kind: DocumentationKind;
  title: string;
  seoTitle: string;
  description: string;
  href: string;
  slugPath: string;
  slugSegments: string[];
  categoryId: string;
  categoryLabel: string;
  body: string;
  orderKey: string;
};

export type DocumentationCategory = {
  id: string;
  title: string;
  articles: DocumentationArticle[];
};

export type DocumentationSection = {
  kind: DocumentationKind;
  title: string;
  href: string;
  categories: DocumentationCategory[];
};

const docsRoot = path.join(process.cwd(), "docs", "guides-faq");
const articleCache = new Map<PublicLang, Promise<DocumentationArticle[]>>();

const categoryLabels: Record<PublicLang, Record<string, string>> = {
  zh: {
    "getting-started": "开始使用",
    "project-management": "项目管理",
    ai: "AI 创作",
    book: "图书",
    "picture-book": "绘本",
    comic: "漫画",
    "visual-novel": "视觉小说",
    "interactive-video": "互动视频",
    game: "游戏",
    projects: "项目",
    "ai-and-privacy": "AI 与隐私",
    "export-and-publishing": "导出与发布",
    "creation-types": "创作类型",
  },
  en: {},
};

const sectionLabels: Record<
  PublicLang,
  Record<DocumentationKind, { title: string; description: string }>
> = {
  zh: {
    guides: {
      title: "使用指南",
      description: "按创作流程查找项目、AI 和各种作品类型的实践指南。",
    },
    faq: {
      title: "常见问题",
      description: "快速了解项目保存、隐私、导出和创作类型等常见问题。",
    },
  },
  en: {
    guides: {
      title: "Guides",
      description: "Practical guidance for projects, AI workflows, and creation types.",
    },
    faq: {
      title: "FAQ",
      description: "Answers about project storage, privacy, exports, and creation types.",
    },
  },
};

function stripOrderingPrefix(value: string) {
  return value.replace(/^\d+-/, "");
}

function humanize(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayCategoryLabel(lang: PublicLang, id: string) {
  return categoryLabels[lang][id] ?? humanize(id);
}

function firstHeading(markdown: string) {
  return markdown
    .split(/\r?\n/)
    .map((line) => line.match(/^#\s+(.+?)\s*$/)?.[1])
    .find(Boolean)
    ?.trim();
}

function removeLeadingHeading(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const firstContentLine = lines.findIndex((line) => line.trim().length > 0);
  if (firstContentLine < 0 || !/^#\s+/.test(lines[firstContentLine])) {
    return markdown.trim();
  }

  lines.splice(firstContentLine, 1);
  while (lines[firstContentLine]?.trim() === "") {
    lines.splice(firstContentLine, 1);
  }
  return lines.join("\n").trim();
}

function parseDocument(text: string) {
  const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
  const frontMatter = match
    ? (yaml.load(match[1]) as FrontMatter | null | undefined) ?? {}
    : {};
  const body = match ? text.slice(match[0].length) : text;

  return {
    frontMatter,
    body,
  };
}

async function findMarkdownFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findMarkdownFiles(entryPath)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(entryPath);
    }
  }

  return files;
}

function getKindFromPath(filePath: string): DocumentationKind {
  const relativePath = path.relative(docsRoot, filePath);
  return stripOrderingPrefix(relativePath.split(path.sep)[1] ?? "") === "faq"
    ? "faq"
    : "guides";
}

function buildFallbackRoute(
  lang: PublicLang,
  kind: DocumentationKind,
  filePath: string,
  frontMatter: FrontMatter,
) {
  const relativePath = path.relative(
    path.join(docsRoot, lang),
    filePath,
  );
  const parts = relativePath.split(path.sep);
  const category = stripOrderingPrefix(parts.at(-2) ?? "general");
  const filename = stripOrderingPrefix(
    (parts.at(-1) ?? "article.md").replace(/\.md$/i, ""),
  );
  const slug = frontMatter.slug ?? filename;
  return localizedPath(lang, `${kind}/${category}/${slug}`);
}

async function readArticles(lang: PublicLang): Promise<DocumentationArticle[]> {
  const languageRoot = path.join(docsRoot, lang);
  const files = await findMarkdownFiles(languageRoot);
  const articles: DocumentationArticle[] = [];

  for (const filePath of files) {
    const source = await readFile(filePath, "utf8");
    const { frontMatter, body } = parseDocument(source);
    const kind = getKindFromPath(filePath);
    if (frontMatter.draft === true) continue;

    const relativePath = path.relative(languageRoot, filePath);
    const pathParts = relativePath.split(path.sep);
    const categoryId = stripOrderingPrefix(pathParts.at(-2) ?? "general");
    const href =
      typeof frontMatter.route === "string" && frontMatter.route.startsWith("/")
        ? frontMatter.route
        : buildFallbackRoute(lang, kind, filePath, frontMatter);
    const routeParts = href.split("/").filter(Boolean);
    const slugSegments = routeParts.slice(2);
    const title =
      frontMatter.title?.trim() ||
      firstHeading(body) ||
      humanize(stripOrderingPrefix(path.basename(filePath, ".md")));
    const description =
      frontMatter.description?.trim() ||
      `${title} - GenStory.cc`;

    articles.push({
      id: `${lang}:${href}`,
      lang,
      kind,
      title,
      seoTitle: frontMatter.seoTitle?.trim() || `${title} - GenStory.cc`,
      description,
      href,
      slugPath: slugSegments.join("/"),
      slugSegments,
      categoryId,
      categoryLabel: displayCategoryLabel(lang, categoryId),
      body: removeLeadingHeading(body),
      orderKey: pathParts
        .map((part) => stripOrderingPrefix(part))
        .join("/"),
    });
  }

  return articles.sort((left, right) =>
    left.orderKey.localeCompare(right.orderKey),
  );
}

export function getDocumentationArticles(lang: PublicLang) {
  const cached = articleCache.get(lang);
  if (cached) return cached;

  const promise = readArticles(lang);
  articleCache.set(lang, promise);
  return promise;
}

export async function getDocumentationArticle(
  lang: PublicLang,
  kind: DocumentationKind,
  slugSegments: string[],
) {
  const slugPath = slugSegments.join("/");
  const articles = await getDocumentationArticles(lang);
  return articles.find(
    (article) => article.kind === kind && article.slugPath === slugPath,
  );
}

export async function getDocumentationTree(
  lang: PublicLang,
): Promise<DocumentationSection[]> {
  const articles = await getDocumentationArticles(lang);

  return (["guides", "faq"] as const).map((kind) => {
    const categories = new Map<string, DocumentationArticle[]>();

    for (const article of articles) {
      if (article.kind !== kind) continue;
      const categoryArticles = categories.get(article.categoryId) ?? [];
      categoryArticles.push(article);
      categories.set(article.categoryId, categoryArticles);
    }

    return {
      kind,
      title: sectionLabels[lang][kind].title,
      href: localizedPath(lang, kind),
      categories: [...categories.entries()].map(([id, categoryArticles]) => ({
        id,
        title: displayCategoryLabel(lang, id),
        articles: categoryArticles,
      })),
    };
  });
}

export function getDocumentationSectionCopy(
  lang: PublicLang,
  kind: DocumentationKind,
) {
  return sectionLabels[lang][kind];
}
