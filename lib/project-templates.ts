import type { Lang } from "./i18n.ts";
import type { ContentTypeId } from "./content-types";
import type { ProjectTemplateFile } from "./file-system/types";
// The .ts suffix keeps the native Node strip-types test runner resolvable.
import { buildVNProjectFiles } from "./vn/project-files.ts";
import { seedRedRidingHood } from "./vn/seed.ts";
import { seedComicRedRidingHood } from "./comic/seed.ts";
import { buildComicProjectFiles } from "./comic/project-files.ts";

const FALLBACK_AGENTS = `# GenStory.cc 项目约束

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
    "这是一个由 GenStory.cc 模板创建的作品。",
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
    ["assets/ui/menu-background.png", "/project-templates/visual-novel/assets/backgrounds/bg_forest.png"],
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
  duration: number;
  resolution: string;
  aspectRatio: string;
}

function pictureBookTemplate(title: string, lang: Lang, agents: string): ProjectTemplateFile[] {
  const labels = lang === "zh"
    ? ["森林小径", "花丛旁", "外婆的小屋"]
    : ["The forest path", "Among the flowers", "Grandmother's cottage"];
  const stories = lang === "zh"
    ? [
        "小红帽提着篮子，沿着妈妈叮嘱的小路出发。阳光穿过树叶，森林像一本刚刚打开的故事书。",
        "花香从小路旁飘来。小红帽停下脚步，却没有忘记要早点赶到外婆家。",
        "夜幕降临前，小红帽来到外婆的小屋。门里亮着暖黄色的灯，外婆正等着她。",
      ]
    : [
        "Little Red Riding Hood sets out with her basket along the path her mother described. Sunlight falls through the leaves like a storybook opening.",
        "A sweet scent drifts from the flowers. Little Red pauses, then remembers that grandmother is waiting.",
        "Before dusk, Little Red reaches the cottage. A warm light shines inside, and grandmother is waiting for her.",
      ];
  const imageAssets = [
    ["pb_forest", "assets/pages/page-001.png", "/project-templates/comic/assets/pages/page-001.png"],
    ["pb_flowers", "assets/pages/page-002.png", "/project-templates/comic/assets/pages/page-002.png"],
    ["pb_cottage", "assets/pages/page-003.png", "/project-templates/comic/assets/pages/page-003.png"],
  ] as const;
  const voiceAssets = [
    ["pb_voice_001", "assets/voice/page-001.mp3", "/project-templates/interactive-video/assets/audio/voice_red.mp3"],
    ["pb_voice_002", "assets/voice/page-002.mp3", "/project-templates/interactive-video/assets/audio/voice_wolf.mp3"],
    ["pb_voice_003", "assets/voice/page-003.mp3", "/project-templates/interactive-video/assets/audio/voice_grandma.mp3"],
  ] as const;
  const files: ProjectTemplateFile[] = [
    text("AGENTS.md", agents),
    text("meta.md", meta("picture-book", title)),
    text("chapter-001/meta.md", `---\ntitle: ${JSON.stringify(lang === "zh" ? "小红帽 · 森林里的故事" : "Little Red Riding Hood · A Forest Story")}\n---\n\n# ${lang === "zh" ? "绘本章节" : "Picture-book chapter"}\n`),
    text("assets/index.yml", [
      "# 绘本资产索引（Picture-book Asset Index）", "assets:",
      ...imageAssets.flatMap(([id, file]) => [`  - id: ${id}`, "    type: Image", `    file: ${JSON.stringify(file)}`, "    layout: landscape"]),
      ...voiceAssets.flatMap(([id, file]) => [`  - id: ${id}`, "    type: Voice", `    file: ${JSON.stringify(file)}`, `    language: ${lang}`]),
      "",
    ].join("\n")),
    text("references/timeline.md", `# Timeline\n\n- chapter-001: ${lang === "zh" ? "小红帽从家出发，穿过森林，抵达外婆的小屋。" : "Little Red sets out, crosses the forest, and reaches grandmother's cottage."}\n`),
  ];
  imageAssets.forEach((asset, index) => {
    const id = asset[0];
    const sourceUrl = asset[2];
    const page = String(index + 1).padStart(3, "0");
    files.push(text(`chapter-001/pages/page-${page}/meta.md`, `---\ntitle: ${JSON.stringify(labels[index])}\norder: ${index + 1}\n---\n`));
    files.push(text(`chapter-001/pages/page-${page}/story.md`, `---\ntitle: ${JSON.stringify(labels[index])}\nimage_asset: ${id}\nvoice_asset: ${voiceAssets[index][0]}\nlayout: landscape\n---\n\n# ${labels[index]}\n\n${stories[index]}\n`));
    files.push({ path: `assets/pages/page-${page}.png`, kind: "binary", sourceUrl });
    files.push({ path: `assets/voice/page-${page}.mp3`, kind: "binary", sourceUrl: voiceAssets[index][2] });
  });
  return files;
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
  const flowerTitle = lang === "zh" ? "采花的小路" : "The flower path";
  const grandmaTitle = lang === "zh" ? "直奔外婆家" : "Straight to grandmother's house";
  const body =
    lang === "zh"
      ? "小红帽带着点心，穿过森林去看望生病的外婆。"
      : "Little Red Riding Hood carries a basket through the forest to visit her sick grandmother.";
  const flowerBody =
    lang === "zh"
      ? "小红帽被花香吸引，离开小路。树影变深，大灰狼趁机抢先赶往外婆家。"
      : "Little Red Riding Hood follows the scent of flowers off the path. The trees grow darker while the wolf rushes ahead.";
  const grandmaBody =
    lang === "zh"
      ? "小红帽没有停留，直接赶到外婆家。猎人听见屋里的异响，冲进门救下了她。"
      : "Little Red Riding Hood does not stop and reaches grandmother's house. The woodcutter hears trouble inside and bursts in to help.";
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
      model: "google/veo-3.1-lite",
      duration: 4,
      resolution: "720p",
      aspectRatio: "16:9",
    },
    {
      kind: "video",
      id: "vid_rescue",
      name: lang === "zh" ? "猎人冲入" : "Woodcutter bursts in",
      file: "videos/vid_rescue.mp4",
      prompt:
        "the woodcutter bursts through the door, the wolf stumbles backward, dust and light swirl, urgent cinematic motion",
      sourceImage: "scene_rescue",
      model: "google/veo-3.1-lite",
      duration: 4,
      resolution: "720p",
      aspectRatio: "16:9",
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
        "  - at: 4",
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
    text(
      "chapter-001/segments/segment-002/meta.md",
      [
        "---",
        `title: ${JSON.stringify(flowerTitle)}`,
        "background: scene_forest",
        "---",
        "",
        `# ${flowerTitle}`,
        "",
        "本文件记录分支片段元数据；正文与时间线位于同目录文件。",
        "",
      ].join("\n")
    ),
    text(
      "chapter-001/segments/segment-002/script.md",
      `# ${flowerTitle}\n\n![${assets[0].name}](../../../assets/scenes/scene_forest.png)\n\n${flowerBody}\n\n> 视频镜头：[${assets[3].name}](../../../assets/videos/vid_forest.mp4)\n\n> 配音：[${assets[6].name}](../../../assets/audio/voice_wolf.mp3)\n`
    ),
    text(
      "chapter-001/segments/segment-002/timeline.yml",
      [
        "timeline:",
        "  - at: 0",
        "    video: vid_forest",
        "    voice: voice_wolf",
        "    caption: red leaves the path",
        "",
      ].join("\n")
    ),
    text(
      "chapter-001/segments/segment-002/choices.yml",
      ["choices:", ""].join("\n")
    ),
    text(
      "chapter-001/segments/segment-003/meta.md",
      [
        "---",
        `title: ${JSON.stringify(grandmaTitle)}`,
        "background: scene_rescue",
        "---",
        "",
        `# ${grandmaTitle}`,
        "",
        "本文件记录分支片段元数据；正文与时间线位于同目录文件。",
        "",
      ].join("\n")
    ),
    text(
      "chapter-001/segments/segment-003/script.md",
      `# ${grandmaTitle}\n\n![${assets[2].name}](../../../assets/scenes/scene_rescue.png)\n\n${grandmaBody}\n\n> 视频镜头：[${assets[4].name}](../../../assets/videos/vid_rescue.mp4)\n\n> 配音：[${assets[8].name}](../../../assets/audio/voice_woodcutter.mp3)\n`
    ),
    text(
      "chapter-001/segments/segment-003/timeline.yml",
      [
        "timeline:",
        "  - at: 0",
        "    video: vid_rescue",
        "    voice: voice_woodcutter",
        "    caption: the woodcutter arrives",
        "",
      ].join("\n")
    ),
    text(
      "chapter-001/segments/segment-003/choices.yml",
      ["choices:", ""].join("\n")
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

function phaserGameTemplate(title: string, lang: Lang, agents: string): ProjectTemplateFile[] {
  const isZh = lang === "zh";
  const menuTitle = isZh ? "开始游戏" : "Start Game";
  const testTitle = isZh ? "测试游戏" : "Test Game";
  const instructions = isZh
    ? "方向键移动，空格跳跃，Esc 返回菜单"
    : "Arrow keys move, Space jumps, Esc returns to menu";
  const gameTitle = title.trim() || (isZh ? "游戏模板" : "Game Template");
  const htmlLang = isZh ? "zh-CN" : "en";
  const gameTitleLiteral = JSON.stringify(gameTitle);
  const menuTitleLiteral = JSON.stringify(menuTitle);
  const testTitleLiteral = JSON.stringify(testTitle);
  const instructionsLiteral = JSON.stringify(instructions);

  return [
    text("AGENTS.md", agents),
    text("meta.md", meta("phaser-game", title)),
    text(
      "README.md",
      [
        `# ${title}`,
        "",
        isZh
          ? "这是一个带有动物图标示例的 Phaser 3 游戏模板，也可以在没有其他媒体资源时运行。"
          : "This Phaser 3 game template includes an animal icon example and can run without other media.",
        "",
        isZh
          ? "默认示例主题：小红帽；请把它替换为你自己的游戏设定。"
          : "Default example theme: Little Red Riding Hood; replace it with your own game canon.",
        "",
        isZh
          ? "入口是 index.html；菜单场景会进入可操作的测试游戏场景。"
          : "The entry point is index.html; the menu scene opens the playable test-game scene.",
        "",
        `- ${isZh ? "菜单场景" : "Menu scene"}: src/scenes/menu-scene.js`,
        `- ${isZh ? "测试游戏场景" : "Test game scene"}: src/scenes/test-game-scene.js`,
        `- ${isZh ? "资产计划和 AI prompt" : "Asset plan and AI prompts"}: assets/index.yml`,
        "",
        isZh
          ? "后续生成图片或音频时，先在 assets/index.yml 登记逻辑 ID，再把资源接入对应场景。"
          : "When images or audio are generated later, register a logical ID in assets/index.yml before wiring it into a scene.",
        "",
      ].join("\n")
    ),
    text(
      "index.html",
      [
        "<!doctype html>",
        `<html lang="${htmlLang}">`,
        "<head>",
        '  <meta charset="utf-8">',
        '  <meta name="viewport" content="width=device-width, initial-scale=1">',
        `  <title>${gameTitle}</title>`,
        '  <link rel="stylesheet" href="src/styles.css">',
        "</head>",
        "<body>",
        '  <main id="game" aria-label="Game"></main>',
        '  <script src="https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js"></script>',
        '  <script src="src/config.js"></script>',
        '  <script src="src/genstory-assets.js"></script>',
        '  <script src="src/scenes/menu-scene.js"></script>',
        '  <script src="src/scenes/test-game-scene.js"></script>',
        '  <script src="src/main.js"></script>',
        "</body>",
        "</html>",
        "",
      ].join("\n")
    ),
    text(
      "src/styles.css",
      [
        ":root {",
        "  color-scheme: dark;",
        '  font-family: Inter, ui-sans-serif, system-ui, sans-serif;',
        "  background: #08111f;",
        "}",
        "",
        "html, body {",
        "  margin: 0;",
        "  min-height: 100%;",
        "  background: #08111f;",
        "}",
        "",
        "body {",
        "  display: grid;",
        "  min-height: 100vh;",
        "  place-items: center;",
        "}",
        "",
        "#game {",
        "  width: min(960px, 100vw);",
        "  aspect-ratio: 16 / 9;",
        "  overflow: hidden;",
        "  border: 1px solid #23314d;",
        "  box-shadow: 0 24px 80px rgb(0 0 0 / 35%);",
        "}",
        "",
      ].join("\n")
    ),
    text(
      "src/config.js",
      [
        "window.GENSTORY_PHASER_CONFIG = {",
        "  type: Phaser.AUTO,",
        "  parent: \"game\",",
        "  width: 960,",
        "  height: 540,",
        "  backgroundColor: \"#08111f\",",
        "  physics: {",
        '    default: "arcade",',
        "    arcade: { gravity: { y: 900 }, debug: false },",
        "  },",
        "};",
        "",
      ].join("\n")
    ),
    text(
      "src/genstory-assets.js",
      [
        "(function (global) {",
        "  if (global.__GENSTORY_PHASER_ASSET_BRIDGE__) return;",
        "",
        "  const assetUrls = global.GENSTORY_ASSET_URLS || {};",
        '  const preview = new URLSearchParams(global.location.search).get("preview") === "1";',
        "",
        "  function normalize(path) {",
        '    return String(path).split(/[?#]/, 1)[0].replace(/^.?\\//, "").replace(/^\\/+/, "");',
        "  }",
        "",
        "  function resolve(path) {",
        "    if (!preview || typeof path !== \"string\") return path;",
        "    return assetUrls[normalize(path)] || path;",
        "  }",
        "",
        "  global.GENSTORY_PREVIEW = preview;",
        "  global.GenStoryAssets = Object.freeze({ isPreview: preview, resolve });",
        "})(window);",
        "",
      ].join("\n")
    ),
    text(
      "src/scenes/menu-scene.js",
      [
        "/**",
        " * AI image prompt (future asset: menu background):",
        " * A deep-blue sci-fi arcade game menu, soft geometric glow, no text, 16:9.",
        " * Keep this prompt with the logical asset ID menu_background in assets/index.yml.",
        " */",
        "class MenuScene extends Phaser.Scene {",
        '  constructor() { super("MenuScene"); }',
        "",
        "  preload() {",
        "    // Future image hook: this.load.image(\"menu_background\", GenStoryAssets.resolve(\"assets/images/menu-background.png\"));",
        "    // Future audio hook: this.load.audio(\"menu_music\", \"assets/audio/menu-music.ogg\");",
        "  }",
        "",
        "  create() {",
        '    this.cameras.main.setBackgroundColor("#101b35");',
        `    this.add.text(480, 142, ${gameTitleLiteral}, {`,
        "      fontFamily: \"Inter, system-ui, sans-serif\",",
        "      fontSize: \"42px\",",
        "      color: \"#f8fafc\",",
        "    }).setOrigin(0.5);",
        "",
        `    this.add.text(480, 212, ${JSON.stringify(isZh ? "无媒体占位也可运行" : "Runs before media generation")}, {`,
        "      fontSize: \"18px\",",
        "      color: \"#a5b4fc\",",
        "    }).setOrigin(0.5);",
        "",
        '    const button = this.add.rectangle(480, 320, 248, 64, 0x4f46e5, 1).setInteractive({ useHandCursor: true });',
        `    const label = this.add.text(480, 320, ${menuTitleLiteral}, { fontSize: "24px", color: "#ffffff" }).setOrigin(0.5);`,
        '    button.on("pointerover", () => button.setFillStyle(0x6366f1));',
        '    button.on("pointerout", () => button.setFillStyle(0x4f46e5));',
        '    button.on("pointerup", () => this.scene.start("TestGameScene"));',
        '    this.input.keyboard.once("keydown-ENTER", () => this.scene.start("TestGameScene"));',
        `    this.add.text(480, 420, ${instructionsLiteral}, { fontSize: "16px", color: "#cbd5e1" }).setOrigin(0.5);`,
        "    void label;",
        "",
        "    // Audio prompt: a calm looping arcade menu theme, 90 BPM, no vocals.",
        "  }",
        "}",
        "",
      ].join("\n")
    ),
    text(
      "src/scenes/test-game-scene.js",
      [
        "/**",
        " * AI image prompt (future asset: player sprite):",
        " * A friendly small robot hero with a red scarf, readable silhouette, side view, transparent background.",
        " */",
        "class TestGameScene extends Phaser.Scene {",
        '  constructor() { super("TestGameScene"); }',
        "",
        "  preload() {",
        "    this.load.image(\"animal_cat\", GenStoryAssets.resolve(\"assets/images/animal-cat.png\"));",
        "    // Future audio hook: this.load.audio(\"jump_sfx\", \"assets/audio/jump.ogg\");",
        "  }",
        "",
        "  create() {",
        '    this.cameras.main.setBackgroundColor("#0f172a");',
        `    this.add.text(32, 28, ${testTitleLiteral}, { fontSize: "28px", color: "#f8fafc" });`,
        `    this.add.text(32, 68, ${instructionsLiteral}, { fontSize: "16px", color: "#cbd5e1" });`,
        "",
        "    this.player = this.add.image(150, 360, \"animal_cat\").setDisplaySize(48, 48);",
        "    this.physics.add.existing(this.player);",
        "    this.player.body.setCollideWorldBounds(true);",
        "",
        "    this.platforms = this.physics.add.staticGroup();",
        "    for (const [x, y, width] of [[480, 500, 860], [230, 390, 180], [710, 330, 180]]) {",
        "      this.platforms.add(this.add.rectangle(x, y, width, 24, 0x334155));",
        "    }",
        "    this.physics.add.collider(this.player, this.platforms);",
        "    this.cursors = this.input.keyboard.createCursorKeys();",
        "    this.input.keyboard.on(" + '"keydown-ESC"' + ", () => this.scene.start(" + '"MenuScene"' + "));",
        "",
        "    // Audio prompt: a short warm synth blip for jumping, clean and loop-free.",
        "  }",
        "",
        "  update() {",
        "    const body = this.player.body;",
        "    body.setVelocityX(0);",
        "    if (this.cursors.left.isDown) body.setVelocityX(-260);",
        "    if (this.cursors.right.isDown) body.setVelocityX(260);",
        "    if (this.cursors.space.isDown && body.blocked.down) body.setVelocityY(-560);",
        "  }",
        "}",
        "",
      ].join("\n")
    ),
    text(
      "src/main.js",
      [
        "const gameConfig = {",
        "  ...window.GENSTORY_PHASER_CONFIG,",
        "  scene: [MenuScene, TestGameScene],",
        "};",
        "",
        "new Phaser.Game(gameConfig);",
        "",
      ].join("\n")
    ),
    text(
      "assets/index.yml",
      [
        "# Logical asset plan. The animal_cat example is included; other media remains planned.",
        "assets:",
        "  - id: menu_background",
        "    type: Background",
        "    status: planned",
        "    file: assets/images/menu-background.png",
        `    prompt: ${JSON.stringify(isZh ? "深蓝色街机游戏菜单背景，柔和几何光晕，无文字，16:9。" : "Deep-blue arcade game menu background, soft geometric glow, no text, 16:9.")}`,
        "  - id: player_sprite",
        "    type: Character",
        "    status: planned",
        "    file: assets/images/player.png",
        `    prompt: ${JSON.stringify(isZh ? "友好的小型机器人英雄，红色围巾，侧面视图，轮廓清晰，透明背景。" : "Friendly small robot hero with a red scarf, side view, readable silhouette, transparent background.")}`,
        "  - id: animal_cat",
        "    type: Icon",
        "    status: generated",
        "    file: assets/images/animal-cat.png",
        `    prompt: ${JSON.stringify(isZh ? "橙色猫，可爱扁平图标，透明背景，描边清晰，四周保留安全留白。" : "Orange cat, cute flat icon, transparent background, clear outline, with safe padding around the subject.")}`,
        "  - id: menu_music",
        "    type: BGM",
        "    status: planned",
        "    file: assets/audio/menu-music.ogg",
        `    prompt: ${JSON.stringify(isZh ? "平静的街机菜单循环音乐，90 BPM，无人声。" : "Calm looping arcade menu theme, 90 BPM, no vocals.")}`,
        "  - id: jump_sfx",
        "    type: SFX",
        "    status: planned",
        "    file: assets/audio/jump.ogg",
        `    prompt: ${JSON.stringify(isZh ? "短促温暖的合成器跳跃音效，干净，不循环。" : "Short warm synth jump sound, clean and non-looping.")}`,
        "",
      ].join("\n")
    ),
    {
      path: "assets/images/animal-cat.png",
      kind: "binary",
      sourceUrl: "/project-templates/phaser-game/assets/images/animal-cat.png",
    },
  ];
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
      lines.push(
        `    source_image: ${asset.sourceImage}`,
        `    model: ${JSON.stringify(asset.model)}`,
        `    duration: ${asset.duration}`,
        `    resolution: ${JSON.stringify(asset.resolution)}`,
        `    aspect_ratio: ${JSON.stringify(asset.aspectRatio)}`,
        "    generation_status: planned"
      );
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
  if (type === "picture-book") return pictureBookTemplate(title, lang, agents);
  if (type === "interactive-video") return interactiveVideoTemplate(title, lang, agents);
  if (type === "phaser-game") return phaserGameTemplate(title, lang, agents);
  return simpleTemplate(type, title, lang, agents);
}
