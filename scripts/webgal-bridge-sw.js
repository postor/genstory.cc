/* Bridge Service Worker for genstory.cc VN preview.
 * Served at /webgal/webgal-serviceworker.js (the path OpenWebGal registers).
 * Keeps the engine's original build-asset caching, and additionally serves
 * /webgal/game/* from the live preview slot in IndexedDB (written by the
 * preview page). Does NOT touch a disk-deployed game (see lib/vn/export.ts). */
const CACHE_PREFIX = "webgal-";
const CACHE_NAME = "webgal-build-assets-v1";
const LOG_PREFIX = "[WebGAL SW]";
const HASHED_BUILD_ASSET_RE =
  /(^|\/)assets\/[^/?#]+-[A-Za-z0-9_-]{8,}\.(?:js|css|ttf|woff|woff2)$/;
const loggedKeys = new Set();

function logOnce(key, ...args) {
  if (loggedKeys.has(key)) return;
  loggedKeys.add(key);
  console.log(LOG_PREFIX, ...args);
}

self.addEventListener("install", (event) => {
  logOnce("install", `install ${CACHE_NAME}`);
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  logOnce("activate", `activate ${CACHE_NAME}`);
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

function isHashedBuildAssetRequest(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  return HASHED_BUILD_ASSET_RE.test(url.pathname);
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) {
    logOnce(`hit:${request.url}`, "cache hit:", new URL(request.url).pathname);
    return cached;
  }
  const response = await fetch(request);
  if (response.ok && response.status === 200) {
    await cache.put(request, response.clone());
    logOnce(`cache:${request.url}`, "cached:", new URL(request.url).pathname);
  }
  return response;
}

// ---- Preview bridge ----
const GAME_RE = /\/game(\/|$)/;
const PREVIEW_DB = "webgal-preview";
const PREVIEW_STORE = "game";
const PREVIEW_KEY = "current";

function getGameMap() {
  return new Promise((resolve) => {
    const req = indexedDB.open(PREVIEW_DB, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(PREVIEW_STORE);
    };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction(PREVIEW_STORE, "readonly");
      const get = tx.objectStore(PREVIEW_STORE).get(PREVIEW_KEY);
      get.onsuccess = () => resolve(get.result || null);
      get.onerror = () => resolve(null);
    };
    req.onerror = () => resolve(null);
  });
}

function contentType(p) {
  if (p.endsWith(".txt")) return "text/plain; charset=utf-8";
  if (p.endsWith(".css")) return "text/css; charset=utf-8";
  if (p.endsWith(".json")) return "application/json";
  if (p.endsWith(".png")) return "image/png";
  if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
  if (p.endsWith(".webp")) return "image/webp";
  if (p.endsWith(".gif")) return "image/gif";
  if (p.endsWith(".mp3")) return "audio/mpeg";
  if (p.endsWith(".wav")) return "audio/wav";
  return "application/octet-stream";
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (GAME_RE.test(url.pathname)) {
    event.respondWith(
      (async () => {
        const map = await getGameMap();
        if (map) {
          const idx = url.pathname.indexOf("/game/");
          let rel = idx >= 0 ? url.pathname.slice(idx + 6) : url.pathname;
          rel = rel.replace(/^\/+/, "");
          const blob = map[rel] || map[`/${rel}`];
          if (blob) {
            return new Response(blob, {
              headers: { "Content-Type": contentType(rel) },
            });
          }
        }
        return new Response("Not found", { status: 404 });
      })()
    );
    return;
  }

  if (isHashedBuildAssetRequest(request)) {
    event.respondWith(cacheFirst(request).catch(() => fetch(request)));
  }
});
