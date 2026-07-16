// Minimal browser MCP (Streamable HTTP) client + OAuth 2.1 (PKCE) helpers.
// Pure client-side: no backend, no Node APIs. The secret (access/refresh token)
// is persisted via an injectable StorageLike backend (defaults to localStorage).
//
// NOTE: tokens in any web-readable storage are exposed to XSS; handle secrets
// accordingly and avoid shipping them to untrusted surfaces.

export interface OAuthTokens {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  expires_at?: number;
  refresh_token?: string;
  scope?: string;
}

export interface AuthServerMetadata {
  issuer: string;
  authorization_endpoint?: string;
  token_endpoint: string;
  registration_endpoint?: string;
  scopes_supported?: string[];
}

export interface Tool {
  name: string;
  description?: string;
  inputSchema?: unknown;
}

// A minimal subset of the Web Storage API so callers can inject a custom
// backend (localStorage, sessionStorage, an in-memory map, etc.). Keys are
// relative; prefixing is the caller's responsibility via a wrapping adapter.
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const LS_TOKENS = "tokens";
const LS_PKCE = "pkce";
const LS_CTX = "ctx";

// SSR-safe default: only touched when actually called (client-side).
function defaultStorage(): StorageLike {
  return typeof window !== "undefined" ? window.localStorage : memoryStorage();
}

function memoryStorage(): StorageLike {
  const m = new Map<string, string>();
  return {
    getItem: (k) => (m.has(k) ? (m.get(k) as string) : null),
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
}

/* ----------------------------- token storage ---------------------------- */

export function loadTokens(storage: StorageLike = defaultStorage()): OAuthTokens | null {
  try {
    const raw = storage.getItem(LS_TOKENS);
    return raw ? (JSON.parse(raw) as OAuthTokens) : null;
  } catch {
    return null;
  }
}

export function saveTokens(t: OAuthTokens, storage: StorageLike = defaultStorage()): void {
  storage.setItem(LS_TOKENS, JSON.stringify(t));
}

export function clearAuth(storage: StorageLike = defaultStorage()): void {
  storage.removeItem(LS_TOKENS);
  storage.removeItem(LS_PKCE);
  storage.removeItem(LS_CTX);
}

/* ------------------------------- crypto/PKCE ------------------------------ */

function bufToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randBase64Url(len: number): string {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  let str = "";
  for (const b of arr) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sha256Base64Url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bufToBase64Url(digest);
}

export interface Pkce {
  verifier: string;
  challenge: string;
  state: string;
}

export async function createPkce(): Promise<Pkce> {
  const verifier = randBase64Url(32);
  const challenge = await sha256Base64Url(verifier);
  const state = randBase64Url(16);
  return { verifier, challenge, state };
}

export function savePkce(p: Pkce, storage: StorageLike = defaultStorage()): void {
  storage.setItem(LS_PKCE, JSON.stringify(p));
}

export function loadPkce(storage: StorageLike = defaultStorage()): Pkce | null {
  try {
    const raw = storage.getItem(LS_PKCE);
    return raw ? (JSON.parse(raw) as Pkce) : null;
  } catch {
    return null;
  }
}

export interface AuthContext {
  client_id: string;
  authorization_endpoint: string;
  token_endpoint: string;
  redirect_uri: string;
}

export function saveAuthContext(c: AuthContext, storage: StorageLike = defaultStorage()): void {
  storage.setItem(LS_CTX, JSON.stringify(c));
}

export function loadAuthContext(storage: StorageLike = defaultStorage()): AuthContext | null {
  try {
    const raw = storage.getItem(LS_CTX);
    return raw ? (JSON.parse(raw) as AuthContext) : null;
  } catch {
    return null;
  }
}

/* --------------------------- metadata discovery --------------------------- */

function parseWwwAuthenticate(header: string | null): string | null {
  if (!header) return null;
  const m = header.match(/resource_metadata="([^"]+)"/);
  return m ? m[1] : null;
}

// Discovers the authorization server, following the MCP auth spec:
// 401 -> WWW-Authenticate: Bearer resource_metadata=... -> protected resource
// metadata -> authorization_servers[0] -> authorization server metadata.
export async function discoverAuthServer(
  baseUrl: string,
  wwwAuthenticate: string | null
): Promise<AuthServerMetadata> {
  let resourceMetaUrl = parseWwwAuthenticate(wwwAuthenticate);
  if (!resourceMetaUrl) {
    resourceMetaUrl = baseUrl.replace(/\/$/, "") + "/.well-known/oauth-protected-resource";
  }
  const resMeta = await fetch(resourceMetaUrl, { headers: { Accept: "application/json" } });
  if (!resMeta.ok) {
    throw new Error(`受保护资源元数据请求失败: ${resMeta.status}`);
  }
  const resJson = await resMeta.json();
  const asUrl: string | undefined = resJson.authorization_servers?.[0];
  if (!asUrl) throw new Error("受保护资源元数据中缺少 authorization_servers");

  const asDocUrls = [
    asUrl.replace(/\/$/, "") + "/.well-known/oauth-authorization-server",
    asUrl,
  ];
  let asJson: Record<string, unknown> | null = null;
  for (const u of asDocUrls) {
    const r = await fetch(u, { headers: { Accept: "application/json" } });
    if (r.ok) {
      asJson = (await r.json()) as Record<string, unknown>;
      break;
    }
  }
  if (!asJson) throw new Error("无法获取授权服务器元数据 (authorization server metadata)");
  return {
    issuer: (asJson.issuer as string) || asUrl,
    authorization_endpoint: asJson.authorization_endpoint as string | undefined,
    token_endpoint: asJson.token_endpoint as string,
    registration_endpoint: asJson.registration_endpoint as string | undefined,
    scopes_supported: asJson.scopes_supported as string[] | undefined,
  };
}

