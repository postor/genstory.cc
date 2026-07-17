import type { Lang } from "./i18n.ts";
import type { ContentTypeId } from "./content-types";
import type { ProjectTemplateFile } from "./file-system/types";
// The .ts suffix keeps the native Node strip-types test runner resolvable.
// @ts-expect-error TS5097: required by the native Node test runner.
import { buildVNProjectFiles } from "./vn/project-files.ts";
// @ts-expect-error TS5097: required by the native Node test runner.
import { seedRedRidingHood } from "./vn/seed.ts";
// @ts-expect-error TS5097: required by the native Node test runner.
import { seedComicRedRidingHood } from "./comic/seed.ts";
// @ts-expect-error TS5097: required by the native Node test runner.
import { buildComicProjectFiles } from "./comic/project-files.ts";

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

function comicAgents(): string {
  return `# GenStory 漫画项目约束

本项目的正文事实保存在当前目录的真实文件中。

- 一个事实，一个来源；不要把正文复制到其他缓存文件。
- 遵循当前项目的设定、角色、时间线和资产索引。
- 故事与画面分离：script.md 记录分镜与对白，meta.md 记录页面状态，不写渲染指令。
- 分镜只描述画面状态（背景、角色、表情、位置、动作），不要写 show / hide / play 等渲染调用。
- 仅使用逻辑资产 ID（见 assets/index.yml），不要在故事文件中硬编码外部路径。
- 补充资产时优先使用低成本、低分辨率的资源，仅在成品页需要高清时再升级。
- 编辑前先理解上下文，编辑后校验引用、状态和结构。
`;
}

function comicTemplate(title: string): ProjectTemplateFile[] {
  const comic = seedComicRedRidingHood();
  comic.title = title;
  const generated = buildComicProjectFiles(comic, {
    agents: comicAgents(),
  });
  const files: ProjectTemplateFile[] = [];
  for (const file of generated) {
    if (file.kind === "asset") {
      files.push({
        path: file.path,
        kind: "binary",
        sourceUrl: `/project-templates/comic/assets/pages/${file.pageId}.png`,
      });
    } else {
      files.push({ path: file.path, kind: "text", content: file.content });
    }
  }
  return files;
}

export async function getProjectTemplate(
  type: ContentTypeId,
  lang: Lang,
  title: string
): Promise<ProjectTemplateFile[]> {
  if (type === "comic") return comicTemplate(title);
  if (type === "visual-novel") return visualNovelTemplate(title);
  return simpleTemplate(type, title, lang);
}
