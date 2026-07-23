export interface OpenAICompatibleSettings {
  baseUrl: string;
  apiKey: string;
}

export const DEFAULT_OPENAI_COMPATIBLE_SETTINGS: OpenAICompatibleSettings = {
  baseUrl: "",
  apiKey: "",
};

const STORAGE_KEY = "genstory:openai-compatible:settings";

export function normalizeOpenAICompatibleSettings(
  settings: Partial<OpenAICompatibleSettings>
): OpenAICompatibleSettings {
  return {
    baseUrl:
      typeof settings.baseUrl === "string"
        ? settings.baseUrl.trim().replace(/\/+$/, "")
        : "",
    apiKey: typeof settings.apiKey === "string" ? settings.apiKey.trim() : "",
  };
}

export function isOpenAICompatibleConfigured(
  settings: OpenAICompatibleSettings
): boolean {
  return Boolean(settings.baseUrl && settings.apiKey);
}

export function loadOpenAICompatibleSettings(): OpenAICompatibleSettings {
  if (typeof window === "undefined") {
    return { ...DEFAULT_OPENAI_COMPATIBLE_SETTINGS };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_OPENAI_COMPATIBLE_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<OpenAICompatibleSettings>;
    return normalizeOpenAICompatibleSettings(parsed);
  } catch {
    return { ...DEFAULT_OPENAI_COMPATIBLE_SETTINGS };
  }
}

export function saveOpenAICompatibleSettings(
  settings: OpenAICompatibleSettings
): void {
  if (typeof window === "undefined") return;
  const normalized = normalizeOpenAICompatibleSettings(settings);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}
