import type { VNProject, VNScene } from "./types";

export type VNProjectFileKind =
  | "constraint"
  | "metadata"
  | "asset-index"
  | "asset"
  | "scene-meta"
  | "stage"
  | "script"
  | "style";

export interface VNProjectFile {
  path: string;
  content: string;
  kind: VNProjectFileKind;
  sceneId?: string;
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

function buildProjectMeta(vn: VNProject): string {
  const sceneCount = vn.chapters.reduce((count, chapter) => count + chapter.scenes.length, 0);
  return [
    "---",
    `title: ${yamlString(vn.title)}`,
    "type: visual-novel",
    "engine: OpenWebGal",
    `chapters: ${vn.chapters.length}`,
    `scenes: ${sceneCount}`,
    "---",
    "",
    `# ${vn.title}`,
    "",
    "本项目由 GenStory.cc 的 OpenWebGal 视觉小说模板创建。",
    "章节、场景、舞台状态和对白由结构化编辑器维护。",
    "",
  ].join("\n");
}

function buildAssetIndex(vn: VNProject): string {
  const lines = ["assets:"];
  for (const asset of vn.assets) {
    lines.push(
      `  - id: ${asset.id}`,
      `    type: ${asset.type}`,
      `    name: ${yamlString(asset.name)}`,
      `    file: ${yamlString(asset.file || `${asset.id}.png`)}`,
    );
  }
  return `${lines.join("\n")}\n`;
}

function buildChapterMeta(title: string, scenes: VNScene[]): string {
  return [
    "---",
    `title: ${yamlString(title)}`,
    `scenes: ${scenes.map((scene) => scene.id).join(", ")}`,
    "---",
    "",
    `# ${title}`,
    "",
    "本章场景由左侧场景树维护。",
    "",
  ].join("\n");
}

function buildSceneMeta(scene: VNScene): string {
  return [
    "---",
    `id: ${scene.id}`,
    `title: ${yamlString(scene.title)}`,
    `background: ${scene.background ?? "null"}`,
    `characters: ${scene.characters.map((character) => character.id).join(", ") || "none"}`,
    "---",
    "",
    `# ${scene.title}`,
    "",
    "本文件记录场景元数据；对白位于同目录的 script.md。",
    "",
  ].join("\n");
}

function buildStage(scene: VNScene): string {
  const lines = [
    "background:",
    `  id: ${scene.background ?? "null"}`,
    "characters:",
  ];
  if (scene.characters.length === 0) {
    lines.push("  []");
  } else {
    for (const character of scene.characters) {
      lines.push(
        `  - id: ${character.id}`,
        `    position: ${character.position ?? "center"}`,
        `    expression: ${character.expression ?? "default"}`,
      );
    }
  }
  return `${lines.join("\n")}\n`;
}

export function buildVNProjectFiles(
  vn: VNProject,
  agents: string,
): VNProjectFile[] {
  const files: VNProjectFile[] = [
    { path: "AGENTS.md", content: agents, kind: "constraint" },
    { path: "meta.md", content: buildProjectMeta(vn), kind: "metadata" },
    {
      path: "assets/index.yml",
      content: buildAssetIndex(vn),
      kind: "asset-index",
    },
  ];
  if (vn.userStyleSheet !== undefined) {
    files.push({
      path: "userStyleSheet.css",
      content: vn.userStyleSheet,
      kind: "style",
    });
  }

  for (const chapter of vn.chapters) {
    files.push({
      path: `${chapter.id}/meta.md`,
      content: buildChapterMeta(chapter.title, chapter.scenes),
      kind: "metadata",
    });
    for (const scene of chapter.scenes) {
      const base = `${chapter.id}/scenes/${scene.id}`;
      files.push(
        {
          path: `${base}/meta.md`,
          content: buildSceneMeta(scene),
          kind: "scene-meta",
          sceneId: scene.id,
        },
        {
          path: `${base}/stage.yml`,
          content: buildStage(scene),
          kind: "stage",
          sceneId: scene.id,
        },
        {
          path: `${base}/script.md`,
          content: scene.script,
          kind: "script",
          sceneId: scene.id,
        },
      );
    }
  }

  for (const asset of vn.assets) {
    const directory = asset.type === "Character" ? "characters" : asset.type.toLowerCase();
    const filename = asset.file || `${asset.id}.png`;
    files.push({
      path: `assets/${directory}/${filename}`,
      content: asset.dataUrl ? "[uploaded asset]" : "[template asset]",
      kind: "asset",
    });
  }

  return files;
}
