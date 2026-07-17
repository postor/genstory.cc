import type { ComicAsset, ComicPage, ComicPanel, ComicProject } from "./types";

export type ComicProjectFileKind =
  | "constraint"
  | "metadata"
  | "asset-index"
  | "page-meta"
  | "script"
  | "asset";

export interface ComicProjectFile {
  path: string;
  content: string;
  kind: ComicProjectFileKind;
  pageId?: string;
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

function buildProjectMeta(project: ComicProject): string {
  return [
    "---",
    `title: ${yamlString(project.title)}`,
    "type: comic",
    `style: ${yamlString(project.style)}`,
    "chapters: 1",
    `pages: ${project.pages.length}`,
    "---",
    "",
    `# ${project.title}`,
    "",
    "本项目由 GenStory 的漫画模板创建。",
    "章节、页面、分镜、对白与资产由结构化编辑器维护。",
    "",
  ].join("\n");
}

function buildChapterMeta(pages: ComicPage[]): string {
  return [
    "---",
    `title: ${yamlString("第一章 · 森林与狼")}`,
    `pages: ${pages.map((page) => page.id).join(", ")}`,
    "---",
    "",
    "# 第一章 · 森林与狼",
    "",
    "本章页面由左侧页面树维护。",
    "",
  ].join("\n");
}

function buildPageMeta(page: ComicPage): string {
  const characters = new Set<string>();
  for (const panel of page.panels) {
    for (const character of panel.characters) characters.add(character);
  }
  return [
    "---",
    `id: ${page.id}`,
    `title: ${yamlString(page.title)}`,
    `asset: ${page.assetId}`,
    `panels: ${page.panels.map((panel) => panel.id).join(", ")}`,
    `characters: ${[...characters].join(", ") || "none"}`,
    "---",
    "",
    `# ${page.title}`,
    "",
    "本文件记录页面元数据；分镜与对白位于同目录的 script.md。",
    "",
  ].join("\n");
}

function buildPanelSection(panel: ComicPanel): string {
  const lines: string[] = [];
  lines.push(`## ${panel.id} · ${panel.description.split("，")[0].slice(0, 12)}`);
  lines.push("");
  if (panel.asset) lines.push(`- 参考背景：${panel.asset}`);
  if (panel.characters.length) lines.push(`- 出场角色：${panel.characters.join("、")}`);
  if (panel.size) lines.push(`- 版面尺寸：${panel.size}`);
  if (panel.description) lines.push(`- 画面描述：${panel.description}`);
  if (panel.caption) lines.push(`- 旁白：${panel.caption}`);
  if (panel.balloons?.length) {
    lines.push("- 对白：");
    for (const balloon of panel.balloons) {
      lines.push(`  - ${balloon.speaker}：「${balloon.line}」`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

function buildPageScript(page: ComicPage, style: string): string {
  const lines: string[] = [];
  lines.push(`# ${page.title}`);
  lines.push("");
  lines.push(`> 整页概述：${page.summary}`);
  lines.push("");
  lines.push(`> 画风：${style}`);
  lines.push("");
  for (const panel of page.panels) {
    lines.push(buildPanelSection(panel));
  }
  return lines.join("\n");
}

function buildAssetIndex(project: ComicProject): string {
  const lines = ["assets:"];
  const all: ComicAsset[] = [
    ...project.backgrounds,
    ...project.characters,
    ...project.pages.map((page) => ({
      id: page.assetId,
      type: "CG" as const,
      name: page.title,
      file: `${page.id}.png`,
    })),
  ];
  for (const asset of all) {
    lines.push(
      `  - id: ${asset.id}`,
      `    type: ${asset.type}`,
      `    name: ${yamlString(asset.name)}`,
      `    file: ${yamlString(asset.file)}`,
    );
  }
  return `${lines.join("\n")}\n`;
}

export interface ComicBuildOptions {
  agents: string;
}

export function buildComicProjectFiles(
  project: ComicProject,
  options: ComicBuildOptions,
): ComicProjectFile[] {
  const files: ComicProjectFile[] = [
    { path: "AGENTS.md", content: options.agents, kind: "constraint" },
    { path: "meta.md", content: buildProjectMeta(project), kind: "metadata" },
    {
      path: "assets/index.yml",
      content: buildAssetIndex(project),
      kind: "asset-index",
    },
  ];

  files.push({
    path: "chapter-001/meta.md",
    content: buildChapterMeta(project.pages),
    kind: "metadata",
  });

  for (const page of project.pages) {
    const base = `chapter-001/pages/${page.id}`;
    files.push({
      path: `${base}/meta.md`,
      content: buildPageMeta(page),
      kind: "page-meta",
      pageId: page.id,
    });
    files.push({
      path: `${base}/script.md`,
      content: buildPageScript(page, project.style),
      kind: "script",
      pageId: page.id,
    });
    files.push({
      path: `assets/pages/${page.id}.png`,
      content: "",
      kind: "asset",
      pageId: page.id,
    });
  }

  return files;
}

export { buildPanelSection };
