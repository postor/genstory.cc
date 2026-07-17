import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { makePng } from './png.mjs';

const ROOT = path.resolve(process.cwd());
const SOURCE = path.join(ROOT, 'source');
const DIST = path.join(ROOT, 'dist');
const GAME = path.join(DIST, 'game');

// 资产类型 → OpenWebGal 资源子目录
const TYPES_DIR = { Background: 'background', Character: 'figure', CG: 'cg' };
const ASSET_COLORS = {
  Background: [70, 110, 160],
  Character: [200, 120, 140],
  CG: [120, 160, 120],
};

function readFrontmatter(p) {
  if (!fs.existsSync(p)) return {};
  const txt = fs.readFileSync(p, 'utf8');
  const m = txt.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return {};
  return yaml.load(m[1]) || {};
}

function walkScenes() {
  const chapters = fs
    .readdirSync(SOURCE)
    .filter((d) => /^chapter-/.test(d) && fs.statSync(path.join(SOURCE, d)).isDirectory());
  const scenes = [];
  for (const ch of chapters) {
    const sceneDir = path.join(SOURCE, ch, 'scenes');
    if (!fs.existsSync(sceneDir)) continue;
    for (const sc of fs.readdirSync(sceneDir)) {
      const dir = path.join(sceneDir, sc);
      if (fs.statSync(dir).isDirectory()) scenes.push({ chapter: ch, id: sc, dir });
    }
  }
  scenes.sort((a, b) => a.id.localeCompare(b.id));
  return scenes;
}

// 将 script.md 解析为 OpenWebGal 脚本行
function parseScript(md) {
  const out = [];
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#')) {
      out.push(`; ${line.slice(1).trim()}`);
      continue;
    }
    if (line === 'end;') {
      out.push('end;');
      continue;
    }
    if (/^changeScene:/i.test(line)) {
      const m = line.match(/^changeScene:\s*([^\s;]+)/i);
      out.push(`changeScene:${m[1].replace(/\.txt$/i, '')}.txt;`);
      continue;
    }
    if (/^callScene:/i.test(line)) {
      const m = line.match(/^callScene:\s*([^\s;]+)/i);
      out.push(`callScene:${m[1].replace(/\.txt$/i, '')}.txt;`);
      continue;
    }
    if (line.startsWith('>>')) {
      const body = line.slice(2).trim();
      const opts = body
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((opt) => {
          const idx = opt.lastIndexOf(':');
          const label = opt.slice(0, idx).trim();
          const target = opt.slice(idx + 1).trim().replace(/\.txt$/i, '');
          return `${label}:${target}.txt`;
        });
      out.push(`choose:${opts.join('|')};`);
      continue;
    }
    if (line.startsWith('~~')) {
      const n = line.slice(2).trim().replace(/[^0-9]/g, '');
      if (n) out.push(`wait:${n};`);
      continue;
    }
    if (line.startsWith(':')) {
      out.push(`:${line.slice(1).trim()};`);
      continue;
    }
    const m = line.match(/^(.+?):\s*(.+)$/);
    if (m) {
      let text = m[2].trim();
      if (!text.endsWith(';')) text += ';';
      out.push(`${m[1].trim()}:${text}`);
      continue;
    }
    out.push(`; ${line}`);
  }
  return out;
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else if (!fs.existsSync(d)) fs.copyFileSync(s, d); // 不覆盖已生成的 game/
  }
}

function copyEngine() {
  const candidates = [
    path.join(ROOT, 'node_modules', 'webgal-engine', 'dist'),
    path.join(ROOT, 'node_modules', 'webgal-engine'),
  ];
  const src = candidates.find(
    (p) => fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))
  );
  if (!src) throw new Error('未找到 webgal-engine/dist，请先运行 npm install');
  copyDir(src, DIST);
}

export function compile() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(path.join(GAME, 'scene'), { recursive: true });
  fs.mkdirSync(path.join(GAME, 'template'), { recursive: true });
  fs.mkdirSync(path.join(GAME, 'background'), { recursive: true });
  fs.mkdirSync(path.join(GAME, 'figure'), { recursive: true });

  // 资产索引（index.yml 是普通 YAML 文档，非 frontmatter）
  const assetDoc =
    yaml.load(fs.readFileSync(path.join(SOURCE, 'assets', 'index.yml'), 'utf8')) || {};
  const assets = assetDoc.assets || [];
  const byId = new Map(assets.map((a) => [a.id, a]));

  // 优先使用 source/assets/<dir>/<file> 中的真实素材；缺失则生成占位图
  for (const a of assets) {
    const dir = TYPES_DIR[a.type];
    if (!dir) continue;
    const file = a.file || `${a.id}.png`;
    const target = path.join(GAME, dir, file);
    const src = path.join(SOURCE, 'assets', dir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, target);
      continue;
    }
    if (fs.existsSync(target)) continue;
    const color = ASSET_COLORS[a.type] || [150, 150, 150];
    fs.writeFileSync(target, makePng(160, 160, color));
  }
  // 标题背景占位图
  fs.writeFileSync(path.join(GAME, 'background', 'Title.png'), makePng(160, 160, [60, 80, 120]));

  // config.txt
  const meta = readFrontmatter(path.join(SOURCE, 'meta.md'));
  const config = [
    `Game_name:${meta.title || '视觉小说模板'};`,
    `Game_key:redhood;`,
    `Title_img:Title.png;`,
    `Enable_Appreciation:true;`,
    `Enable_Continue:true;`,
    `Enable_flowchart:true;`,
  ].join('\n') + '\n';
  fs.writeFileSync(path.join(GAME, 'config.txt'), config);

  // template.json
  fs.writeFileSync(
    path.join(GAME, 'template', 'template.json'),
    JSON.stringify({ name: meta.title || '视觉小说模板', webgalVersion: '4.6.2' }, null, 2)
  );

  // 场景
  const scenes = walkScenes();
  for (const sc of scenes) {
    // stage.yml 是普通 YAML 文档（无 --- 分隔符），直接按 YAML 解析
    const stage = yaml.load(fs.readFileSync(path.join(sc.dir, 'stage.yml'), 'utf8')) || {};
    const scriptMd = fs.readFileSync(path.join(sc.dir, 'script.md'), 'utf8');
    const out = [`; ===== ${sc.id} (${sc.chapter}) =====`];
    if (stage.background) {
      const a = byId.get(stage.background);
      const file = a ? a.file || `${a.id}.png` : `${stage.background}.png`;
      out.push(`changeBg:${file};`);
    }
    for (const ch of stage.characters || []) {
      const a = byId.get(ch.id);
      const file = a ? a.file || `${ch.id}.png` : `${ch.id}.png`;
      const pos = ch.position === 'left' ? ' -left' : ch.position === 'right' ? ' -right' : '';
      out.push(`changeFigure:${file}${pos};`);
    }
    out.push('');
    out.push(...parseScript(scriptMd));
    fs.writeFileSync(path.join(GAME, 'scene', `${sc.id}.txt`), out.join('\n') + '\n');
  }

  // 入口 start.txt（引擎自动加载）
  const first = scenes[0]?.id;
  const start = [
    '; 启动脚本 — OpenWebGal 会自动加载 game/scene/start.txt',
    `: ${meta.title || '视觉小说模板'};`,
    'wait:1200;',
    `changeScene:${first}.txt;`,
  ].join('\n') + '\n';
  fs.writeFileSync(path.join(GAME, 'scene', 'start.txt'), start);

  // 拷贝 OpenWebGal 引擎
  copyEngine();

  return { sceneCount: scenes.length, sceneIds: scenes.map((s) => s.id) };
}
