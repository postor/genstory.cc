import type { ContentTypeId } from "../content-types";
import type { Lang } from "../i18n";

export type CloudProviderId = "google-drive" | "dropbox";

export interface CloudToken {
  accessToken: string;
  expiresAt?: number;
  refreshToken?: string;
}

export interface CloudSyncSettings {
  provider: CloudProviderId;
  rememberAuthorization: boolean;
}

export interface CloudRemoteFile {
  id: string;
  path: string;
  size?: number;
  mimeType?: string;
  modifiedAt?: string;
}

export interface CloudLocalFile {
  path: string;
  blob: Blob;
  projectId: string;
  projectTitle?: string;
}

export interface CloudProjectMetadata {
  id: string;
  template: ContentTypeId;
  title: string;
  lang: Lang;
  createdAt: number;
  updatedAt: number;
}

export type CloudSyncPhase =
  | "authorizing"
  | "listing"
  | "comparing"
  | "downloading"
  | "writing"
  | "uploading";

export interface CloudSyncProgress {
  phase: CloudSyncPhase;
  completed: number;
  total: number;
}

export interface CloudConflict {
  path: string;
  projectId: string;
  projectTitle: string;
  direction: "download-overwrites-local" | "upload-overwrites-remote";
}

export interface CloudDownloadPlan {
  remoteFiles: CloudRemoteFile[];
  remoteBlobs: Map<string, Blob>;
  localFiles: Map<string, CloudLocalFile>;
  conflicts: CloudConflict[];
  uploadConflicts: CloudConflict[];
}

export const DEFAULT_CLOUD_SYNC_SETTINGS: CloudSyncSettings = {
  provider: "google-drive",
  rememberAuthorization: false,
};

export const CLOUD_ROOT_NAME = "GenStory Workspace - Local Story Projects";

export const CLOUD_PROVIDER_LABELS: Record<CloudProviderId, { zh: string; en: string }> = {
  "google-drive": { zh: "Google Drive", en: "Google Drive" },
  dropbox: { zh: "Dropbox", en: "Dropbox" },
};
