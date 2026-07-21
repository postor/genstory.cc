import type { CloudProviderId, CloudToken } from "./types";

export const GOOGLE_DRIVE_CLIENT_ID =
  "271171439504-vc4fhde8ei0736h7qlkfqcqdcbsh3d5l.apps.googleusercontent.com";
export const DROPBOX_APP_KEY = "rlwotrslri8sko6";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface CloudOAuthConfig {
  provider: CloudProviderId;
  clientId: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scope: string;
  authParams?: Record<string, string>;
}

export interface OAuthRequest {
  provider: CloudProviderId;
  state: string;
  verifier: string;
  redirectUri: string;
  rememberAuthorization: boolean;
}

export interface StoragePair {
  local?: StorageLike;
  session?: StorageLike;
}

export const CLOUD_OAUTH_CONFIG: Record<CloudProviderId, CloudOAuthConfig> = {
  "google-drive": {
    provider: "google-drive",
    clientId: GOOGLE_DRIVE_CLIENT_ID,
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    scope: "https://www.googleapis.com/auth/drive.file",
  },
  dropbox: {
    provider: "dropbox",
    clientId: DROPBOX_APP_KEY,
    authorizationEndpoint: "https://www.dropbox.com/oauth2/authorize",
    tokenEndpoint: "https://api.dropboxapi.com/oauth2/token",
    scope: "files.content.read files.content.write files.metadata.read",
    authParams: {
      token_access_type: "offline",
    },
  },
};

const REQUEST_KEY = "genstory:cloud-sync:oauth-request";
const TOKEN_PREFIX = "genstory:cloud-sync:token:";

function memoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
  };
}

function browserStorage(kind: "local" | "session"): StorageLike {
  if (typeof window === "undefined") return memoryStorage();
  return kind === "local" ? window.localStorage : window.sessionStorage;
}

