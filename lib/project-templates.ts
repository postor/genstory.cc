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

const FALLBACK_AGENTS = `# GenStory 项目约束

本项目的正文事实保存在当前目录的真实文件中。

- 一个事实，一个来源；不要把正文复制到其他缓存文件。
- 遵循当前项目的设定、角色、时间线和资产索引。
- 使用相对路径和逻辑资产 ID，不要在故事文件中硬编码外部路径。
- 编辑前先理解上下文，编辑后校验引用、状态和结构。
`;

async function loadAgentsTemplate(type: ContentTypeId, lang: Lang): Promise<string> {
  try {
    if (typeof window === "undefined") {
      const { readFile } = await import("node:fs/promises");
      const { join } = await import("node:path");
      return await readFile(join(process.cwd(), "public", "templates", lang, `${type}.md`), "utf8");
    }
    const response = await fetch(`/templates/${lang}/${type}.md`);
    if (!response.ok) throw new Error(`Template not found: ${lang}/${type}`);
    return await response.text();
  } catch {
    return FALLBACK_AGENTS;
  }
}

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

interface BookIllustration {
  id: string;
  name: string;
  file: string;
  prompt: string;
}

function bookTemplate(title: string, lang: Lang, agents: string): ProjectTemplateFile[] {
  const chapterTitle = lang === "zh" ? "小红帽 · 第一章" : "Little Red Riding Hood · Chapter One";
  const body =
    lang === "zh"
      ? "小红帽带着点心，穿过森林去看望生病的外婆。她记得妈妈说过不要离开小路，可森林里的阳光和花香让她慢下了脚步。"
      : "Little Red Riding Hood carries a basket through the forest to visit her sick grandmother. She remembers her mother's warning to stay on the path, but the light and flowers make her slow down.";
  const illustrations: BookIllustration[] = [
    {
      id: "illus_forest",
      name: lang === "zh" ? "森林·小红帽出发" : "Forest · Little Red Riding Hood sets out",
      file: "chapter-001/illustrations/scene-001.png",
      prompt:
        "Children's storybook illustration, soft watercolor and ink style, Little Red Riding Hood — a young girl with rosy cheeks wearing a red hooded cloak — walking along a sunlit forest path carrying a woven basket of food, tall pine and oak trees, dappled golden light, wildflowers, gentle fairy-tale mood, picture-book cover art, detailed, warm palette, no text",
    },
    {
      id: "illus_grandma",
      name: lang === "zh" ? "外婆家·狼的诡计" : "Grandmother's house · the wolf's trick",
      file: "chapter-001/illustrations/scene-002.png",
      prompt:
        "Children's storybook illustration, soft watercolor and ink style, the big bad wolf disguised in grandmother's nightcap and nightgown sitting in bed, cozy cottage interior, eerie fairy-tale mood, warm lamplight, picture-book art, no text",
    },
    {
      id: "illus_rescue",
      name: lang === "zh" ? "猎人解救" : "The woodcutter's rescue",
      file: "chapter-001/illustrations/scene-003.png",
      prompt:
        "Children's storybook illustration, soft watercolor and ink style, a brave woodcutter bursting through the cottage door, the big bad wolf cowering, Little Red Riding Hood watching, heroic fairy-tale mood, picture-book art, no text",
    },
  ];

  const files: ProjectTemplateFile[] = [
    text("AGENTS.md", agents),
    text("meta.md", meta("book", title)),
    text(
      "chapter-001/meta.md",
      [
        "---",
        `title: ${JSON.stringify(chapterTitle)}`,
        "status: draft",
        "---",
        "",
        `# ${chapterTitle}`,
        "",
        "本章正文写在 content.md，人物、地点和插图状态分别沉淀在子目录中。",
        "",
      ].join("\n")
    ),
    text(
      "chapter-001/content.md",
      `# ${chapterTitle}\n\n![${illustrations[0].name}](illustrations/scene-001.png)\n\n${body}\n`
    ),
    text(
      "chapter-001/characters/meta.md",
      [
        "---",
        "characters:",
        "  - id: red",
        `    name: ${JSON.stringify(lang === "zh" ? "小红帽" : "Little Red Riding Hood")}`,
        "    state: carrying basket, walking to grandmother",
        "  - id: wolf",
        `    name: ${JSON.stringify(lang === "zh" ? "大灰狼" : "Big Bad Wolf")}`,
        "    state: watching from the forest",
        "---",
        "",
        "# Characters",
        "",
        lang === "zh" ? "本章人物状态以此处为准。" : "Use this file as the source of truth for chapter character state.",
        "",
      ].join("\n")
    ),
    text(
      "chapter-001/locations/meta.md",
      [
        "---",
        "locations:",
        "  - id: forest_path",
        `    name: ${JSON.stringify(lang === "zh" ? "森林小径" : "Forest path")}`,
        "    time: morning",
        "---",
        "",
        "# Locations",
        "",
        lang === "zh" ? "本章地点状态以此处为准。" : "Use this file as the source of truth for chapter locations.",
        "",
      ].join("\n")
    ),
    text(
      "chapter-001/illustrations/scene-001.md",
      [
        `# ${illustrations[0].name}`,
        "",
        `prompt: ${illustrations[0].prompt}`,
        "continuity:",
        "  character: red hood, basket",
        "  location: forest_path",
        "",
      ].join("\n")
    ),
    text("assets/index.yml", buildBookAssetIndex(illustrations)),
    text("references/glossary.md", "# Glossary\n\n- 小红帽 / Little Red Riding Hood\n"),
    text("references/timeline.md", "# Timeline\n\n- chapter-001: 小红帽从家出发，进入森林。\n"),
  ];

  files.push({
    path: "chapter-001/illustrations/scene-001.png",
    kind: "binary",
    sourceUrl: "/project-templates/book/assets/illustrations/illus_forest.png",
  });
  return files;
}

