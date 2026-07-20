import { CLOUD_ROOT_NAME, type CloudProviderId, type CloudRemoteFile } from "./types";
import { cloudPathSegments } from "./paths";
import { getValidCloudToken } from "./oauth";

export type TransferProgress = (percentage: number) => void;

export interface CloudRemoteStore {
  provider: CloudProviderId;
  listFiles(): Promise<CloudRemoteFile[]>;
  downloadFile(file: CloudRemoteFile, onProgress?: TransferProgress): Promise<Blob>;
  uploadFile(
    path: string,
    blob: Blob,
    existing?: CloudRemoteFile,
    onProgress?: TransferProgress
  ): Promise<void>;
}

async function responseError(response: Response, prefix: string): Promise<Error> {
  const text = await response.text().catch(() => "");
  return new Error(`${prefix}（${response.status}）${text ? `: ${text.slice(0, 240)}` : ""}`);
}

async function getAccessToken(provider: CloudProviderId): Promise<string> {
  return (await getValidCloudToken(provider)).accessToken;
}

async function apiJson<T>(
  provider: CloudProviderId,
  url: string,
  init: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken(provider);
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", "application/json");
  const response = await fetch(url, { ...init, headers });
  if (!response.ok) throw await responseError(response, "云端 API 请求失败");
  return (await response.json()) as T;
}

function xhrBinary(
  url: string,
  method: "GET" | "PUT" | "PATCH" | "POST",
  headers: Record<string, string>,
  body: Blob | null,
  responseType: XMLHttpRequestResponseType,
  onProgress?: TransferProgress
): Promise<Blob | void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(method, url);
    request.responseType = responseType;
    for (const [key, value] of Object.entries(headers)) request.setRequestHeader(key, value);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve(responseType === "blob" ? (request.response as Blob) : undefined);
      } else {
        reject(new Error(`云端文件请求失败（${request.status}）`));
      }
    };
    request.onerror = () => reject(new Error("无法连接云端存储，请检查网络和应用权限"));
    request.onabort = () => reject(new Error("云端文件请求已取消"));
    request.send(body);
  });
}

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  md5Checksum?: string;
}

class GoogleDriveStore implements CloudRemoteStore {
  provider = "google-drive" as const;
  private rootId: string | null = null;
  private folderCache = new Map<string, string>();

