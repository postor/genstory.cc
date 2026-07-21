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

test("cloud sync setup uses OAuth provider guidance and official links", async () => {
  const settingsSource = await readFile(
    new URL("../settings/settings-client.tsx", import.meta.url),
    "utf8"
  );

  assert.match(settingsSource, /<Dialog open=\{guideOpen\}/);
  assert.match(settingsSource, /google-drive/);
  assert.doesNotMatch(settingsSource, /dropbox|Dropbox/);
  assert.doesNotMatch(settingsSource, /one-drive|OneDrive|ONEDRIVE/);
  assert.match(settingsSource, /handleCloudOAuthCallback/);
  assert.match(settingsSource, /requestGoogleToken/);
  assert.match(settingsSource, /https:\/\/developers\.google\.com\/drive/);
  assert.match(settingsSource, /target="_blank"/);
  assert.doesNotMatch(settingsSource, /Presigned|presigned|AmazonS3|Cloudflare/);
});

test("project cloud sync exposes per-project upload and download actions", async () => {
  const projectsSource = await readFile(new URL("./projects-client.tsx", import.meta.url), "utf8");

  assert.match(projectsSource, /projects\.cloudDownloadProject/);
  assert.match(projectsSource, /projects\.cloudUploadProject/);
  assert.match(projectsSource, /prepareCloudDownload\(project\)/);
  assert.match(projectsSource, /prepareCloudUpload\(project\)/);
  assert.match(projectsSource, /projects\.cloudSync/);
  assert.match(projectsSource, /cloudConfirm === "download"/);
  assert.match(projectsSource, /cloudConfirm === "upload"/);
  assert.match(projectsSource, /cloudConfirm === "sync"/);
  assert.match(projectsSource, /projects\.cloudDownloadProjectDescription/);
  assert.match(projectsSource, /projects\.cloudUploadProjectDescription/);
  assert.match(projectsSource, /projects\.cloudSyncTitle/);
  assert.match(projectsSource, /role="progressbar"/);
  assert.match(projectsSource, /handleCloudSync/);
  assert.doesNotMatch(projectsSource, /Presigned|presigned|S3|s3/);
});
