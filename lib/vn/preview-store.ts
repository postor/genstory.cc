/** Shared IndexedDB slot for the live preview game files (main thread ↔ SW). */
const DB_NAME = "webgal-preview";
const STORE = "game";
export const PREVIEW_KEY = "current";

export async function savePreviewGame(map: Record<string, Blob>): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(map, PREVIEW_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
}
