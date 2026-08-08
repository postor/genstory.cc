"use client";

// React context provider that wraps a browser-direct connection to the
// OpenRouter MCP server (https://mcp.openrouter.ai/mcp) with OAuth 2.1 (PKCE)
// authorization. It encapsulates the logic that the /test/mcp page previously
// inlined: connect -> 401 -> OAuth redirect -> callback -> reconnect, plus
// token refresh and tool listing/calling.
//
// The token storage backend is injectable via `storage` (defaults to
// localStorage). SECURITY: tokens in any web-readable storage are exposed to
// XSS. This provider exists to make the "no-backend SSG" pattern reusable; do
// not ship secret-bearing tokens to untrusted surfaces without review.

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLang } from "@/lib/i18n";
import { localizePlatformErrorMessage } from "@/lib/platform-errors";
import { OpenRouterAuthDialog } from "@/openroutermcp/OpenRouterAuthDialog";
import {
  type AuthContext,
  type AuthServerMetadata,
  type McpHttpClient,
  type OAuthTokens,
  type StorageLike,
  type Tool,
  type UnauthorizedError as UnauthorizedErrorType,
  buildAuthUrl,
  clearAuth,
  createPkce,
  discoverAuthServer,
  exchangeCode,
  loadAuthContext,
  loadPkce,
  loadTokens,
  McpHttpClient as McpHttpClientClass,
  refreshAccessToken,
  registerClient,
  saveAuthContext,
  savePkce,
  saveTokens,
} from "@/lib/openrouter-provider/mcpHttpClient";

export const OPENROUTER_DEFAULT_MCP_SERVER = "https://mcp.openrouter.ai/mcp";

export type McpStatus = "idle" | "connecting" | "authenticating" | "connected" | "error";

// A namespaced view over a StorageLike backend. Every key is prefixed so that
// multiple provider instances (or other callers) don't collide.
function namespacedStorage(base: StorageLike, prefix: string): StorageLike {
  const p = prefix ? prefix + ":" : "";
  return {
    getItem: (k) => base.getItem(p + k),
    setItem: (k, v) => base.setItem(p + k, v),
    removeItem: (k) => base.removeItem(p + k),
  };
}

