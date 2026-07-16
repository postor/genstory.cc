import type { Lang } from "@/lib/i18n";
import type { ContentTypeId } from "@/lib/content-types";

export interface Project {
  id: string;
  template: ContentTypeId;
  title: string;
  /** Markdown body, seeded from the chosen template. */
  content: string;
  lang: Lang;
  createdAt: number;
  updatedAt: number;
}

const DB_NAME = "genstory";
const DB_VERSION = 1;
const STORE = "projects";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("当前环境不支持 IndexedDB"));
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

export async function listProjects(): Promise<Project[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = store(db, "readonly").getAll();
    req.onsuccess = () =>
      resolve(
        (req.result as Project[]).sort((a, b) => b.updatedAt - a.updatedAt)
      );
    req.onerror = () => reject(req.error);
  });
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = store(db, "readonly").get(id);
    req.onsuccess = () => resolve(req.result as Project | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function saveProject(project: Project): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = store(db, "readwrite").put(project);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = store(db, "readwrite").delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/** Export a project as a downloadable .json file (File API). */
export function downloadProject(project: Project): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.title || "project"}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Parse an imported project file (File API) into a Project. */
export async function readProjectFile(file: File): Promise<Project> {
  const text = await file.text();
  const data = JSON.parse(text) as Partial<Project>;
  if (!data.title || typeof data.content !== "string") {
    throw new Error("文件格式不正确：缺少 title 或 content");
  }
  const now = Date.now();
  return {
    id:
      typeof data.id === "string" && data.id ? data.id : crypto.randomUUID(),
    template: data.template ?? "book",
    title: data.title,
    content: data.content,
    lang: data.lang === "en" ? "en" : "zh",
    createdAt: data.createdAt ?? now,
    updatedAt: now,
  };
}