export async function registerClient(
  as: AuthServerMetadata,
  redirectUri: string
): Promise<string> {
  if (!as.registration_endpoint) {
    throw new Error("授权服务器不支持动态客户端注册 (registration_endpoint 缺失)");
  }
  const body = {
    client_name: "genstory-ssg-mcp-test",
    redirect_uris: [redirectUri],
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
  };
  const r = await fetch(as.registration_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`动态客户端注册失败: ${r.status} ${t}`);
  }
  const j = (await r.json()) as { client_id?: string };
  if (!j.client_id) throw new Error("注册响应缺少 client_id");
  return j.client_id;
}

export function buildAuthUrl(
  as: AuthServerMetadata,
  clientId: string,
  redirectUri: string,
  state: string,
  challenge: string,
  scope?: string
): string {
  if (!as.authorization_endpoint) throw new Error("授权服务器缺少 authorization_endpoint");
  const u = new URL(as.authorization_endpoint);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", clientId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("code_challenge", challenge);
  u.searchParams.set("code_challenge_method", "S256");
  u.searchParams.set("state", state);
  if (scope) u.searchParams.set("scope", scope);
  return u.toString();
}

export async function exchangeCode(
  tokenEndpoint: string,
  clientId: string,
  redirectUri: string,
  code: string,
  verifier: string
): Promise<OAuthTokens> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: verifier,
  });
  const r = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`令牌交换失败: ${r.status} ${t}`);
  }
  return normalizeTokens((await r.json()) as Record<string, unknown>);
}

export async function refreshAccessToken(
  tokenEndpoint: string,
  clientId: string,
  refreshToken: string
): Promise<OAuthTokens> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
  });
  const r = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`令牌刷新失败: ${r.status} ${t}`);
  }
  return normalizeTokens((await r.json()) as Record<string, unknown>);
}

function normalizeTokens(j: Record<string, unknown>): OAuthTokens {
  const expiresIn = typeof j.expires_in === "number" ? j.expires_in : undefined;
  return {
    access_token: j.access_token as string,
    token_type: j.token_type as string | undefined,
    expires_in: expiresIn,
    expires_at: expiresIn ? Date.now() + expiresIn * 1000 : undefined,
    refresh_token: j.refresh_token as string | undefined,
    scope: j.scope as string | undefined,
  };
}

/* --------------------------- MCP Streamable HTTP --------------------------- */

export class UnauthorizedError extends Error {
  wwwAuthenticate: string | null;
  constructor(wwwAuthenticate: string | null) {
    super("Unauthorized");
    this.name = "UnauthorizedError";
    this.wwwAuthenticate = wwwAuthenticate;
  }
}

export class McpHttpClient {
  baseUrl: string;
  sessionId: string | null = null;
  private getToken: () => Promise<string | null>;
  private idCounter = 0;

  constructor(baseUrl: string, getToken: () => Promise<string | null>) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.getToken = getToken;
  }

  private async rpc(method: string, params: unknown): Promise<unknown> {
    const id = ++this.idCounter;
    const token = await this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (this.sessionId) headers["Mcp-Session-Id"] = this.sessionId;

    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
    });

    if (res.status === 401) {
      throw new UnauthorizedError(res.headers.get("www-authenticate"));
    }
    const sid = res.headers.get("mcp-session-id");
    if (sid) this.sessionId = sid;
    if (res.status === 202) return null; // notification accepted, no body
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`MCP 请求失败 (${res.status}): ${text.slice(0, 500)}`);
    }

    const ct = res.headers.get("content-type") || "";
    let raw = "";
    if (ct.includes("text/event-stream")) {
      raw = pickJsonRpcData(await res.text(), id);
    } else {
      raw = await res.text();
    }
    if (!raw) return null;
    const msg = JSON.parse(raw) as { result?: unknown; error?: { code: number; message: string } };
    if (msg.error) throw new Error(`MCP error ${msg.error.code}: ${msg.error.message}`);
    return msg.result;
  }

  async initialize(): Promise<unknown> {
    const result = await this.rpc("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "genstory-ssg-test", version: "0.1.0" },
    });
    await this.notify("notifications/initialized", {});
    return result;
  }

  private async notify(method: string, params: unknown): Promise<void> {
    const token = await this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (this.sessionId) headers["Mcp-Session-Id"] = this.sessionId;
    await fetch(this.baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ jsonrpc: "2.0", method, params }),
    });
  }

  async listTools(): Promise<Tool[]> {
    const result = (await this.rpc("tools/list", {})) as { tools?: Tool[] } | null;
    return result?.tools || [];
  }

  async callTool(name: string, args: unknown): Promise<unknown> {
    return this.rpc("tools/call", { name, arguments: args });
  }
}

// Extracts the JSON-RPC response message matching `id` from an SSE body.
function pickJsonRpcData(sse: string, id: number): string {
  const lines = sse.split("\n");
  const blocks: string[] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (line.startsWith("data:")) {
      current.push(line.slice(5).trim());
    } else if (line.trim() === "" && current.length) {
      blocks.push(current.join("\n"));
      current = [];
    }
  }
  if (current.length) blocks.push(current.join("\n"));

  for (const d of blocks) {
    try {
      const obj = JSON.parse(d) as { id?: number; result?: unknown; error?: unknown };
      if (obj.id === id && (obj.result !== undefined || obj.error !== undefined)) return d;
    } catch {
      /* skip non-JSON data lines */
    }
  }
  for (const d of blocks) {
    try {
      JSON.parse(d);
      return d;
    } catch {
      /* skip */
    }
  }
  return "";
}