  private async ensureRoot(): Promise<string> {
    if (this.rootId) return this.rootId;
    const query = encodeURIComponent(
      `'root' in parents and name = '${CLOUD_ROOT_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    );
    const result = await apiJson<{ files?: GoogleDriveFile[] }>(
      this.provider,
      `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive&fields=files(id,name,mimeType)`
    );
    const existing = result.files?.[0];
    if (existing) {
      this.rootId = existing.id;
      return existing.id;
    }
    const created = await apiJson<GoogleDriveFile>(
      this.provider,
      "https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: CLOUD_ROOT_NAME,
          mimeType: "application/vnd.google-apps.folder",
          parents: ["root"],
        }),
      }
    );
    this.rootId = created.id;
    return created.id;
  }

  private async listChildren(parentId: string): Promise<GoogleDriveFile[]> {
    const files: GoogleDriveFile[] = [];
    let pageToken = "";
    do {
      const params = new URLSearchParams({
        q: `'${parentId}' in parents and trashed = false`,
        spaces: "drive",
        fields: "nextPageToken,files(id,name,mimeType,size,modifiedTime,md5Checksum)",
        pageSize: "1000",
      });
      if (pageToken) params.set("pageToken", pageToken);
      const result = await apiJson<{ files?: GoogleDriveFile[]; nextPageToken?: string }>(
        this.provider,
        `https://www.googleapis.com/drive/v3/files?${params.toString()}`
      );
      files.push(...(result.files ?? []));
      pageToken = result.nextPageToken ?? "";
    } while (pageToken);
    return files;
  }

  async listFiles(): Promise<CloudRemoteFile[]> {
    const root = await this.ensureRoot();
    const remote: CloudRemoteFile[] = [];
    const visit = async (parentId: string, prefix: string) => {
      for (const child of await this.listChildren(parentId)) {
        const path = prefix ? `${prefix}/${child.name}` : child.name;
        if (child.mimeType === "application/vnd.google-apps.folder") {
          await visit(child.id, path);
        } else {
          remote.push({
            id: child.id,
            path,
            size: child.size ? Number(child.size) : undefined,
            mimeType: child.mimeType,
            modifiedAt: child.modifiedTime,
          });
        }
      }
    };
    await visit(root, "");
    return remote;
  }

  private async ensureFolderPath(path: string): Promise<string> {
    let parentId = await this.ensureRoot();
    const segments = path ? cloudPathSegments(path) : [];
    let prefix = "";
    for (const segment of segments) {
      prefix = prefix ? `${prefix}/${segment}` : segment;
      const cached = this.folderCache.get(prefix);
      if (cached) {
        parentId = cached;
        continue;
      }
      const existing = (await this.listChildren(parentId)).find(
        (file) =>
          file.name === segment &&
          file.mimeType === "application/vnd.google-apps.folder"
      );
      const folder =
        existing ??
        (await apiJson<GoogleDriveFile>(
          this.provider,
          "https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: segment,
              mimeType: "application/vnd.google-apps.folder",
              parents: [parentId],
            }),
          }
        ));
      parentId = folder.id;
      this.folderCache.set(prefix, parentId);
    }
    return parentId;
  }

  async downloadFile(file: CloudRemoteFile, onProgress?: TransferProgress): Promise<Blob> {
    const token = await getAccessToken(this.provider);
    const response = await xhrBinary(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`,
      "GET",
      { Authorization: `Bearer ${token}` },
      null,
      "blob",
      onProgress
    );
    return response as Blob;
  }

  async uploadFile(
    path: string,
    blob: Blob,
    existing?: CloudRemoteFile,
    onProgress?: TransferProgress
  ): Promise<void> {
    const segments = cloudPathSegments(path);
    const filename = segments.pop();
    if (!filename) throw new Error(`云端文件路径无效：${path}`);
    const parentId = await this.ensureFolderPath(segments.join("/"));
    let fileId = existing?.id;
    if (!fileId) {
      const created = await apiJson<GoogleDriveFile>(
        this.provider,
        "https://www.googleapis.com/drive/v3/files?fields=id",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: filename,
            parents: [parentId],
            mimeType: blob.type || "application/octet-stream",
          }),
        }
      );
      fileId = created.id;
    }
    const token = await getAccessToken(this.provider);
    await xhrBinary(
      `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media`,
      "PATCH",
      {
        Authorization: `Bearer ${token}`,
        "Content-Type": blob.type || "application/octet-stream",
      },
      blob,
      "text",
      onProgress
    );
  }
}

interface OneDriveItem {
  id: string;
  name: string;
  size?: number;
  file?: { mimeType?: string; hashes?: Record<string, string> };
  folder?: { childCount?: number };
  lastModifiedDateTime?: string;
  "@microsoft.graph.downloadUrl"?: string;
}

class OneDriveStore implements CloudRemoteStore {
  provider = "one-drive" as const;
  private rootId: string | null = null;
  private folderCache = new Map<string, string>();

  private async ensureRoot(): Promise<string> {
    if (this.rootId) return this.rootId;
    const item = await apiJson<OneDriveItem>(
      this.provider,
      "https://graph.microsoft.com/v1.0/me/drive/special/approot"
    );
    this.rootId = item.id;
    return item.id;
  }

  private async listChildren(parentId: string): Promise<OneDriveItem[]> {
    const items: OneDriveItem[] = [];
    let url =
      `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(parentId)}/children` +
      "?$select=id,name,file,folder,size,lastModifiedDateTime,@microsoft.graph.downloadUrl&$top=200";
    while (url) {
      const result = await apiJson<{ value?: OneDriveItem[]; "@odata.nextLink"?: string }>(
        this.provider,
        url
      );
      items.push(...(result.value ?? []));
      url = result["@odata.nextLink"] ?? "";
    }
    return items;
  }

  async listFiles(): Promise<CloudRemoteFile[]> {
    const root = await this.ensureRoot();
    const remote: CloudRemoteFile[] = [];
    const visit = async (parentId: string, prefix: string) => {
      for (const child of await this.listChildren(parentId)) {
        const path = prefix ? `${prefix}/${child.name}` : child.name;
        if (child.folder) {
          await visit(child.id, path);
        } else if (child.file) {
          remote.push({
            id: child.id,
            path,
            size: child.size,
            mimeType: child.file.mimeType,
            modifiedAt: child.lastModifiedDateTime,
          });
        }
      }
    };
    await visit(root, "");
    return remote;
  }

  private async ensureFolderPath(path: string): Promise<string> {
    let parentId = await this.ensureRoot();
    let prefix = "";
    for (const segment of path ? cloudPathSegments(path) : []) {
      prefix = prefix ? `${prefix}/${segment}` : segment;
      const cached = this.folderCache.get(prefix);
      if (cached) {
        parentId = cached;
        continue;
      }
      const existing = (await this.listChildren(parentId)).find(
        (item) => item.folder && item.name === segment
      );
      const folder =
        existing ??
        (await apiJson<OneDriveItem>(
          this.provider,
          `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(parentId)}/children`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: segment,
              folder: {},
              "@microsoft.graph.conflictBehavior": "fail",
            }),
          }
        ));
      parentId = folder.id;
      this.folderCache.set(prefix, parentId);
    }
    return parentId;
  }

  async downloadFile(file: CloudRemoteFile, onProgress?: TransferProgress): Promise<Blob> {
    const token = await getAccessToken(this.provider);
    const response = await xhrBinary(
      `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(file.id)}/content`,
      "GET",
      { Authorization: `Bearer ${token}` },
      null,
      "blob",
      onProgress
    );
    return response as Blob;
  }

  async uploadFile(
    path: string,
    blob: Blob,
    existing?: CloudRemoteFile,
    onProgress?: TransferProgress
  ): Promise<void> {
    const segments = cloudPathSegments(path);
    const filename = segments.pop();
    if (!filename) throw new Error(`云端文件路径无效：${path}`);
    const parentId = await this.ensureFolderPath(segments.join("/"));
    const token = await getAccessToken(this.provider);
    const url = existing?.id
      ? `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(existing.id)}/content`
      : `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(parentId)}:/${encodeURIComponent(filename)}:/content`;
    await xhrBinary(
      url,
      "PUT",
      {
        Authorization: `Bearer ${token}`,
        "Content-Type": blob.type || "application/octet-stream",
      },
      blob,
      "text",
      onProgress
    );
  }
}

interface DropboxEntry {
  ".tag": "file" | "folder";
  id?: string;
  name: string;
  path_display: string;
  size?: number;
  server_modified?: string;
}

class DropboxStore implements CloudRemoteStore {
  provider = "dropbox" as const;
  private rootPath: string | null = null;
  private folders = new Set<string>();

  private async ensureRoot(): Promise<string> {
    if (this.rootPath) return this.rootPath;
    const listing = await apiJson<{ entries?: DropboxEntry[] }>(
      this.provider,
      "https://api.dropboxapi.com/2/files/list_folder",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "", recursive: false, limit: 2000 }),
      }
    );
    const existing = listing.entries?.find(
      (entry) => entry[".tag"] === "folder" && entry.name === CLOUD_ROOT_NAME
    );
    if (existing) {
      this.rootPath = existing.path_display;
      return existing.path_display;
    }
    const created = await apiJson<{ metadata?: DropboxEntry }>(
      this.provider,
      "https://api.dropboxapi.com/2/files/create_folder_v2",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: `/${CLOUD_ROOT_NAME}`, autorename: false }),
      }
    );
    this.rootPath = created.metadata?.path_display ?? `/${CLOUD_ROOT_NAME}`;
    this.folders.add("");
    return this.rootPath;
  }

  async listFiles(): Promise<CloudRemoteFile[]> {
    const root = await this.ensureRoot();
    const remote: CloudRemoteFile[] = [];
    let result = await apiJson<{ entries?: DropboxEntry[]; has_more?: boolean; cursor?: string }>(
      this.provider,
      "https://api.dropboxapi.com/2/files/list_folder",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: root, recursive: true, limit: 2000 }),
      }
    );
    const consume = (entries: DropboxEntry[] | undefined) => {
      for (const entry of entries ?? []) {
        if (entry[".tag"] !== "file") continue;
        const prefix = `${root}/`;
        if (!entry.path_display.startsWith(prefix)) continue;
        remote.push({
          id: entry.id ?? entry.path_display,
          path: entry.path_display.slice(prefix.length),
          size: entry.size,
          modifiedAt: entry.server_modified,
        });
      }
    };
    consume(result.entries);
    while (result.has_more && result.cursor) {
      result = await apiJson<{ entries?: DropboxEntry[]; has_more?: boolean; cursor?: string }>(
        this.provider,
        "https://api.dropboxapi.com/2/files/list_folder/continue",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cursor: result.cursor }),
        }
      );
      consume(result.entries);
    }
    return remote;
  }

  private async ensureFolderPath(path: string): Promise<string> {
    const root = await this.ensureRoot();
    let current = root;
    let prefix = "";
    for (const segment of path ? cloudPathSegments(path) : []) {
      prefix = prefix ? `${prefix}/${segment}` : segment;
      current = `${current}/${segment}`;
      if (this.folders.has(prefix)) continue;
      const response = await fetch("https://api.dropboxapi.com/2/files/create_folder_v2", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await getAccessToken(this.provider)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path: current, autorename: false }),
      });
      if (!response.ok && response.status !== 409) {
        throw await responseError(response, "Dropbox 创建目录失败");
      }
      this.folders.add(prefix);
    }
    return current;
  }

  async downloadFile(file: CloudRemoteFile, onProgress?: TransferProgress): Promise<Blob> {
    const root = await this.ensureRoot();
    const token = await getAccessToken(this.provider);
    const fullPath = `${root}/${file.path}`;
    const response = await xhrBinary(
      "https://content.dropboxapi.com/2/files/download",
      "POST",
      {
        Authorization: `Bearer ${token}`,
        "Dropbox-API-Arg": JSON.stringify({ path: fullPath }),
      },
      null,
      "blob",
      onProgress
    );
    return response as Blob;
  }

  async uploadFile(
    path: string,
    blob: Blob,
    _existing?: CloudRemoteFile,
    onProgress?: TransferProgress
  ): Promise<void> {
    const root = await this.ensureRoot();
    const segments = cloudPathSegments(path);
    const filename = segments.pop();
    if (!filename) throw new Error(`云端文件路径无效：${path}`);
    const parent = await this.ensureFolderPath(segments.join("/"));
    const token = await getAccessToken(this.provider);
    await xhrBinary(
      "https://content.dropboxapi.com/2/files/upload",
      "POST",
      {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/octet-stream",
        "Dropbox-API-Arg": JSON.stringify({
          path: `${parent}/${filename}`,
          mode: "overwrite",
          autorename: false,
          mute: true,
        }),
      },
      blob,
      "text",
      onProgress
    );
    void root;
  }
}

export function createCloudRemoteStore(provider: CloudProviderId): CloudRemoteStore {
  if (provider === "google-drive") return new GoogleDriveStore();
  if (provider === "one-drive") return new OneDriveStore();
  return new DropboxStore();
}
