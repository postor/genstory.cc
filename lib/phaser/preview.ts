import { buildPhaserAssetBridgeScript, type PhaserAssetUrlMap } from "./assets.ts";

const PHASER_RUNTIME_PATTERN = /(?:https?:\/\/[^"']*phaser(?:\.min)?\.js|\/phaser\/phaser\.min\.js|vendor\/phaser\.min\.js)$/i;

function normalizeSourcePath(value: string): string {
  return decodeURIComponent(value).replace(/^\.\//, "");
}

function escapeScriptContent(value: string): string {
  return value.replace(/<\/script/gi, "<\\/script");
}

function replaceTitle(html: string, title: string): string {
  const escaped = title.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  if (/<title\b[^>]*>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, `<title>${escaped}</title>`);
  }
  return html.replace(/<head\b[^>]*>/i, (match) => `${match}<title>${escaped}</title>`);
}

function inlineLocalStyles(html: string, files: Record<string, string>): string {
  return html.replace(
    /<link\b([^>]*?)\brel=["']stylesheet["'][^>]*?\bhref=["']([^"']+)["'][^>]*>/gi,
    (full, _attributes: string, href: string) => {
      const content = files[normalizeSourcePath(href)];
      return content === undefined ? full : `<style>\n${content}\n</style>`;
    }
  );
}

function inlineLocalScripts(
  html: string,
  files: Record<string, string>,
  runtimePath: string
): string {
  return html.replace(
    /<script\b([^>]*?)\bsrc=["']([^"']+)["'][^>]*>\s*<\/script>/gi,
    (full, _attributes: string, src: string) => {
      if (PHASER_RUNTIME_PATTERN.test(src)) return `<script src="${runtimePath}"></script>`;
      const content = files[normalizeSourcePath(src)];
      return content === undefined ? full : `<script>\n${escapeScriptContent(content)}\n</script>`;
    }
  );
}

export function buildPhaserPreviewHtml(
  files: Record<string, string>,
  title: string,
  options: { assetUrls?: PhaserAssetUrlMap } = {}
): string {
  const entry = files["index.html"];
  if (!entry) throw new Error("Phaser 项目缺少 index.html");
  const html = inlineLocalScripts(
    inlineLocalStyles(replaceTitle(entry, title), files),
    files,
    "/phaser/phaser.min.js"
  );
  const bridge = `<script>\n${buildPhaserAssetBridgeScript(options.assetUrls ?? {}, { preview: true })}\n</script>`;
  return html.replace(
    '<script src="/phaser/phaser.min.js"></script>',
    `<script src="/phaser/phaser.min.js"></script>${bridge}`
  );
}

export function buildPhaserStandaloneHtml(indexHtml: string): string {
  return indexHtml.replace(
    /(<script\b[^>]*\bsrc=["'])([^"']*phaser(?:\.min)?\.js)(["'][^>]*>\s*<\/script>)/gi,
    "$1vendor/phaser.min.js$3"
  );
}
