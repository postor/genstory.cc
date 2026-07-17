import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

const [url, out] = process.argv.slice(2);
if (!url || !out) {
  console.error("usage: node dl.mjs <url> <out>");
  process.exit(1);
}
const res = await fetch(url);
if (!res.ok) {
  console.error(`fetch failed ${res.status}: ${url}`);
  process.exit(1);
}
const buf = Buffer.from(await res.arrayBuffer());
await mkdir(dirname(out), { recursive: true });
await writeFile(out, buf);
console.log(`saved ${out} (${buf.length} bytes)`);
