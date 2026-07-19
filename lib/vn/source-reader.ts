import {
  fileExists,
  listProjectFiles,
  readFile,
  readTextFile,
} from "@/lib/file-system/browser";
import type { VNAsset, VNProject, VNScene, VNStageCharacter } from "./types";

function isAssetType(value: string): value is VNAsset["type"] {
  return value === "Background" || value === "Character" || value === "CG" || value === "Voice";
}

function isCharacterPosition(
  value: string
): value is NonNullable<VNStageCharacter["position"]> {
  return value === "left" || value === "center" || value === "right";
}

function scalar(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "null" || trimmed === "none") return undefined;
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function frontmatter(text: string): Record<string, string> {
  const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  return Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .map((line) => {
        const index = line.indexOf(":");
        return index < 0
          ? null
          : [line.slice(0, index).trim(), scalar(line.slice(index + 1)) ?? ""];
      })
      .filter((entry): entry is [string, string] => Boolean(entry))
  );
}

function parseAssets(text: string): VNAsset[] {
  const assets: VNAsset[] = [];
  let current: Partial<VNAsset> | null = null;

  function commit() {
    if (current?.id && current.type && current.name && current.file) {
      assets.push(current as VNAsset);
    }
  }

  for (const line of text.split(/\r?\n/)) {
    const id = line.match(/^\s*-\s+id:\s*(.+)$/);
    if (id) {
      commit();
      current = { id: scalar(id[1]) };
      continue;
    }
    if (!current) continue;
    const field = line.match(/^\s+(type|name|file):\s*(.+)$/);
    if (field) {
      const value = scalar(field[2]);
      if (!value) continue;
      if (field[1] === "type") {
        if (isAssetType(value)) current.type = value;
      } else if (field[1] === "name") {
        current.name = value;
      } else {
        current.file = value;
      }
    }
  }
  commit();
  return assets;
}

function parseStage(text: string): Pick<VNScene, "background" | "characters"> {
  let background: string | undefined;
  const characters: VNStageCharacter[] = [];
  let current: Partial<VNStageCharacter> | null = null;

  function commit() {
    if (current?.id) characters.push(current as VNStageCharacter);
  }

  for (const line of text.split(/\r?\n/)) {
    const backgroundMatch = line.match(/^\s+id:\s*(.+)$/);
    if (backgroundMatch && !line.includes("- id:")) {
      background = scalar(backgroundMatch[1]);
      continue;
    }
    const characterMatch = line.match(/^\s*-\s+id:\s*(.+)$/);
    if (characterMatch) {
      commit();
      current = { id: scalar(characterMatch[1]) };
      continue;
    }
    if (!current) continue;
    const field = line.match(/^\s+(position|expression):\s*(.+)$/);
    if (field) {
      const value = scalar(field[2]);
      if (!value) continue;
      if (field[1] === "position") {
        if (isCharacterPosition(value)) current.position = value;
      } else {
        current.expression = value;
      }
    }
  }
  commit();
  return { background, characters };
}

function basename(path: string): string {
  return path.split("/").at(-1) ?? path;
}

async function fileToDataUrl(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:${file.type || "application/octet-stream"};base64,${btoa(binary)}`;
}

async function projectFileDataUrl(
  root: FileSystemDirectoryHandle,
  path: string
): Promise<string | undefined> {
  try {
    return await fileToDataUrl(await readFile(root, path));
  } catch {
    return undefined;
  }
}

async function assetDataUrl(
  root: FileSystemDirectoryHandle,
  asset: VNAsset
): Promise<string | undefined> {
  const directory =
    asset.type === "Character" ? "characters" : asset.type.toLowerCase();
  const candidates = [
    asset.file.startsWith("assets/") ? asset.file : `assets/${asset.file}`,
    `assets/${directory}/${basename(asset.file)}`,
  ];
  for (const path of candidates) {
    try {
      return await fileToDataUrl(await readFile(root, path));
    } catch {
      // Try the next conventional asset location.
    }
  }
  return undefined;
}

export async function readVNProjectFromDirectory(
  root: FileSystemDirectoryHandle
): Promise<VNProject> {
  const projectMeta = await readTextFile(root, "meta.md");
  const assetIndex = await readTextFile(root, "assets/index.yml");
  const assets = parseAssets(assetIndex);
  const files = await listProjectFiles(root);
  const textByPath = new Map<string, string>();

  for (const entry of files) {
    if (entry.kind !== "file") continue;
    if (/\.(md|ya?ml|txt|json)$/i.test(entry.path)) {
      textByPath.set(entry.path, await readTextFile(root, entry.path));
    }
  }

  const chapters = new Map<string, { title: string; scenes: VNScene[] }>();
  for (const entry of files) {
    if (entry.kind !== "file") continue;
    const match = entry.path.match(
      /^(chapter-[^/]+)\/scenes\/([^/]+)\/(meta\.md|stage\.yml|script\.md)$/
    );
    if (!match) continue;
    const [, chapterId, sceneId] = match;
    const chapterMeta = frontmatter(textByPath.get(`${chapterId}/meta.md`) ?? "");
    const sceneMeta = frontmatter(
      textByPath.get(`${chapterId}/scenes/${sceneId}/meta.md`) ?? ""
    );
    const stage = parseStage(
      textByPath.get(`${chapterId}/scenes/${sceneId}/stage.yml`) ?? ""
    );
    const chapter = chapters.get(chapterId) ?? {
      title: chapterMeta.title || chapterId,
      scenes: [],
    };
    if (!chapter.scenes.some((scene) => scene.id === sceneId)) {
      chapter.scenes.push({
        id: sceneId,
        title: sceneMeta.title || sceneId,
        background: stage.background,
        characters: stage.characters,
        script: textByPath.get(`${chapterId}/scenes/${sceneId}/script.md`) ?? "",
      });
    }
    chapters.set(chapterId, chapter);
  }

  for (const asset of assets) {
    asset.dataUrl = await assetDataUrl(root, asset);
  }

  return {
    title: frontmatter(projectMeta).title || "Untitled",
    titleImageDataUrl: await projectFileDataUrl(root, "assets/ui/menu-background.png"),
    chapters: [...chapters.entries()].map(([id, value]) => ({
      id,
      title: value.title,
      scenes: value.scenes.sort((a, b) => a.id.localeCompare(b.id)),
    })),
    assets,
  };
}

export async function hasVNSourceFiles(
  root: FileSystemDirectoryHandle
): Promise<boolean> {
  const [hasAssets, hasMeta] = await Promise.all([
    fileExists(root, "assets/index.yml"),
    fileExists(root, "meta.md"),
  ]);
  return hasAssets && hasMeta;
}
