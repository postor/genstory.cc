import type { VNAsset, VNScene } from "./types";

export const RESET_FIXED_FIGURE_SLOTS = [
  "changeFigure:none -left;",
  "changeFigure:none;",
  "changeFigure:none -right;",
];

function basename(path: string): string {
  return path.split("/").at(-1) ?? path;
}

export function compileSceneStage(
  scene: VNScene,
  assetsById: ReadonlyMap<string, VNAsset>
): string[] {
  const out = [...RESET_FIXED_FIGURE_SLOTS];

  if (scene.background) {
    const asset = assetsById.get(scene.background);
    const file = asset ? basename(asset.file) : `${scene.background}.png`;
    out.push(`changeBg:${file};`);
  }

  for (const character of scene.characters || []) {
    const asset = assetsById.get(character.id);
    const file = asset ? basename(asset.file) : `${character.id}.png`;
    const position =
      character.position === "left"
        ? " -left"
        : character.position === "right"
          ? " -right"
          : "";
    out.push(`changeFigure:${file}${position};`);
  }

  return out;
}
