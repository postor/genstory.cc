export type PhaserAssetUrlMap = Readonly<Record<string, string>>;

export function normalizePhaserAssetPath(value: string): string {
  return value
    .split(/[?#]/, 1)[0]
    .replace(/^\.?\//, "")
    .replace(/^\/+/, "");
}

export function isPhaserPreviewLocation(search: string): boolean {
  return new URLSearchParams(search).get("preview") === "1";
}

export function resolvePhaserAssetUrl(
  path: string,
  assetUrls: PhaserAssetUrlMap,
  search: string
): string {
  if (!isPhaserPreviewLocation(search)) return path;
  return assetUrls[normalizePhaserAssetPath(path)] ?? path;
}

function escapeScriptJson(value: string): string {
  return value.replaceAll("<", "\\u003c");
}

export function buildPhaserAssetBridgeScript(
  assetUrls: PhaserAssetUrlMap,
  options: { preview?: boolean } = {}
): string {
  const serializedAssetUrls = escapeScriptJson(JSON.stringify(assetUrls));
  const previewLiteral = options.preview === true ? "true" : "false";

  return `(function (global) {
  if (global.__GENSTORY_PHASER_ASSET_BRIDGE__) return;

  var assetUrls = ${serializedAssetUrls};
  var preview = ${previewLiteral} ||
    new URLSearchParams(global.location.search).get("preview") === "1" ||
    global.GENSTORY_PREVIEW === true;

  function normalize(path) {
    return String(path)
      .split(/[?#]/, 1)[0]
      .replace(/^.?\\//, "")
      .replace(/^\\/+/, "");
  }

  function resolve(path) {
    if (!preview || typeof path !== "string") return path;
    return assetUrls[normalize(path)] || path;
  }

  global.GENSTORY_PREVIEW = preview;
  global.GENSTORY_ASSET_URLS = assetUrls;
  global.GenStoryAssets = Object.freeze({
    isPreview: preview,
    resolve: resolve
  });

  var LoaderPlugin = global.Phaser &&
    global.Phaser.Loader &&
    global.Phaser.Loader.LoaderPlugin;
  if (LoaderPlugin && LoaderPlugin.prototype && !LoaderPlugin.prototype.__genstoryPatched) {
    var originalAddFile = LoaderPlugin.prototype.addFile;
    LoaderPlugin.prototype.addFile = function (file) {
      var files = Array.isArray(file) ? file : [file];
      files.forEach(function (item) {
        if (item && typeof item.url === "string") {
          item.url = resolve(item.url);
        }
      });
      return originalAddFile.call(this, file);
    };
    LoaderPlugin.prototype.__genstoryPatched = true;
  }

  global.__GENSTORY_PHASER_ASSET_BRIDGE__ = true;
})(window);`;
}