function randomBase64Url(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function createPkce(): Promise<{ verifier: string; challenge: string; state: string }> {
  const verifier = randomBase64Url(32);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const bytes = new Uint8Array(digest);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const challenge = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return { verifier, challenge, state: randomBase64Url(16) };
}

export function getCloudRedirectUri(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/settings`;
}

export function buildAuthorizationUrl(
  config: CloudOAuthConfig,
  redirectUri: string,
  state: string,
  challenge: string
): string {
  const url = new URL(config.authorizationEndpoint);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", config.scope);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  for (const [key, value] of Object.entries(config.authParams ?? {})) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

export function saveOAuthRequest(
  request: OAuthRequest,
  storage: StorageLike = browserStorage("session")
): void {
  storage.setItem(REQUEST_KEY, JSON.stringify(request));
}

export function loadOAuthRequest(
  storage: StorageLike = browserStorage("session")
): OAuthRequest | null {
  try {
    const raw = storage.getItem(REQUEST_KEY);
    return raw ? (JSON.parse(raw) as OAuthRequest) : null;
  } catch {
    return null;
  }
}

export function clearOAuthRequest(
  storage: StorageLike = browserStorage("session")
): void {
  storage.removeItem(REQUEST_KEY);
}

export function saveCloudToken(
  provider: CloudProviderId,
  token: CloudToken,
  rememberAuthorization: boolean,
  stores?: StoragePair
): void {
  const local = stores?.local ?? browserStorage("local");
  const session = stores?.session ?? browserStorage("session");
  const target = rememberAuthorization ? local : session;
  const other = rememberAuthorization ? session : local;
  target.setItem(`${TOKEN_PREFIX}${provider}`, JSON.stringify(token));
  other.removeItem(`${TOKEN_PREFIX}${provider}`);
}

export function loadCloudToken(provider: CloudProviderId, stores?: StoragePair): CloudToken | null {
  const local = stores?.local ?? browserStorage("local");
  const session = stores?.session ?? browserStorage("session");
  for (const storage of [local, session]) {
    try {
      const raw = storage.getItem(`${TOKEN_PREFIX}${provider}`);
      if (raw) return JSON.parse(raw) as CloudToken;
    } catch {
      /* Try the other storage. */
    }
  }
  return null;
}

export function clearCloudToken(provider: CloudProviderId, stores?: StoragePair): void {
  (stores?.local ?? browserStorage("local")).removeItem(`${TOKEN_PREFIX}${provider}`);
  (stores?.session ?? browserStorage("session")).removeItem(`${TOKEN_PREFIX}${provider}`);
}

function normalizeToken(payload: Record<string, unknown>): CloudToken {
  if (typeof payload.access_token !== "string") {
    throw new Error("OAuth 响应缺少 access_token");
  }
  const expiresIn = typeof payload.expires_in === "number" ? payload.expires_in : undefined;
  return {
    accessToken: payload.access_token,
    expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : undefined,
    refreshToken:
      typeof payload.refresh_token === "string" ? payload.refresh_token : undefined,
  };
}

export async function exchangeOAuthCode(
  config: CloudOAuthConfig,
  request: OAuthRequest,
  code: string,
  fetchImpl: typeof fetch = fetch
): Promise<CloudToken> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: config.clientId,
    redirect_uri: request.redirectUri,
    code_verifier: request.verifier,
  });
  const response = await fetchImpl(config.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    throw new Error(`OAuth 令牌交换失败（${response.status}）`);
  }
  return normalizeToken((await response.json()) as Record<string, unknown>);
}

export async function refreshCloudToken(
  config: CloudOAuthConfig,
  refreshToken: string,
  fetchImpl: typeof fetch = fetch
): Promise<CloudToken> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.clientId,
  });
  const response = await fetchImpl(config.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    throw new Error(`OAuth 令牌刷新失败（${response.status}）`);
  }
  return normalizeToken((await response.json()) as Record<string, unknown>);
}

export async function getValidCloudToken(
  provider: CloudProviderId
): Promise<CloudToken> {
  const token = loadCloudToken(provider);
  if (!token) throw new Error("尚未连接云端存储");
  if (!token.expiresAt || token.expiresAt > Date.now() + 60_000) return token;
  if (!token.refreshToken) throw new Error("云端授权已过期，请重新连接");
  const refreshed = await refreshCloudToken(CLOUD_OAUTH_CONFIG[provider], token.refreshToken);
  saveCloudToken(provider, {
    ...refreshed,
    refreshToken: refreshed.refreshToken ?? token.refreshToken,
  }, Boolean(browserStorage("local").getItem(`${TOKEN_PREFIX}${provider}`)));
  return refreshed;
}

export async function beginCloudOAuth(
  provider: "dropbox",
  rememberAuthorization: boolean
): Promise<void> {
  const config = CLOUD_OAUTH_CONFIG[provider];
  if (!config.clientId) throw new Error("此云端尚未配置 OAuth client ID");
  const pkce = await createPkce();
  const redirectUri = getCloudRedirectUri();
  saveOAuthRequest({
    provider,
    state: pkce.state,
    verifier: pkce.verifier,
    redirectUri,
    rememberAuthorization,
  });
  window.location.assign(buildAuthorizationUrl(config, redirectUri, pkce.state, pkce.challenge));
}

export async function handleCloudOAuthCallback(): Promise<CloudProviderId | null> {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state) return null;
  const request = loadOAuthRequest();
  if (!request || request.state !== state || request.provider === "google-drive") {
    throw new Error("云端 OAuth state 校验失败");
  }
  const token = await exchangeOAuthCode(
    CLOUD_OAUTH_CONFIG[request.provider],
    request,
    code
  );
  saveCloudToken(request.provider, token, request.rememberAuthorization);
  clearOAuthRequest();
  window.history.replaceState({}, "", `${window.location.origin}/settings`);
  return request.provider;
}

interface GoogleTokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in?: number;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (options: {
            client_id: string;
            scope: string;
            callback: (response: GoogleTokenResponse) => void;
            error_callback?: (error: unknown) => void;
          }) => GoogleTokenClient;
        };
      };
    };
  }
}

let googleScriptPromise: Promise<void> | null = null;

function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("OAuth 只能在浏览器中运行"));
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;
  googleScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("无法加载 Google OAuth 组件"));
    document.head.appendChild(script);
  });
  return googleScriptPromise;
}

export async function requestGoogleToken(
  rememberAuthorization: boolean
): Promise<void> {
  const config = CLOUD_OAUTH_CONFIG["google-drive"];
  if (!config.clientId) throw new Error("Google Drive 尚未配置 OAuth client ID");
  await loadGoogleIdentityScript();
  await new Promise<void>((resolve, reject) => {
    const client = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: config.clientId,
      scope: config.scope,
      callback: (response) => {
        if (!response.access_token) {
          reject(new Error("Google OAuth 未返回 access token"));
          return;
        }
        saveCloudToken(
          "google-drive",
          {
            accessToken: response.access_token,
            expiresAt: response.expires_in
              ? Date.now() + response.expires_in * 1000
              : undefined,
          },
          rememberAuthorization
        );
        resolve();
      },
      error_callback: () => reject(new Error("Google OAuth 授权未完成")),
    });
    if (!client) {
      reject(new Error("Google OAuth 组件未就绪"));
      return;
    }
    client.requestAccessToken({
      prompt: loadCloudToken("google-drive") ? "" : "consent",
    });
  });
}