function memoryStorage(): StorageLike {
  const m = new Map<string, string>();
  return {
    getItem: (k) => (m.has(k) ? (m.get(k) as string) : null),
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
}

export interface OpenRouterMcpProviderProps {
  children: ReactNode;
  /** MCP server base URL. Defaults to the OpenRouter MCP endpoint. */
  defaultServer?: string;
  /** Prefix applied to every stored key. Defaults to "openrouter-mcp". */
  storagePrefix?: string;
  /** Token/storage backend. Defaults to window.localStorage (SSR-safe). */
  storage?: StorageLike;
  /** Redirect target after OAuth. Defaults to origin + current pathname. */
  redirectUri?: string;
  /** Handle the ?code=&state= callback on mount. Defaults to true. */
  autoHandleCallback?: boolean;
  /** Custom redirect on authorize. Defaults to window.location.assign. */
  onAuthorize?: (authUrl: string) => void;
  /** Called whenever the connection status changes. */
  onStatusChange?: (status: McpStatus) => void;
}

export interface OpenRouterMcpContextValue {
  status: McpStatus;
  error: string | null;
  serverUrl: string;
  serverInfo: unknown | null;
  tools: Tool[];
  isAuthorized: boolean;
  /** True once the initial mount-time handshake (token load + OAuth callback) has settled. */
  ready: boolean;
  /** Raw token (a secret) — read only when strictly necessary. */
  token: OAuthTokens | null;

  setServerUrl(url: string): void;
  /** Connect; triggers the OAuth redirect automatically on 401. */
  connect(): Promise<void>;
  /** Clear credentials and reset all state. */
  disconnect(): void;
  callTool(name: string, args: unknown): Promise<unknown>;
  /** Force a refresh, returning a fresh access token (or null). */
  refreshToken(): Promise<string | null>;
  /** Process an OAuth redirect callback (?code=&state=). */
  handleCallback(): Promise<void>;
  /** Begin the OAuth (PKCE) flow, redirecting the browser to the auth page. */
  authorize(): void;
}

export const OpenRouterMcpContext = createContext<OpenRouterMcpContextValue | null>(null);

export function OpenRouterMcpProvider({
  children,
  defaultServer = OPENROUTER_DEFAULT_MCP_SERVER,
  storagePrefix = "openrouter-mcp",
  storage,
  redirectUri,
  autoHandleCallback = true,
  onAuthorize,
  onStatusChange,
}: OpenRouterMcpProviderProps) {
  const { lang, t } = useLang();
  const store = useMemo<StorageLike>(
    () =>
      namespacedStorage(
        storage ?? (typeof window !== "undefined" ? window.localStorage : memoryStorage()),
        storagePrefix
      ),
    [storage, storagePrefix]
  );

  const [status, setStatus] = useState<McpStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [serverUrl, setServerUrlState] = useState<string>(defaultServer);
  const [serverInfo, setServerInfo] = useState<unknown | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [token, setToken] = useState<OAuthTokens | null>(null);
  const [ready, setReady] = useState<boolean>(false);

  const clientRef = useRef<McpHttpClient | null>(null);
  const resolvedRedirectUri = useMemo(
    () =>
      redirectUri ??
      (typeof window !== "undefined" ? window.location.origin + window.location.pathname : ""),
    [redirectUri]
  );

  // --- auto-connect + confirm-modal plumbing ---
  // Refs mirror state so async helpers (ensureConnected) read fresh values
  // without re-creating callbacks on every state change.
  const statusRef = useRef<McpStatus>(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  const serverUrlRef = useRef<string>(serverUrl);
  useEffect(() => {
    serverUrlRef.current = serverUrl;
  }, [serverUrl]);
  const connectPromiseRef = useRef<Promise<void> | null>(null);

  const [oauthConfirmOpen, setOauthConfirmOpen] = useState(false);
  const oauthConfirmResolve = useRef<((v: boolean) => void) | null>(null);

  // Resolves to true when the user approves the OAuth redirect, false on cancel.
  const confirmOAuth = useCallback((): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      oauthConfirmResolve.current = resolve;
      setOauthConfirmOpen(true);
    });
  }, []);

  const closeOAuthConfirm = useCallback((result: boolean) => {
    setOauthConfirmOpen(false);
    const r = oauthConfirmResolve.current;
    oauthConfirmResolve.current = null;
    r?.(result);
  }, []);

  const setMcpStatus = useCallback(
    (s: McpStatus) => {
      setStatus(s);
      onStatusChange?.(s);
    },
    [onStatusChange]
  );

  // Returns a live bearer token, refreshing if it is about to expire.
  const getToken = useCallback(async (): Promise<string | null> => {
    const t = loadTokens(store);
    if (!t) return null;
    if (t.expires_at && t.expires_at - 30000 < Date.now() && t.refresh_token) {
      const ctx = loadAuthContext(store);
      if (ctx) {
        try {
          const as: AuthServerMetadata = {
            issuer: "",
            authorization_endpoint: ctx.authorization_endpoint,
            token_endpoint: ctx.token_endpoint,
          };
          const nt = await refreshAccessToken(as.token_endpoint, ctx.client_id, t.refresh_token);
          const merged = { ...nt, refresh_token: nt.refresh_token || t.refresh_token };
          saveTokens(merged, store);
          setToken(merged);
          return nt.access_token;
        } catch {
          /* fall through to the existing (possibly stale) token */
        }
      }
    }
    return t.access_token;
  }, [store]);

  const startOAuth = useCallback(
    async (base: string, wwwAuthenticate: string | null) => {
      setMcpStatus("authenticating");
      try {
        const as = await discoverAuthServer(base, wwwAuthenticate);
        const clientId = await registerClient(as, resolvedRedirectUri);
        const pkce = await createPkce();
        savePkce(pkce, store);
        const ctx: AuthContext = {
          client_id: clientId,
          authorization_endpoint: as.authorization_endpoint || "",
          token_endpoint: as.token_endpoint,
          redirect_uri: resolvedRedirectUri,
        };
        saveAuthContext(ctx, store);
        const url = buildAuthUrl(
          as,
          clientId,
          resolvedRedirectUri,
          pkce.state,
          pkce.challenge,
          as.scopes_supported?.join(" ")
        );
        if (onAuthorize) onAuthorize(url);
        else if (typeof window !== "undefined") window.location.assign(url);
      } catch (e) {
        setError(t("mcp.oauthStartFailed", { message: localizePlatformErrorMessage(msg(e), lang) }));
        setMcpStatus("error");
      }
    },
    [store, resolvedRedirectUri, onAuthorize, setMcpStatus, lang, t]
  );

  const connect = useCallback(async () => {
    setMcpStatus("connecting");
    setError(null);
    setServerInfo(null);
    try {
      const base = serverUrl.trim().replace(/\/$/, "");
      const client = new McpHttpClientClass(base, getToken);
      clientRef.current = client;
      try {
        const init = await client.initialize();
        setServerInfo(init);
      } catch (e) {
        if (e instanceof Error && (e as UnauthorizedErrorType).name === "UnauthorizedError") {
          const ue = e as UnauthorizedErrorType;
          await startOAuth(base, ue.wwwAuthenticate);
          return; // browser will redirect to the auth page
        }
        throw e;
      }
      const list = await client.listTools();
      setTools(list);
      const t = loadTokens(store);
      setToken(t);
      setMcpStatus("connected");
    } catch (e) {
      setError(localizePlatformErrorMessage(msg(e), lang));
      setMcpStatus("error");
    }
  }, [serverUrl, getToken, startOAuth, store, setMcpStatus, lang]);

  const disconnect = useCallback(() => {
    clearAuth(store);
    clientRef.current = null;
    setToken(null);
    setTools([]);
    setServerInfo(null);
    setError(null);
    setMcpStatus("idle");
  }, [store, setMcpStatus]);

  // Ensures a live MCP connection before performing an action. If a token is
  // stored it reconnects automatically; otherwise it prompts the user (via a
  // confirm modal) to approve the OAuth redirect.
  const ensureConnected = useCallback(async (): Promise<void> => {
    if (statusRef.current === "connected" && clientRef.current) return;
    const storedToken = loadTokens(store);
    if (storedToken) {
      if (!connectPromiseRef.current) {
        connectPromiseRef.current = connect().finally(() => {
          connectPromiseRef.current = null;
        });
      }
      await connectPromiseRef.current;
      if (!clientRef.current) throw new Error(t("mcp.reconnectFailed"));
      return;
    }
    const confirmed = await confirmOAuth();
    if (!confirmed) throw new Error(t("mcp.authRequired"));
    const base = serverUrlRef.current.trim().replace(/\/$/, "");
    await startOAuth(base, null);
    // startOAuth redirects the browser; reaching here means authorization failed.
    throw new Error(t("mcp.oauthIncomplete"));
  }, [store, connect, startOAuth, confirmOAuth, t]);

  const callTool = useCallback(async (name: string, args: unknown) => {
    await ensureConnected();
    const client = clientRef.current;
    if (!client) throw new Error(t("mcp.notConnected"));
    return client.callTool(name, args);
  }, [ensureConnected, t]);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    return getToken();
  }, [getToken]);

  const handleCallback = useCallback(async () => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (!code || !state) return;
    try {
      const pkce = loadPkce(store);
      const ctx = loadAuthContext(store);
      if (!pkce || !ctx) throw new Error(t("mcp.missingLocalContext"));
      if (pkce.state !== state) throw new Error(t("mcp.stateMismatch"));
      const tokens = await exchangeCode(
        ctx.token_endpoint,
        ctx.client_id,
        ctx.redirect_uri,
        code,
        pkce.verifier
      );
      saveTokens(tokens, store);
      setToken(tokens);
      window.history.replaceState({}, "", window.location.pathname);
      await connect();
    } catch (e) {
      setError(t("mcp.callbackFailed", { message: localizePlatformErrorMessage(msg(e), lang) }));
      setMcpStatus("error");
    }
  }, [store, connect, setMcpStatus, lang, t]);

  useEffect(() => {
    if (!autoHandleCallback) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReady(true);
      return;
    }
    // OAuth callback is a one-time mount side effect that may set state.
    // Mark the handshake settled only after it fully resolves (including the
    // code<->token exchange), so consumers don't read an unsaved token.
    void handleCallback().finally(() => setReady(true));
    // Only run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Flag an existing token so consumers can offer a direct reconnect.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = loadTokens(store);
    // Reading persisted credentials on mount is a one-time side effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (t) setToken(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Starts the OAuth redirect using the current server URL. Used by UIs that
  // want to gate the redirect behind their own confirm dialog (e.g. ChatBox).
  const authorize = useCallback(() => {
    const base = serverUrlRef.current.trim().replace(/\/$/, "");
    void startOAuth(base, null);
  }, [startOAuth]);

  const value = useMemo<OpenRouterMcpContextValue>(
    () => ({
      status,
      error,
      serverUrl,
      serverInfo,
      tools,
      isAuthorized: token !== null,
      ready,
      token,
      setServerUrl: setServerUrlState,
      connect,
      disconnect,
      callTool,
      refreshToken,
      handleCallback,
      authorize,
    }),
    [
      status,
      error,
      serverUrl,
      serverInfo,
      tools,
      token,
      ready,
      connect,
      disconnect,
      callTool,
      refreshToken,
      handleCallback,
      authorize,
    ]
  );

  return (
    <OpenRouterMcpContext.Provider value={value}>
      {children}
      <OpenRouterAuthDialog
        open={oauthConfirmOpen}
        onCancel={() => closeOAuthConfirm(false)}
        onAuthorize={() => closeOAuthConfirm(true)}
      />
    </OpenRouterMcpContext.Provider>
  );
}

function msg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}