function buildBookAssetIndex(illustrations: BookIllustration[]): string {
  const lines = ["# 插图方案（Illustration Plan）", "assets:"];
  for (const illus of illustrations) {
    lines.push(
      `  - id: ${illus.id}`,
      "    type: Illustration",
      `    name: ${JSON.stringify(illus.name)}`,
      `    file: ${JSON.stringify(illus.file)}`,
      `    prompt: ${JSON.stringify(illus.prompt)}`
    );
  }
  return `${lines.join("\n")}\n`;
}

function simpleTemplate(type: ContentTypeId, title: string, lang: Lang, agents: string): ProjectTemplateFile[] {
  const labels = {
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
    type === "comic"
      ? ["chapter-001/meta.md", `---\ntitle: ${labels.comic}\n---\n`, "chapter-001/pages/page-001/meta.md", `---\ntitle: ${labels.comic}\n---\n`, "chapter-001/pages/page-001/script.md", `# ${labels.comic}\n\n${body}\n`]
      : ["chapter-001/meta.md", `---\ntitle: ${labels["interactive-video"]}\n---\n`, "chapter-001/segments/segment-001/meta.md", `---\ntitle: ${labels["interactive-video"]}\n---\n`, "chapter-001/segments/segment-001/script.md", `# ${labels["interactive-video"]}\n\n${body}\n`];

  const files: ProjectTemplateFile[] = [text("AGENTS.md", agents), text("meta.md", meta(type, title))];
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

function visualNovelTemplate(title: string, agents: string): ProjectTemplateFile[] {
  const vn = seedRedRidingHood();
  vn.title = title;
  const generated = buildVNProjectFiles(vn, agents);
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

function comicTemplate(title: string, agents: string): ProjectTemplateFile[] {
  const comic = seedComicRedRidingHood();
  comic.title = title;
  const generated = buildComicProjectFiles(comic, {
    agents,
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

interface IVImageAsset {
  kind: "image";
  id: string;
  name: string;
  file: string;
  prompt: string;
}

interface IVVideoAsset {
  kind: "video";
  id: string;
  name: string;
  file: string;
  prompt: string;
  sourceImage: string;
  model: string;
}

interface IVVoiceAsset {
  kind: "voice";
  id: string;
  name: string;
  file: string;
  prompt: string;
  voice: string;
  language: string;
  model: string;
}

type IVAsset = IVImageAsset | IVVideoAsset | IVVoiceAsset;

function interactiveVideoTemplate(title: string, lang: Lang, agents: string): ProjectTemplateFile[] {
  const segmentTitle = lang === "zh" ? "小红帽 · 第一段" : "Little Red Riding Hood · Segment One";
  const body =
    lang === "zh"
      ? "小红帽带着点心，穿过森林去看望生病的外婆。"
      : "Little Red Riding Hood carries a basket through the forest to visit her sick grandmother.";
  const assets: IVAsset[] = [
    {
      kind: "image",
      id: "scene_forest",
      name: lang === "zh" ? "森林·小红帽出发" : "Forest · Little Red Riding Hood sets out",
      file: "scenes/scene_forest.png",
      prompt:
        "Children's storybook illustration, soft watercolor and ink style, Little Red Riding Hood walking along a sunlit forest path carrying a woven basket, tall trees, dappled golden light, wildflowers, gentle fairy-tale mood, picture-book art, detailed, warm palette, no text",
    },
    {
      kind: "image",
      id: "scene_grandma",
      name: lang === "zh" ? "外婆家·狼的诡计" : "Grandmother's house · the wolf's trick",
      file: "scenes/scene_grandma.png",
      prompt:
        "Children's storybook illustration, soft watercolor and ink style, cozy grandmother's cottage interior, a small bed with a nightgown draped over a chair, warm lamplight, wooden furniture, fairy-tale mood, picture-book art, detailed, warm palette, no text",
    },
    {
      kind: "image",
      id: "scene_rescue",
      name: lang === "zh" ? "猎人解救" : "The woodcutter's rescue",
      file: "scenes/scene_rescue.png",
      prompt:
        "Children's storybook illustration, soft watercolor and ink style, a brave woodcutter bursting through a cottage doorway with an axe, the big bad wolf cowering, Little Red Riding Hood watching, heroic fairy-tale mood, picture-book art, detailed, warm palette, no text",
    },
    {
      kind: "video",
      id: "vid_forest",
      name: lang === "zh" ? "森林·行走镜头" : "Forest · walking shot",
      file: "videos/vid_forest.mp4",
      prompt:
        "gentle camera push-in, leaves rustle in the breeze, dappled light shifts, Little Red Riding Hood walks slowly along the forest path",
      sourceImage: "scene_forest",
      model: "bytedance/seedance-2.0-mini/image-to-video",
    },
    {
      kind: "video",
      id: "vid_rescue",
      name: lang === "zh" ? "猎人冲入" : "Woodcutter bursts in",
      file: "videos/vid_rescue.mp4",
      prompt:
        "the woodcutter bursts through the door, the wolf stumbles backward, dust and light swirl, urgent cinematic motion",
      sourceImage: "scene_rescue",
      model: "bytedance/seedance-2.0-mini/image-to-video",
    },
    {
      kind: "voice",
      id: "voice_red",
      name: lang === "zh" ? "小红帽·配音" : "Little Red Riding Hood · voice",
      file: "audio/voice_red.mp3",
      prompt: lang === "zh" ? "终于可以出门啦，我要穿过森林去看外婆！" : "Finally I can go out, I'm going through the forest to see grandmother!",
      voice: "eve",
      language: lang,
      model: "xai/tts-v1",
    },
    {
      kind: "voice",
      id: "voice_wolf",
      name: lang === "zh" ? "大灰狼·配音" : "Big Bad Wolf · voice",
      file: "audio/voice_wolf.mp3",
      prompt:
        lang === "zh"
          ? "小姑娘，你要去哪儿呀？不如先去采些花，外婆会更开心哦。"
          : "Little girl, where are you going? Why not pick some flowers first, grandmother would be happier.",
      voice: "rex",
      language: lang,
      model: "xai/tts-v1",
    },
    {
      kind: "voice",
      id: "voice_grandma",
      name: lang === "zh" ? "外婆·配音" : "Grandmother · voice",
      file: "audio/voice_grandma.mp3",
      prompt: lang === "zh" ? "小红帽，你的耳朵怎么这么大呀？" : "Little Red Riding Hood, why are your ears so big?",
      voice: "sal",
      language: lang,
      model: "xai/tts-v1",
    },
    {
      kind: "voice",
      id: "voice_woodcutter",
      name: lang === "zh" ? "猎人·配音" : "Woodcutter · voice",
      file: "audio/voice_woodcutter.mp3",
      prompt: lang === "zh" ? "坏蛋，放开她！" : "You villain, let her go!",
      voice: "leo",
      language: lang,
      model: "xai/tts-v1",
    },
  ];

  const files: ProjectTemplateFile[] = [
    text("AGENTS.md", agents),
    text("meta.md", meta("interactive-video", title)),
    text(
      "chapter-001/meta.md",
      [
        "---",
        `title: ${JSON.stringify(segmentTitle)}`,
        "status: draft",
        "---",
        "",
        `# ${segmentTitle}`,
        "",
        "本章片段写在 segments/ 下，配套镜头与视频方案见 assets/index.yml。",
        "",
      ].join("\n")
    ),
    text(
      "chapter-001/segments/segment-001/meta.md",
      [
        "---",
        `title: ${JSON.stringify(segmentTitle)}`,
        "background: scene_forest",
        "---",
        "",
        `# ${segmentTitle}`,
        "",
        "本文件记录片段元数据；正文与分支位于同目录的 script.md。",
        "",
      ].join("\n")
    ),
    text(
      "chapter-001/segments/segment-001/script.md",
      `# ${segmentTitle}\n\n![${assets[0].name}](../../../assets/scenes/scene_forest.png)\n\n${body}\n\n> 视频镜头：[${assets[3].name}](../../../assets/videos/vid_forest.mp4)\n\n> 配音：[${assets[5].name}](../../../assets/audio/voice_red.mp3)\n\n（在这里分支：听狼的话去采花 / 直接去外婆家）\n`
    ),
    text(
      "chapter-001/segments/segment-001/timeline.yml",
      [
        "timeline:",
        "  - at: 0",
        "    video: vid_forest",
        "    voice: voice_red",
        "    caption: red enters the forest",
        "  - at: 8",
        "    choice: first_forest_choice",
        "",
      ].join("\n")
    ),
    text(
      "chapter-001/segments/segment-001/choices.yml",
      [
        "choices:",
        "  - id: first_forest_choice",
        `    prompt: ${JSON.stringify(lang === "zh" ? "小红帽接下来怎么办？" : "What should Little Red Riding Hood do next?")}`,
        "    options:",
        `      - label: ${JSON.stringify(lang === "zh" ? "听狼的话去采花" : "Listen to the wolf and pick flowers")}`,
        "        next: segment-002",
        `      - label: ${JSON.stringify(lang === "zh" ? "直接去外婆家" : "Go directly to grandmother's house")}`,
        "        next: segment-003",
        "",
      ].join("\n")
    ),
    text("assets/index.yml", buildIVAssetIndex(assets)),
  ];

  for (const asset of assets) {
    const dir = asset.kind === "video" ? "videos" : asset.kind === "voice" ? "audio" : "scenes";
    const filename = asset.file.split("/").pop()!;
    files.push({
      path: `assets/${dir}/${filename}`,
      kind: "binary",
      sourceUrl: `/project-templates/interactive-video/assets/${dir}/${filename}`,
    });
  }
  return files;
}

function buildIVAssetIndex(assets: IVAsset[]): string {
  const lines = ["# 镜头与视频方案（Shot & Video Plan）", "assets:"];
  for (const asset of assets) {
    const type = asset.kind === "video" ? "Video" : asset.kind === "voice" ? "Voice" : "Background";
    lines.push(
      `  - id: ${asset.id}`,
      `    type: ${type}`,
      `    name: ${JSON.stringify(asset.name)}`,
      `    file: ${JSON.stringify(asset.file)}`,
      `    prompt: ${JSON.stringify(asset.prompt)}`
    );
    if (asset.kind === "video") {
      lines.push(`    source_image: ${asset.sourceImage}`, `    model: ${JSON.stringify(asset.model)}`);
    }
    if (asset.kind === "voice") {
      lines.push(`    voice: ${JSON.stringify(asset.voice)}`, `    language: ${JSON.stringify(asset.language)}`, `    model: ${JSON.stringify(asset.model)}`);
    }
  }
  return `${lines.join("\n")}\n`;
}

export async function getProjectTemplate(
  type: ContentTypeId,
  lang: Lang,
  title: string
): Promise<ProjectTemplateFile[]> {
  const agents = await loadAgentsTemplate(type, lang);
  if (type === "comic") return comicTemplate(title, agents);
  if (type === "visual-novel") return visualNovelTemplate(title, agents);
  if (type === "book") return bookTemplate(title, lang, agents);
  if (type === "interactive-video") return interactiveVideoTemplate(title, lang, agents);
  return simpleTemplate(type, title, lang, agents);
}
