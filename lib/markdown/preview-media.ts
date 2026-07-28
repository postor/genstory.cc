import {
  collectMarkdownMediaSources,
  mediaKindForSource,
  resolveMarkdownMediaPath,
} from "./image-paths.ts";

export interface PreviewMarkdownSection {
  path: string;
  body: string;
}

export interface PreviewSectionMediaReference {
  sectionPath: string;
  source: string;
  mediaPath: string;
  kind: "image" | "video" | "audio";
}

export function collectPreviewSectionMediaReferences(
  sections: readonly PreviewMarkdownSection[]
): PreviewSectionMediaReference[] {
  const references: PreviewSectionMediaReference[] = [];

  for (const section of sections) {
    const sources = collectMarkdownMediaSources(section.body);
    for (const source of sources) {
      const mediaPath = resolveMarkdownMediaPath(section.path, source);
      const kind = mediaKindForSource(source);
      if (!mediaPath || !kind) continue;
      references.push({
        sectionPath: section.path,
        source,
        mediaPath,
        kind,
      });
    }
  }

  return references;
}
