import type { Lang } from "./i18n.ts";
import type { ContentTypeId } from "./content-types";
import type { ProjectTemplateFile } from "./file-system/types";
// The .ts suffix keeps the native Node strip-types test runner resolvable.
// @ts-expect-error TS5097: required by the native Node test runner.
import { buildVNProjectFiles } from "./vn/project-files.ts";
// @ts-expect-error TS5097: required by the native Node test runner.
import { seedRedRidingHood } from "./vn/seed.ts";

const AGENTS = `# GenStory 项目约束

本项目的正文事实保存在当前目录的真实文件中。

- 一个事实，一个来源；不要把正文复制到其他缓存文件。
- 遵循当前项目的设定、角色、时间线和资产索引。
- 使用相对路径和逻辑资产 ID，不要在故事文件中硬编码外部路径。
- 编辑前先理解上下文，编辑后校验引用、状态和结构。
`;

function text(path: string, content: string): ProjectTemplateFile {
  return { path, kind: "text", content };
}

function meta(type: ContentTypeId, title: string): string {
  return [
    "---",
    `title: ${JSON.stringify(title)}`,
    `type: ${type}`,
    "status: draft",
    "---",
    "",
    `# ${title}`,
    "",
    "这是一个由 GenStory 模板创建的本地项目。",
    "",
  ].join("\n");
}

export function defaultProjectTitle(lang: Lang): string {
  return lang === "zh" ? "小红帽" : "Little Red Riding Hood";
}

function simpleTemplate(type: ContentTypeId, title: string, lang: Lang): ProjectTemplateFile[] {
  const labels = {
    book: lang === "zh" ? "小红帽 · 第一章" : "Little Red Riding Hood · Chapter One",
    comic: lang === "zh" ? "小红帽 · 第一页" : "Little Red Riding Hood · Page One",
    "interactive-video":
      lang === "zh"
        ? "小红帽 · 第一段"
        : "Little Red Riding Hood · Segment One",
  };
  const body =
    lang === "zh"
      ? "小红帽带着点心，穿过森林去看望生病的外婆。"
      : "Little Red Riding Hood carries a basket through the forest to visit her sick grandmother.";
  const source =
    type === "book"
      ? ["chapter-001/meta.md", `---\ntitle: ${labels.book}\n---\n`, "chapter-001/pages/page-001.md", `# ${labels.book}\n\n${body}\n`]
      : type === "comic"
        ? ["chapter-001/meta.md", `---\ntitle: ${labels.comic}\n---\n`, "chapter-001/pages/page-001/meta.md", `---\ntitle: ${labels.comic}\n---\n`, "chapter-001/pages/page-001/script.md", `# ${labels.comic}\n\n${body}\n`]
        : ["chapter-001/meta.md", `---\ntitle: ${labels["interactive-video"]}\n---\n`, "chapter-001/segments/segment-001/meta.md", `---\ntitle: ${labels["interactive-video"]}\n---\n`, "chapter-001/segments/segment-001/script.md", `# ${labels["interactive-video"]}\n\n${body}\n`];

  const files: ProjectTemplateFile[] = [text("AGENTS.md", AGENTS), text("meta.md", meta(type, title))];
  for (let index = 0; index < source.length; index += 2) {
    files.push(text(source[index], source[index + 1]));
  }
  if (type === "comic" || type === "interactive-video") {
    files.push(text("assets/index.yml", "assets: []\n"));
  } else {
    files.push(text("references/.keep", ""));
  }
  return files;
}

function visualNovelTemplate(title: string): ProjectTemplateFile[] {
  const vn = seedRedRidingHood();
  vn.title = title;
  const generated = buildVNProjectFiles(vn, AGENTS);
  const files = generated
    .filter((file) => file.kind !== "asset")
    .map((file) => text(file.path, file.content));

  const assets = [
    ["assets/backgrounds/bg_home.png", "/project-templates/visual-novel/assets/backgrounds/bg_home.png"],
    ["assets/backgrounds/bg_forest.png", "/project-templates/visual-novel/assets/backgrounds/bg_forest.png"],
    ["assets/backgrounds/bg_grandma.png", "/project-templates/visual-novel/assets/backgrounds/bg_grandma.png"],
    ["assets/characters/red_normal.png", "/project-templates/visual-novel/assets/characters/red_normal.png"],
    ["assets/characters/red_curious.png", "/project-templates/visual-novel/assets/characters/red_curious.png"],
    ["assets/characters/red_sad.png", "/project-templates/visual-novel/assets/characters/red_sad.png"],
    ["assets/characters/wolf_sly.png", "/project-templates/visual-novel/assets/characters/wolf_sly.png"],
    ["assets/characters/wolf_proud.png", "/project-templates/visual-novel/assets/characters/wolf_proud.png"],
    ["assets/characters/wolf_fierce.png", "/project-templates/visual-novel/assets/characters/wolf_fierce.png"],
    ["assets/characters/grandma_weak.png", "/project-templates/visual-novel/assets/characters/grandma_weak.png"],
    ["assets/characters/woodcutter_brave.png", "/project-templates/visual-novel/assets/characters/woodcutter_brave.png"],
  ] as const;
  for (const [path, sourceUrl] of assets) {
    files.push({ path, kind: "binary", sourceUrl });
  }
  return files;
}

export async function getProjectTemplate(
  type: ContentTypeId,
  lang: Lang,
  title: string
): Promise<ProjectTemplateFile[]> {
  return type === "visual-novel"
    ? visualNovelTemplate(title)
    : simpleTemplate(type, title, lang);
}
