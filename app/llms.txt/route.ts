import {
  getDocumentationArticles,
  getDocumentationSectionCopy,
  type DocumentationKind,
} from "@/lib/guides-faq";
import {
  pageUrl,
  publicLanguages,
  publicPageSlugs,
  publicPages,
  siteFeatureList,
  siteMetadata,
  siteTrustSummary,
  siteUrl,
  type PublicLang,
} from "@/lib/seo";

export const dynamic = "force-static";

const languageCopy = {
  zh: {
    label: "Chinese",
    home: "Home",
    types: "Creation types",
    showcase: "Showcase",
    typesDescription:
      "Overview of every browser creation workflow supported by GenStory.cc.",
    showcaseDescription:
      "Template source ZIPs and complete case projects that can be previewed or downloaded.",
  },
  en: {
    label: "English",
    home: "Home",
    types: "Creation types",
    showcase: "Showcase",
    typesDescription:
      "Overview of every browser creation workflow supported by GenStory.cc.",
    showcaseDescription:
      "Template source ZIPs and complete case projects that can be previewed or downloaded.",
  },
} satisfies Record<
  PublicLang,
  {
    label: string;
    home: string;
    types: string;
    showcase: string;
    typesDescription: string;
    showcaseDescription: string;
  }
>;

const documentationKinds = ["guides", "faq"] as const;

function oneLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function absolutePath(path: string) {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function linkLine(title: string, url: string, description: string) {
  return `- [${title}](${url}): ${oneLine(description)}`;
}

async function languageSection(lang: PublicLang) {
  const copy = languageCopy[lang];
  const articles = await getDocumentationArticles(lang);
  const lines = [
    `## ${copy.label}`,
    "",
    linkLine(copy.home, pageUrl(lang), siteTrustSummary[lang]),
    linkLine(copy.types, pageUrl(lang, "types"), copy.typesDescription),
    linkLine(copy.showcase, pageUrl(lang, "showcase"), copy.showcaseDescription),
    "",
    "### Creation Workflows",
    "",
    ...publicPageSlugs.map((slug) =>
      linkLine(
        publicPages[slug].heading[lang],
        pageUrl(lang, slug),
        publicPages[slug].description[lang],
      ),
    ),
  ];

  for (const kind of documentationKinds) {
    lines.push("", ...documentationSection(lang, kind, articles));
  }

  return lines.join("\n");
}

function documentationSection(
  lang: PublicLang,
  kind: DocumentationKind,
  articles: Awaited<ReturnType<typeof getDocumentationArticles>>,
) {
  const copy = getDocumentationSectionCopy(lang, kind);
  const sectionArticles = articles.filter((article) => article.kind === kind);

  return [
    `### ${copy.title}`,
    "",
    linkLine(copy.title, pageUrl(lang, kind), copy.description),
    ...sectionArticles.map((article) =>
      linkLine(article.title, absolutePath(article.href), article.description),
    ),
  ];
}

export async function GET() {
  const sections = await Promise.all(publicLanguages.map(languageSection));
  const lines = [
    "# GenStory.cc",
    "",
    `> ${siteMetadata.enDescription}`,
    "",
    "GenStory.cc is an open-source, local-first browser workspace for stories, visual projects, interactive video planning, visual novels, and Phaser games. Project files stay in the browser by default and can be backed up as source ZIP files.",
    "",
    "## Core Features",
    "",
    ...siteFeatureList.en.map((feature) => `- ${feature}`),
    "",
    ...sections,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
