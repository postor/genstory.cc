import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const SRC = path.join(root, "node_modules", "webgal-engine", "dist");
const DEST = path.join(root, "public", "webgal");
const BRIDGE = path.join(__dirname, "webgal-bridge-sw.js");

if (!fs.existsSync(SRC)) {
  console.error("未找到 node_modules/webgal-engine/dist，请先安装主项目依赖");
  process.exit(1);
}

fs.rmSync(DEST, { recursive: true, force: true });
fs.mkdirSync(DEST, { recursive: true });

const manifest = [];
function copy(src, dest, rel) {
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    const r = path.join(rel, e.name).split(path.sep).join("/");
    if (e.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      copy(s, d, r);
    } else {
      if (e.name.endsWith(".gz")) continue; // skip precompressed variants
      fs.copyFileSync(s, d);
      manifest.push(r);
    }
  }
}
copy(SRC, DEST, "");

// Replace the engine's own SW with our preview bridge.
fs.copyFileSync(BRIDGE, path.join(DEST, "webgal-serviceworker.js"));

// Force the engine to register its (now bridged) service worker even on
// localhost. By default the engine skips the SW on localhost/127.0.0.1, which
// would prevent the preview bridge from serving game files during local dev.
const indexPath = path.join(DEST, "index.html");
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, "utf8");
  html = html.replace(
    /const isLocalPreview = localHostnames\.includes\(window\.location\.hostname\) \|\| window\.location\.protocol === 'file:';/,
    "const isLocalPreview = false;"
  );
  fs.writeFileSync(indexPath, html);
}

fs.writeFileSync(
  path.join(DEST, "engine-manifest.json"),
  JSON.stringify(manifest, null, 2)
);

console.log(`webgal-engine -> public/webgal/ (${manifest.length} files)`);
