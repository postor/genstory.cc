import type { Lang } from "@/lib/i18n";
import type { ContentTypeId } from "@/lib/content-types";

export interface Project {
  id: string;
  template: ContentTypeId;
  title: string;
  lang: Lang;
  createdAt: number;
  updatedAt: number;
  lastOpenedPath?: string;
}

const DB_NAME = "genstory";
const DB_VERSION = 3;
const STORE = "projects";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("当前浏览器不支持保存作品，请换用现代桌面浏览器"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function store(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
  return db.transaction(STORE, mode).objectStore(STORE);
}

function closeAfter<T>(db: IDBDatabase, promise: Promise<T>): Promise<T> {
  return promise.finally(() => db.close());
}

export function listProjects(): Promise<Project[]> {
  return openDB().then((db) =>
    closeAfter(
      db,
      new Promise((resolve, reject) => {
        const req = store(db, "readonly").getAll();
        req.onsuccess = () =>
          resolve(
            (req.result as Project[]).sort((a, b) => b.updatedAt - a.updatedAt)
          );
        req.onerror = () => reject(req.error);
      })
    )
  );
}

export function getProject(id: string): Promise<Project | undefined> {
  return openDB().then((db) =>
    closeAfter(
      db,
      new Promise((resolve, reject) => {
        const req = store(db, "readonly").get(id);
        req.onsuccess = () => resolve(req.result as Project | undefined);
        req.onerror = () => reject(req.error);
      })
    )
  );
}

export function saveProject(project: Project): Promise<void> {
  return openDB().then((db) =>
    closeAfter(
      db,
      new Promise((resolve, reject) => {
        const req = store(db, "readwrite").put(project);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      })
    )
  );
}

export function updateProjectState(
  id: string,
  patch: Partial<Pick<Project, "updatedAt" | "lastOpenedPath">>
): Promise<void> {
  return getProject(id).then((project) => {
    if (!project) return;
    return saveProject({ ...project, ...patch });
  });
}

export function deleteProject(id: string): Promise<void> {
  return openDB().then((db) =>
    closeAfter(
      db,
      new Promise((resolve, reject) => {
        const req = store(db, "readwrite").delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      })
    )
  );
}
