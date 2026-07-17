import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';

const ROOT = path.resolve(process.cwd());
const DIST = path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'export');

if (!fs.existsSync(DIST) || !fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('❌ 未找到 dist/，请先运行 npm run build');
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });
const zip = new AdmZip();
zip.addLocalFolder(DIST, ''); // 以相对路径打包整个 OpenWebGal 项目
const outPath = path.join(OUT, 'redhood-openwebgal.zip');
zip.writeZip(outPath);
console.log(`✅ 导出完成：${outPath}`);
console.log(`   包含 ${zip.getEntries().length} 个文件（含 index.html 与 game/）`);
