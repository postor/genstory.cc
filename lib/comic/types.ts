export type ComicAssetType = "Background" | "Character" | "CG";

export interface ComicAsset {
  id: string;
  type: ComicAssetType;
  name: string;
  /** File name used inside the comic project (e.g. page-001.png). */
  file: string;
  /** Optional user-uploaded image, stored as a data URL. */
  dataUrl?: string;
}

export interface ComicBalloon {
  /** Speaker name shown in the dialogue bubble. */
  speaker: string;
  /** The spoken line. */
  line: string;
}

export interface ComicPanel {
  /** Stable id, e.g. panel-1. */
  id: string;
  /** Visual description of the panel state (not a render call). */
  description: string;
  /** Asset ids of characters appearing in the panel. */
  characters: string[];
  /** Narration / caption text. */
  caption?: string;
  /** Dialogue balloons inside the panel. */
  balloons?: ComicBalloon[];
  /** Layout size hint for the panel grid. */
  size?: "full" | "wide" | "tall" | "small";
  /** Optional background asset id referenced by the panel. */
  asset?: string;
}

export interface ComicPage {
  /** Stable id, e.g. page-001. */
  id: string;
  title: string;
  /** CG asset id of the rendered page image. */
  assetId: string;
  /** One-line summary of the whole page. */
  summary: string;
  panels: ComicPanel[];
}

export interface ComicProject {
  title: string;
  /** Visual style description shared by every page. */
  style: string;
  backgrounds: ComicAsset[];
  characters: ComicAsset[];
  pages: ComicPage[];
}

/** Comic asset sub-directory for each asset type. */
export const ASSET_DIR: Record<ComicAssetType, string> = {
  Background: "backgrounds",
  Character: "characters",
  CG: "pages",
};
