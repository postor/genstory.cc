import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("new project creation tracks successful project creation", async () => {
  const source = await readFile(new URL("./new-client.tsx", import.meta.url), "utf8");

  assert.match(source, /import \{ trackProjectCreated \} from "@\/lib\/analytics"/);
  assert.match(source, /await saveProject\(project\);[\s\S]*trackProjectCreated\(\{/);
  assert.match(source, /template: createTemplate,/);
  assert.match(source, /lang,/);
  assert.match(source, /customTitle: projectTitle !== defaultTitle/);
});

test("new project page opens a naming dialog from each styled type card", async () => {
  const source = await readFile(new URL("./new-client.tsx", import.meta.url), "utf8");

  assert.match(source, /\/home\/type-icons\/book\.png/);
  assert.match(source, /\/home\/type-icons\/visual-novel\.png/);
  assert.match(source, /xl:grid-cols-\[minmax\(0,1fr\)_320px\]/);
  assert.match(source, /<Dialog[\s\S]*open=\{createType !== undefined\}/);
  assert.match(source, /autoFocus/);
  assert.match(source, /Go/);
  assert.match(source, /\/home\/fg\.png/);
  assert.doesNotMatch(source, /aria-pressed/);
  assert.doesNotMatch(source, /CheckCircle2/);
  assert.doesNotMatch(source, /components\/site-header/);
});
