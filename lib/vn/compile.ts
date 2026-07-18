import { ASSET_COLORS, ASSET_DIR, IMAGE_ASSET_TYPES, type VNProject, type VNAsset } from "./types";
import { makePngBlob } from "./png";
import { compileSceneStage } from "./stage-compile";

function textBlob(s: string): Blob {
  return new Blob([s], { type: "text/plain; charset=utf-8" });
}

/** Port of vn-template/scripts/lib/compile.mjs#parseScript. */
export function parseScript(md: string): string[] {
  const out: string[] = [];
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("#")) {
      out.push(`; ${line.slice(1).trim()}`);
      continue;
    }
    if (line === "end;") {
      out.push("end;");
      continue;
    }
    if (/^changeScene:/i.test(line)) {
      const m = line.match(/^changeScene:\s*([^\s;]+)/i);
      out.push(`changeScene:${m![1].replace(/\.txt$/i, "")}.txt;`);
      continue;
    }
    if (/^callScene:/i.test(line)) {
      const m = line.match(/^callScene:\s*([^\s;]+)/i);
      out.push(`callScene:${m![1].replace(/\.txt$/i, "")}.txt;`);
      continue;
    }
    if (line.startsWith(">>")) {
      const body = line.slice(2).trim();
      const opts = body
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((opt) => {
          const idx = opt.lastIndexOf(":");
          const label = opt.slice(0, idx).trim();
          const target = opt.slice(idx + 1).trim().replace(/\.txt$/i, "");
          return `${label}:${target}.txt`;
        });
      out.push(`choose:${opts.join("|")};`);
      continue;
    }
    if (line.startsWith("~~")) {
      const n = line.slice(2).trim().replace(/[^0-9]/g, "");
      if (n) out.push(`wait:${n};`);
      continue;
    }
    if (line.startsWith(":")) {
      out.push(`:${line.slice(1).trim()};`);
      continue;
    }
    const m = line.match(/^(.+?):\s*(.+)$/);
    if (m) {
      let text = m[2].trim();
      if (!text.endsWith(";")) text += ";";
      out.push(`${m[1].trim()}:${text}`);
      continue;
    }
    out.push(`; ${line}`);
  }
  return out;
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob | undefined> {
  try {
    const res = await fetch(dataUrl);
    if (res.ok) return await res.blob();
  } catch {
    /* ignore */
  }
  return undefined;
}

function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "visual-novel"
  );
}

function basename(path: string): string {
  return path.split("/").at(-1) ?? path;
}

/**
 * Compile a VN project into an OpenWebGal `game/` file map.
 * Keys are paths relative to `game/` (e.g. "scene/start.txt", "background/home.png").
 */
export async function compile(vn: VNProject): Promise<Record<string, Blob>> {
  const files: Record<string, Blob> = {};
  const byId = new Map<string, VNAsset>(vn.assets.map((a) => [a.id, a]));

  for (const a of vn.assets) {
    const dir = ASSET_DIR[a.type];
    const file = basename(a.file || `${a.id}.png`);
    let blob: Blob | undefined;
    if (a.dataUrl) blob = await dataUrlToBlob(a.dataUrl);
    if (!blob && IMAGE_ASSET_TYPES.includes(a.type)) {
      blob = await makePngBlob(320, 240, ASSET_COLORS[a.type], a.name);
    }
    if (blob) files[`${dir}/${file}`] = blob;
  }
  files["background/Title.png"] = await makePngBlob(320, 240, [60, 80, 120], vn.title);

  files["config.txt"] = textBlob(
    [
      `Game_name:${vn.title};`,
      `Game_key:${slug(vn.title)};`,
      `Title_img:Title.png;`,
      `Enable_Appreciation:true;`,
      `Enable_Continue:true;`,
      `Enable_flowchart:true;`,
    ].join("\n") + "\n"
  );

  files["template/template.json"] = new Blob(
    [JSON.stringify({ name: vn.title, webgalVersion: "4.6.2" }, null, 2)],
    { type: "application/json" }
  );

  const scenes = vn.chapters.flatMap((c) => c.scenes);
  for (const sc of scenes) {
    const out: string[] = [`; ===== ${sc.id} =====`, ...compileSceneStage(sc, byId)];
    out.push("");
    out.push(...parseScript(sc.script));
    files[`scene/${sc.id}.txt`] = textBlob(out.join("\n") + "\n");
  }

  const first = scenes[0]?.id;
  files["scene/start.txt"] = textBlob(
    [
      "; 启动脚本 — OpenWebGal 会自动加载 game/scene/start.txt",
      `: ${vn.title};`,
      "wait:1200;",
      first ? `changeScene:${first}.txt;` : "; (no scenes)",
    ].join("\n") + "\n"
  );

  return files;
}
