import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "node_modules", "phaser", "dist", "phaser.min.js");
const destinationDir = path.join(root, "public", "phaser");
const destination = path.join(destinationDir, "phaser.min.js");

if (!fs.existsSync(source)) {
  console.error("未找到 Phaser 运行时，请先安装项目依赖");
  process.exit(1);
}

fs.mkdirSync(destinationDir, { recursive: true });
fs.copyFileSync(source, destination);
console.log("phaser -> public/phaser/phaser.min.js");
