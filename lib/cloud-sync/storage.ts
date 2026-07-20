import {
  DEFAULT_CLOUD_SYNC_SETTINGS,
  type CloudProviderId,
  type CloudSyncSettings,
} from "./types";

const SETTINGS_KEY = "genstory:cloud-sync:settings";

export function loadCloudSyncSettings(): CloudSyncSettings {
  if (typeof window === "undefined") return { ...DEFAULT_CLOUD_SYNC_SETTINGS };
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_CLOUD_SYNC_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<CloudSyncSettings>;
    const providers: CloudProviderId[] = ["google-drive", "one-drive", "dropbox"];
    return {
      provider: providers.includes(parsed.provider as CloudProviderId)
        ? (parsed.provider as CloudProviderId)
        : DEFAULT_CLOUD_SYNC_SETTINGS.provider,
      rememberAuthorization: parsed.rememberAuthorization === true,
    };
  } catch {
    return { ...DEFAULT_CLOUD_SYNC_SETTINGS };
  }
}

export function saveCloudSyncSettings(settings: CloudSyncSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
