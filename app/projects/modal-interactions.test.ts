import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("project pages use in-page dialogs instead of native browser popups", async () => {
  const [newClientSource, projectsSource, editorSource] = await Promise.all([
    readFile(new URL("./new/new-client.tsx", import.meta.url), "utf8"),
    readFile(new URL("./projects-client.tsx", import.meta.url), "utf8"),
    readFile(new URL("./editor/editor-client.tsx", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(newClientSource, /window\.alert\(/);
  assert.match(newClientSource, /<InteractionModal/);

  assert.doesNotMatch(projectsSource, /window\.confirm\(/);
  assert.match(projectsSource, /<InteractionModal/);

  assert.doesNotMatch(editorSource, /window\.prompt\(/);
  assert.doesNotMatch(editorSource, /window\.confirm\(/);
  assert.match(editorSource, /<PromptModal/);
  assert.match(editorSource, /<InteractionModal/);
});
