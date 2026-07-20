// The .ts suffix keeps the native Node strip-types test runner resolvable.
import { normalizeRelativePath } from "../file-system/paths.ts";

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|avif|bmp|ico)$/i;
const VIDEO_EXT_RE = /\.(mp4|webm|ogv|mov|m4v)$/i;
const AUDIO_EXT_RE = /\.(mp3|wav|ogg|m4a|aac|flac)$/i;
const MEDIA_EXT_RE = /\.(png|jpe?g|gif|webp|avif|bmp|ico|mp4|webm|ogv|mov|m4v|mp3|wav|ogg|m4a|aac|flac)$/i;
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;
const MARKDOWN_IMAGE_RE = /!\[[^\]]*\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+["'][^)]*["'])?\s*\)/g;
const MARKDOWN_LINK_RE = /(?<!!)\[[^\]]*\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+["'][^)]*["'])?\s*\)/g;
const HTML_IMAGE_RE = /<img\b[^>]*\bsrc=(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi;
const HTML_MEDIA_RE = /<(?:video|audio)\b[^>]*\bsrc=(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi;

function stripQueryAndHash(src: string): string {
  return src.split(/[?#]/, 1)[0] ?? "";
}

function cleanMarkdownSource(src: string): string {
  const trimmed = src.trim();
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;

}

export function isProjectImageSource(src: string): boolean {
  const cleaned = cleanMarkdownSource(src);
  if (!cleaned || cleaned.startsWith("#") || cleaned.startsWith("//")) return false;
  if (SCHEME_RE.test(cleaned)) return false;
  return IMAGE_EXT_RE.test(stripQueryAndHash(cleaned));
}

export function mediaKindForSource(src: string): "image" | "video" | "audio" | null {
  const cleaned = cleanMarkdownSource(src);
  if (!cleaned || cleaned.startsWith("#") || cleaned.startsWith("//")) return null;
  if (SCHEME_RE.test(cleaned)) return null;
  const path = stripQueryAndHash(cleaned);
  if (IMAGE_EXT_RE.test(path)) return "image";
  if (VIDEO_EXT_RE.test(path)) return "video";
  if (AUDIO_EXT_RE.test(path)) return "audio";
  return null;
}

export function isProjectMediaSource(src: string): boolean {
  const cleaned = cleanMarkdownSource(src);
  if (!cleaned || cleaned.startsWith("#") || cleaned.startsWith("//")) return false;
  if (SCHEME_RE.test(cleaned)) return false;
  return MEDIA_EXT_RE.test(stripQueryAndHash(cleaned));
}

export function resolveMarkdownImagePath(markdownPath: string, src: string): string | null {
  const cleaned = cleanMarkdownSource(src);
  if (!isProjectImageSource(cleaned)) return null;
  return resolveMarkdownMediaPath(markdownPath, cleaned);

}

export function resolveMarkdownMediaPath(markdownPath: string, src: string): string | null {
  const cleaned = cleanMarkdownSource(src);
  if (!isProjectMediaSource(cleaned)) return null;
  const imagePath = stripQueryAndHash(cleaned);
  const projectPath = imagePath.startsWith("/")
    ? imagePath.slice(1)
    : [
        ...markdownPath.split("/").slice(0, -1),
        imagePath,
      ].join("/");
  try {
    return normalizeRelativePath(projectPath);
  } catch {
    return null;
  }

}

export function collectMarkdownImageSources(markdown: string): string[] {
  const sources = new Set<string>();
  for (const match of markdown.matchAll(MARKDOWN_IMAGE_RE)) {
    const src = cleanMarkdownSource(match[1] ?? "");
    if (isProjectImageSource(src)) sources.add(src);
  }
  for (const match of markdown.matchAll(HTML_IMAGE_RE)) {
    const src = cleanMarkdownSource(match[1] ?? match[2] ?? match[3] ?? "");
    if (isProjectImageSource(src)) sources.add(src);
  }
  return [...sources];

}

export function collectMarkdownMediaSources(markdown: string): string[] {
  const sources = new Set<string>();
  for (const match of markdown.matchAll(MARKDOWN_IMAGE_RE)) {
    const src = cleanMarkdownSource(match[1] ?? "");
    if (isProjectMediaSource(src)) sources.add(src);
  }
  for (const match of markdown.matchAll(MARKDOWN_LINK_RE)) {
    const src = cleanMarkdownSource(match[1] ?? "");
    if (isProjectMediaSource(src)) sources.add(src);
  }
  for (const match of markdown.matchAll(HTML_IMAGE_RE)) {
    const src = cleanMarkdownSource(match[1] ?? match[2] ?? match[3] ?? "");
    if (isProjectMediaSource(src)) sources.add(src);
  }
  for (const match of markdown.matchAll(HTML_MEDIA_RE)) {
    const src = cleanMarkdownSource(match[1] ?? match[2] ?? match[3] ?? "");
    if (isProjectMediaSource(src)) sources.add(src);
  }
  return [...sources];

}
