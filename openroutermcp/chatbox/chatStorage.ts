import type { ChatTranscriptItem } from "./transcript.ts";
import { compactTranscriptForStorage } from "./transcript.ts";

const DB_NAME = "genstory-chatbox";
const DB_VERSION = 1;
const STORE = "entries";

interface ChatStorageEntry<T> {
  key: string;
  value: T;
  updatedAt: number;
}

function openChatStorageDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
}

function closeAfter<T>(db: IDBDatabase, promise: Promise<T>): Promise<T> {
  return promise.finally(() => db.close());
}

export async function saveChatStorageValue<T>(key: string, value: T): Promise<boolean> {
  const db = await openChatStorageDB();
  if (!db) return false;
  return closeAfter(
    db,
    new Promise<boolean>((resolve) => {
      const req = db
        .transaction(STORE, "readwrite")
        .objectStore(STORE)
        .put({ key, value, updatedAt: Date.now() } satisfies ChatStorageEntry<T>);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    })
  );
}

export async function loadChatStorageValue<T>(key: string): Promise<T | undefined> {
  const db = await openChatStorageDB();
  if (!db) return undefined;
  return closeAfter(
    db,
    new Promise<T | undefined>((resolve) => {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as ChatStorageEntry<T> | undefined)?.value);
      req.onerror = () => resolve(undefined);
    })
  );
}

export async function deleteChatStorageValue(key: string): Promise<void> {
  const db = await openChatStorageDB();
  if (!db) return;
  await closeAfter(
    db,
    new Promise<void>((resolve) => {
      const req = db.transaction(STORE, "readwrite").objectStore(STORE).delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    })
  );
}

function loadLegacyLocalStorageJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function removeLegacyLocalStorageValue(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore storage cleanup failures */
  }
}

function saveLegacyLocalStorageJSON(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* localStorage is only a best-effort fallback for unsupported browsers. */
  }
}

export async function loadStoredChatTranscript(key: string): Promise<ChatTranscriptItem[]> {
  const stored = await loadChatStorageValue<ChatTranscriptItem[]>(key);
  if (stored) return stored;

  const legacy = loadLegacyLocalStorageJSON<ChatTranscriptItem[]>(key, []);
  if (legacy.length > 0 && await saveChatStorageValue(key, legacy)) {
    removeLegacyLocalStorageValue(key);
  }
  return legacy;
}

export async function persistChatTranscript(
  key: string,
  transcript: ChatTranscriptItem[]
): Promise<void> {
  if (await saveChatStorageValue(key, transcript)) {
    removeLegacyLocalStorageValue(key);
    return;
  }
  saveLegacyLocalStorageJSON(key, compactTranscriptForStorage(transcript));
}

export async function loadStoredChatImages(key: string): Promise<Record<string, string>> {
  const stored = await loadChatStorageValue<Record<string, string>>(key);
  if (stored) return stored;

  const legacy = loadLegacyLocalStorageJSON<Record<string, string>>(key, {});
  if (Object.keys(legacy).length > 0 && await saveChatStorageValue(key, legacy)) {
    removeLegacyLocalStorageValue(key);
  }
  return legacy;
}

export async function persistChatImages(
  key: string,
  images: Record<string, string>
): Promise<void> {
  if (await saveChatStorageValue(key, images)) {
    removeLegacyLocalStorageValue(key);
    return;
  }
  saveLegacyLocalStorageJSON(key, images);
}
