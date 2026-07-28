import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("projects page can enter inline title edit mode from title or icon", async () => {
  const source = await readFile(new URL("./projects-client.tsx", import.meta.url), "utf8");

  assert.match(source, /editingProjectId === project\.id/);
  assert.match(source, /onClick=\{\(\) => startTitleEditing\(project\)\}/);
  assert.match(source, /onBlur=\{\(\) => void commitTitleChange\(project\)\}/);
  assert.match(source, /<Pencil className="size-3\.5" \/>/);

  assert.match(source, /await saveProject\(\{ \.\.\.project, title: nextTitle, updatedAt: now \}\)/);

});

test("projects empty state links the new work call to action", async () => {
  const source = await readFile(new URL("./projects-client.tsx", import.meta.url), "utf8");

  assert.match(source, /<Link href="\/projects\/new" className="[^"]*underline/);
  assert.match(source, /\{t\("projects\.emptyBeforeNew"\)\}/);
  assert.match(source, /\{t\("projects\.new"\)\}/);
  assert.match(source, /\{t\("projects\.emptyAfterNew"\)\}/);
});

test("expired cloud authorization offers an actionable reconnect button", async () => {
  const source = await readFile(new URL("./projects-client.tsx", import.meta.url), "utf8");

  assert.match(source, /isCloudAuthorizationExpired/);
  assert.match(source, /handleCloudReconnect/);
  assert.match(source, /requestGoogleToken\(settings\.rememberAuthorization, true\)/);
  assert.match(source, /onClick=\{\(\) => void handleCloudReconnect\(\)\}/);
  assert.match(source, /t\("settings\.cloud\.reconnect"\)/);
});

test("project cards expose open, share, and more icon actions", async () => {
  const source = await readFile(new URL("./projects-client.tsx", import.meta.url), "utf8");

  assert.match(source, /<FolderOpen className="size-4" \/>/);
  assert.match(source, /<Share2 className="size-4" \/>/);
  assert.match(source, /<Ellipsis className="size-4" \/>/);
  assert.match(source, /title=\{t\("projects\.open"\)\}/);
  assert.match(source, /title=\{t\("projects\.share"\)\}/);
  assert.match(source, /title=\{t\("projects\.more"\)\}/);
  assert.match(source, /aria-haspopup="menu"/);
  assert.match(source, /aria-label=\{t\("projects\.more"\)\} className="grid gap-1" role="menu"/);
  assert.match(source, /role="menuitem"/);
  assert.match(source, /handleShareProject\(project\)/);
  assert.match(source, /prepareCloudDownload\(project\)/);
  assert.match(source, /setProjectPendingDelete\(project\)/);
});
