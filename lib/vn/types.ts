export type AssetType = "Background" | "Character" | "CG" | "Voice";

export interface VNAsset {
  id: string;
  type: AssetType;
  name: string;
  /** File name used inside the exported OpenWebGal game (e.g. home.png). */
  file: string;
  /** Optional user-uploaded image, stored as a data URL. */
  dataUrl?: string;
}

export interface VNStageCharacter {
  /** Asset id of the figure. */
  id: string;
  position?: "left" | "center" | "right";
  expression?: string;
}

export interface VNScene {
  /** Stable id, e.g. scene-001. */
  id: string;
  title: string;
  /** Background asset id, if any. */
  background?: string;
  characters: VNStageCharacter[];
  /** Script text in the simple markdown syntax (see docs/vn-browser-plan.md). */
  script: string;
}

export interface VNChapter {
  id: string;
  title: string;
  scenes: VNScene[];
}

export interface VNProject {
  title: string;
  chapters: VNChapter[];
  assets: VNAsset[];
}

/** OpenWebGal asset sub-directory for each asset type. */
export const ASSET_DIR: Record<AssetType, string> = {
  Background: "background",
  Character: "figure",
  CG: "cg",
  Voice: "voice",
};

/** Placeholder fill color per asset type (RGB). Used only for image fallbacks. */
export const ASSET_COLORS: Record<AssetType, [number, number, number]> = {
  Background: [70, 110, 160],
  Character: [200, 120, 140],
  CG: [120, 160, 120],
  Voice: [120, 120, 140],
};

/** Asset types whose compiled output is an image placeholder when no data is present. */
export const IMAGE_ASSET_TYPES: AssetType[] = ["Background", "Character", "CG"];
