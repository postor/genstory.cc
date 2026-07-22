import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("new project creation tracks successful project creation", async () => {
  const source = await readFile(new URL("./new-client.tsx", import.meta.url), "utf8");

  assert.match(source, /import \{ trackProjectCreated \} from "@\/lib\/analytics"/);
  assert.match(source, /await saveProject\(project\);[\s\S]*trackProjectCreated\(\{/);
  assert.match(source, /template,/);
  assert.match(source, /lang,/);
  assert.match(source, /customTitle: title\.trim\(\)\.length > 0/);
});
