import { listProjectFiles, readFile } from "../file-system/browser.ts";
import { zipStore, type ZipEntry } from "../vn/zip.ts";
import {
  readInteractiveVideoPreviewFromDirectory,
  type InteractiveVideoPreviewModel,
} from "./preview.ts";

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function safeFilename(value: string): string {
  return value.trim().replace(/[\\/:*?"<>|]+/g, "-") || "interactive-video";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeScriptJson(value: unknown): string {
  return JSON.stringify(value).replaceAll("</", "<\\/");
}

export function buildInteractiveVideoStandaloneHtml(
  model: InteractiveVideoPreviewModel
): string {
  const title = escapeHtml(model.title);
  const data = escapeScriptJson(model);

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    :root { color-scheme: dark; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    html, body, main { height: 100%; }
    body { margin: 0; background: #030712; color: #f9fafb; overflow: hidden; }
    main { display: flex; flex-direction: column; background: #020617; }
    .stage { position: relative; min-height: 0; flex: 1; display: flex; align-items: center; justify-content: center; background: #000; }
    video { width: 100%; height: 100%; object-fit: contain; background: #000; }
    .overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgb(0 0 0 / 64%); padding: 24px; }
    .topbar { position: absolute; right: 12px; top: 12px; display: flex; gap: 8px; z-index: 3; }
    .choice { position: absolute; inset-inline: 0; bottom: 0; z-index: 2; background: rgb(0 0 0 / 76%); padding: 16px; backdrop-filter: blur(10px); }
    .choice-inner { max-width: 820px; margin: 0 auto; }
    .choice p { margin: 0 0 12px; font-size: 15px; font-weight: 650; }
    .choice-options, .end-actions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
    .choice-options { justify-content: flex-start; }
    button { appearance: none; border: 1px solid rgb(255 255 255 / 16%); border-radius: 8px; background: #f9fafb; color: #111827; min-height: 36px; padding: 0 12px; font: inherit; font-size: 14px; font-weight: 650; cursor: pointer; }
    button:hover { background: #e5e7eb; }
    .ghost { background: rgb(15 23 42 / 78%); color: #f9fafb; }
    .ghost:hover { background: rgb(30 41 59 / 92%); }
    .footer { display: flex; justify-content: space-between; gap: 16px; border-top: 1px solid rgb(255 255 255 / 12%); padding: 12px 16px; color: rgb(255 255 255 / 70%); font-size: 12px; }
    .footer strong { display: block; color: #fff; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .footer span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .hidden { display: none; }
  </style>
</head>
<body>
  <main id="player">
    <section class="stage">
      <video id="video" playsinline></video>
      <div id="startOverlay" class="overlay">
        <button id="startButton">开始 / Start</button>
      </div>
      <div id="topbar" class="topbar hidden">
        <button id="pauseButton" class="ghost">暂停 / Pause</button>
        <button id="exitButton" class="ghost">中途退出 / Exit</button>
      </div>
      <div id="choicePanel" class="choice hidden">
        <div class="choice-inner">
          <p id="choicePrompt"></p>
          <div id="choiceOptions" class="choice-options"></div>
        </div>
      </div>
      <div id="endOverlay" class="overlay hidden">
        <div>
          <p>分支已结束 / Branch ended</p>
          <div class="end-actions">
            <button id="restartButton">重新开始 / Restart</button>
            <button id="finalExitButton">退出预览 / Exit preview</button>
          </div>
        </div>
      </div>
    </section>
    <footer class="footer">
      <div>
        <strong id="segmentTitle">${title}</strong>
        <span id="assetTitle"></span>
      </div>
    </footer>
  </main>
  <script>
    const model = ${data};
    const player = document.getElementById("player");
    const video = document.getElementById("video");
    const startOverlay = document.getElementById("startOverlay");
    const endOverlay = document.getElementById("endOverlay");
    const choicePanel = document.getElementById("choicePanel");
    const choicePrompt = document.getElementById("choicePrompt");
    const choiceOptions = document.getElementById("choiceOptions");
    const topbar = document.getElementById("topbar");
    const pauseButton = document.getElementById("pauseButton");
    const segmentTitle = document.getElementById("segmentTitle");
    const assetTitle = document.getElementById("assetTitle");
    const segmentById = new Map(model.segments.map((segment) => [segment.id, segment]));
    let segmentId = model.startSegmentId;
    let pendingChoiceId = null;
    let choiceEvent = null;

    function currentSegment() {
      return segmentById.get(segmentId) || model.segments[0];
    }

    function videoEventFor(segment) {
      return segment?.timeline.find((event) => event.videoId);
    }

    function choiceFor(segment, choiceId) {
      return segment?.choices.find((choice) => choice.id === choiceId);
    }

    async function enterImmersiveMode() {
      try {
        if (!document.fullscreenElement) await player.requestFullscreen();
      } catch {}
      try {
        await screen.orientation.lock("landscape");
      } catch {}
    }

    async function exitImmersiveMode() {
      try {
        screen.orientation.unlock();
      } catch {}
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
      } catch {}
    }

    function renderSegment() {
      const segment = currentSegment();
      const videoEvent = videoEventFor(segment);
      const asset = videoEvent?.videoId ? model.assets[videoEvent.videoId] : null;
      choiceEvent = segment?.timeline.find((event) => event.choiceId) || null;
      pendingChoiceId = null;
      choicePanel.classList.add("hidden");
      endOverlay.classList.add("hidden");
      segmentTitle.textContent = segment?.title || model.title;
      assetTitle.textContent = asset?.name || "";
      if (!asset?.path) return;
      video.src = asset.path;
      video.load();
      video.play().catch(() => {});
    }

    async function startPlayback() {
      startOverlay.classList.add("hidden");
      topbar.classList.remove("hidden");
      pauseButton.textContent = "暂停 / Pause";
      await enterImmersiveMode();
      renderSegment();
    }

    async function exitPlayback() {
      video.pause();
      topbar.classList.add("hidden");
      choicePanel.classList.add("hidden");
      endOverlay.classList.add("hidden");
      startOverlay.classList.remove("hidden");
      pauseButton.textContent = "暂停 / Pause";
      await exitImmersiveMode();
    }

    function showChoice(choiceId) {
      const choice = choiceFor(currentSegment(), choiceId);
      if (!choice) return;
      pendingChoiceId = choiceId;
      video.pause();
      choicePrompt.textContent = choice.prompt || "";
      choiceOptions.replaceChildren();
      for (const option of choice.options) {
        const button = document.createElement("button");
        button.textContent = option.label;
        button.addEventListener("click", () => {
          if (!segmentById.has(option.next)) {
            showEnding();
            return;
          }
          segmentId = option.next;
          renderSegment();
        });
        choiceOptions.append(button);
      }
      choicePanel.classList.remove("hidden");
      pauseButton.textContent = "继续 / Resume";
    }

    function showEnding() {
      video.pause();
      topbar.classList.add("hidden");
      choicePanel.classList.add("hidden");
      endOverlay.classList.remove("hidden");
      exitImmersiveMode();
    }

    document.getElementById("startButton").addEventListener("click", startPlayback);
    document.getElementById("exitButton").addEventListener("click", exitPlayback);
    document.getElementById("finalExitButton").addEventListener("click", exitPlayback);
    document.getElementById("restartButton").addEventListener("click", () => {
      segmentId = model.startSegmentId;
      startPlayback();
    });
    pauseButton.addEventListener("click", () => {
      if (video.paused) {
        pauseButton.textContent = "暂停 / Pause";
        video.play().catch(() => {});
      } else {
        video.pause();
        pauseButton.textContent = "继续 / Resume";
      }
    });
    video.addEventListener("timeupdate", () => {
      if (!choiceEvent?.choiceId || pendingChoiceId) return;
      if (video.currentTime >= (choiceEvent.at || 0)) showChoice(choiceEvent.choiceId);
    });
    video.addEventListener("ended", () => {
      if (choiceEvent?.choiceId) showChoice(choiceEvent.choiceId);
      else showEnding();
    });
  </script>
</body>
</html>`;
}

export async function buildInteractiveVideoProjectZip(
  root: FileSystemDirectoryHandle
): Promise<Blob> {
  const model = await readInteractiveVideoPreviewFromDirectory(root);
  const entries = await listProjectFiles(root);
  const assetPaths = new Set(Object.values(model.assets).map((asset) => asset.path));
  const zipEntries: ZipEntry[] = [
    {
      path: "index.html",
      blob: new Blob([buildInteractiveVideoStandaloneHtml(model)], {
        type: "text/html; charset=utf-8",
      }),
    },
  ];

  for (const entry of entries) {
    if (entry.kind !== "file" || !assetPaths.has(entry.path)) continue;
    zipEntries.push({ path: entry.path, blob: await readFile(root, entry.path) });
  }

  return zipStore(zipEntries);
}

export async function exportInteractiveVideoProjectZip(
  root: FileSystemDirectoryHandle,
  title: string
): Promise<void> {
  const zip = await buildInteractiveVideoProjectZip(root);
  triggerDownload(zip, `${safeFilename(title)}-interactive-video.zip`);
}
