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
  assert.match(projectsSource, /cloudConfirm === "download"/);
  assert.match(projectsSource, /cloudConfirm === "upload"/);
  assert.match(projectsSource, /projects\.cloudDownloadProjectDescription/);
  assert.match(projectsSource, /projects\.cloudUploadProjectDescription/);
  assert.match(projectsSource, /role="progressbar"/);
  assert.doesNotMatch(projectsSource, /prepareCloudDownload\(undefined, "sync"\)/);
  assert.doesNotMatch(projectsSource, /projects\.cloudSync/);
  assert.doesNotMatch(projectsSource, /cloudConfirm === "sync"/);
  assert.doesNotMatch(projectsSource, /handleCloudSync/);
  assert.doesNotMatch(projectsSource, /Presigned|presigned|S3|s3/);
});

test("cloud sync actions use the unified Chinese operation names", async () => {
  const i18nSource = await readFile(new URL("../../lib/i18n.tsx", import.meta.url), "utf8");

  assert.match(i18nSource, /"projects\.cloudUpload": "同步到网盘"/);
  assert.match(i18nSource, /"projects\.cloudDownload": "从网盘同步"/);
  assert.match(i18nSource, /"projects\.cloudUploadProject": "同步到网盘"/);
  assert.match(i18nSource, /"projects\.cloudDownloadProject": "从网盘同步"/);
  assert.match(i18nSource, /"projects\.cloudSuccessUpload": "已同步到网盘"/);
  assert.match(i18nSource, /"projects\.cloudSuccessDownload": "已从网盘同步到本地"/);
  assert.doesNotMatch(i18nSource, /"projects\.cloudUpload": "上传到云盘"/);
  assert.doesNotMatch(i18nSource, /"projects\.cloudDownload": "从云盘下载并合并"/);
});
