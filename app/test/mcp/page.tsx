"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AuthServerMetadata,
  AuthContext,
  McpHttpClient,
  Tool,
  UnauthorizedError,
  clearAuth,
  createPkce,
  discoverAuthServer,
  exchangeCode,
  loadAuthContext,
  loadPkce,
  loadTokens,
  refreshAccessToken,
  registerClient,
  buildAuthUrl,
  saveAuthContext,
  savePkce,
  saveTokens,
} from "@/lib/mcp-client";
import {
  chat,
  listModels,
  type ChatMessage,
  type ChatTool,
  type ModelInfo,
} from "@/lib/openrouter";

const DEFAULT_SERVER = "https://mcp.openrouter.ai/mcp";

type Status = "idle" | "connecting" | "authenticating" | "connected" | "error";

export default function McpTestPage() {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string>("");
  const [tools, setTools] = useState<Tool[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [argsText, setArgsText] = useState<string>("{}");
  const [callResult, setCallResult] = useState<string>("");
  const [hasToken, setHasToken] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // Chat (OpenRouter OpenAI-compatible) state.
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [chatModel, setChatModel] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem("mcp_test_chat_model") || "" : ""
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("mcp_test_chat_messages");
      return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
    } catch {
      return [];
    }
  });
  const [chatInput, setChatInput] = useState<string>("");
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Image store: id -> data URL. Tool results reference images by id so the
  // (potentially huge) base64 never lands in the chat context sent to the model.
  const [images, setImages] = useState<Record<string, string>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem("mcp_test_images");
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  });

  const clientRef = useRef<McpHttpClient | null>(null);

  // Returns a live bearer token, refreshing if expired.
  async function getToken(): Promise<string | null> {
    const t = loadTokens();
    if (!t) return null;
    if (t.expires_at && t.expires_at - 30000 < Date.now() && t.refresh_token) {
      const ctx = loadAuthContext();
      if (ctx) {
        try {
          const as: AuthServerMetadata = {
            issuer: "",
            authorization_endpoint: ctx.authorization_endpoint,
            token_endpoint: ctx.token_endpoint,
          };
          const nt = await refreshAccessToken(as.token_endpoint, ctx.client_id, t.refresh_token);
          saveTokens({ ...nt, refresh_token: nt.refresh_token || t.refresh_token });
          return nt.access_token;
        } catch {
          /* fall through to existing token */
        }
      }
    }
    return t.access_token;
  }

  async function startOAuth(base: string, wwwAuthenticate: string | null): Promise<void> {
    setStatus("authenticating");
    try {
      const as = await discoverAuthServer(base, wwwAuthenticate);
      const redirectUri = window.location.origin + window.location.pathname;
      const clientId = await registerClient(as, redirectUri);
      const pkce = await createPkce();
      savePkce(pkce);
      const ctx: AuthContext = {
        client_id: clientId,
        authorization_endpoint: as.authorization_endpoint || "",
        token_endpoint: as.token_endpoint,
        redirect_uri: redirectUri,
      };
      saveAuthContext(ctx);
      const url = buildAuthUrl(
        as,
        clientId,
        redirectUri,
        pkce.state,
        pkce.challenge,
        as.scopes_supported?.join(" ")
      );
      window.location.assign(url);
    } catch (e) {
      setError("OAuth 启动失败: " + msg(e));
      setStatus("error");
    }
  }

  async function connect(): Promise<void> {
    setStatus("connecting");
    setError(null);
    setInfo("");
    try {
      const base = serverUrl.trim().replace(/\/$/, "");
      const client = new McpHttpClient(base, getToken);
      clientRef.current = client;
      try {
        const init = (await client.initialize()) as { serverInfo?: unknown; capabilities?: unknown };
        setInfo(JSON.stringify(init, null, 2));
      } catch (e) {
        if (e instanceof UnauthorizedError) {
          await startOAuth(base, e.wwwAuthenticate);
          return; // browser will redirect to the auth page
        }
        throw e;
      }
      const list = await client.listTools();
      setTools(list);
      setSelected(list[0]?.name || "");
      setHasToken(true);
      setStatus("connected");
    } catch (e) {
      setError(msg(e));
      setStatus("error");
    }
  }

  async function handleCall(): Promise<void> {
    setCallResult("");
    setError(null);
    const client = clientRef.current;
    if (!client || !selected) return;
    try {
      let args: unknown = {};
      try {
        args = argsText.trim() ? JSON.parse(argsText) : {};
      } catch {
        throw new Error("参数不是合法 JSON");
      }
      const res = await client.callTool(selected, args);
      setCallResult(JSON.stringify(res, null, 2));
    } catch (e) {
      setError(msg(e));
    }
  }

  function disconnect(): void {
    clearAuth();
    clientRef.current = null;
    setHasToken(false);
    setTools([]);
    setSelected("");
    setCallResult("");
    setInfo("");
    setStatus("idle");
    setError(null);
  }

  // Clear the chat history and any images it referenced (also wipes localStorage).
  function clearChat(): void {
    setChatMessages([]);
    setImages({});
  }

  // Handle the OAuth redirect callback (?code=...&state=...) on mount.
  // Also flag an existing token so the UI can offer a direct reconnect.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (code && state) {
      (async () => {
        try {
          const pkce = loadPkce();
          const ctx = loadAuthContext();
          if (!pkce || !ctx) throw new Error("缺少本地 PKCE/上下文，请重新点击连接");
          if (pkce.state !== state) throw new Error("state 不匹配，疑似 CSRF，已中止");
          const tokens = await exchangeCode(
            ctx.token_endpoint,
            ctx.client_id,
            ctx.redirect_uri,
            code,
            pkce.verifier
          );
          saveTokens(tokens);
          localStorage.removeItem("mcp_test_pkce");
          window.history.replaceState({}, "", window.location.pathname);
          await connect();
        } catch (e) {
          setError("OAuth 回调失败: " + msg(e));
          setStatus("error");
        }
      })();
    } else if (loadTokens()) {
      setHasToken(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load the OpenRouter model list for the chat picker (with fallback).
  useEffect(() => {
    let cancelled = false;
    listModels()
      .then((ms) => {
        if (cancelled) return;
        setModels(ms);
        setChatModel((cur) => cur || ms[0]?.id || "");
      })
      .catch(() => {
        /* keep models empty; picker falls back via option list */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist the selected model + chat history to browser localStorage.
  useEffect(() => {
    if (chatModel) localStorage.setItem("mcp_test_chat_model", chatModel);
  }, [chatModel]);

  useEffect(() => {
    localStorage.setItem("mcp_test_chat_messages", JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    try {
      localStorage.setItem("mcp_test_images", JSON.stringify(images));
    } catch {
      /* localStorage may overflow with many/large images; ignore. */
    }
  }, [images]);

  async function sendChat(): Promise<void> {
    const text = chatInput.trim();
    if (!text || chatSending) return;

    const token = await getToken();
    if (!token) {
      setChatError("未找到可用令牌，请先在上方点击「连接 / 登录」完成授权。");
      return;
    }
    if (!clientRef.current || tools.length === 0) {
      setChatError("尚未连接 MCP 或未发现工具，无法在聊天中调用工具。请先「连接 / 登录」。");
      return;
    }

    // Expose the connected MCP server's tools to the model in OpenAI tool format.
    const mcpTools: ChatTool[] = tools.map((t) => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description || "",
        parameters: t.inputSchema ?? { type: "object", properties: {} },
      },
    }));

    // `history` accumulates the live conversation (incl. tool calls + results).
    const history: ChatMessage[] = [...chatMessages, { role: "user", content: text }];
    setChatMessages(history);
    setChatInput("");
    setChatError(null);
    setChatSending(true);

    // Build the request messages, optionally prefacing with a tool-use system prompt.
    const systemMsg: ChatMessage = {
      role: "system",
      content:
        "你可以通过调用提供的 MCP 工具来获取信息或执行操作。" +
        "当用户的需求需要工具时，请调用最合适的工具；工具返回结果后，再基于结果继续回答。" +
        "只在确实需要的时调用工具，不要编造工具参数。",
    };

    try {
      // Agent loop: keep going until the model returns a final textual answer.
      for (let i = 0; i < 8; i++) {
        const apiMessages = tools.length ? [systemMsg, ...history] : history;
        const { content, toolCalls } = await chat(token, chatModel, apiMessages, mcpTools);

        if (toolCalls.length > 0) {
          // Record the model's tool-call decision (with optional text).
          history.push({ role: "assistant", content, tool_calls: toolCalls });
          setChatMessages([...history]);

          // Collect every image extracted from this turn's tool results so we
          // can persist them once after the loop.
          const collected: Record<string, string> = {};
          for (const tc of toolCalls) {
            let resultText: string;
            try {
              const args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
              const res = await clientRef.current!.callTool(tc.function.name, args);
              // Replace inline image base64 with a stable id reference so the
              // data never enters the chat context sent back to the model.
              const display = extractImages(res, collected);
              resultText = JSON.stringify(display, null, 2);
            } catch (e) {
              resultText = "工具调用失败: " + msg(e);
            }
            history.push({
              role: "tool",
              tool_call_id: tc.id,
              name: tc.function.name,
              content: resultText,
            });
          }
          if (Object.keys(collected).length > 0) {
            setImages((prev) => ({ ...prev, ...collected }));
          }
          setChatMessages([...history]);
          // Loop again so the model can act on the tool results.
          continue;
        }

        history.push({ role: "assistant", content: content ?? "" });
        setChatMessages([...history]);
        break;
      }
    } catch (e) {
      setChatError(msg(e));
    } finally {
      setChatSending(false);
    }
  }

  const token = showSecret ? loadTokens() : null;

  return (
    <main
      style={{
        maxWidth: 820,
        margin: "0 auto",
        padding: 24,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        color: "#111",
      }}
    >
      <h1 style={{ fontSize: 20 }}>/test/mcp — 浏览器直连 MCP（无后端）</h1>

      <div
        style={{
          background: "#fff7ed",
          border: "1px solid #fdba74",
          borderRadius: 8,
          padding: 12,
          margin: "12px 0",
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        <strong>⚠️ 测试用途：</strong> 本页将 OAuth 令牌（secret）存于浏览器
        localStorage，<strong>任何能执行 JS 的脚本（含 XSS）都可读取</strong>。
        仅用于验证「无后端、SSG、localStorage 存 secret」是否可行，<strong>不要用于生产</strong>。
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <input
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
          style={{ flex: 1, minWidth: 280, padding: 8, fontFamily: "inherit" }}
          placeholder="MCP 服务器 URL"
        />
        <button onClick={connect} disabled={status === "connecting"} style={btn}>
          {hasToken ? "连接（用已存令牌）" : "连接 / 登录"}
        </button>
        <button onClick={disconnect} style={{ ...btn, background: "#dc2626" }}>
          断开 / 清除凭证
        </button>
      </div>

      <div style={{ fontSize: 13, marginBottom: 12 }}>
        状态：<b>{status}</b>
        {hasToken && (
          <button
            onClick={() => setShowSecret((v) => !v)}
            style={{ marginLeft: 10, ...linkBtn }}
          >
            {showSecret ? "隐藏 localStorage 中的 secret" : "查看 localStorage 中的 secret"}
          </button>
        )}
      </div>

      {token && (
        <pre
          style={{
            background: "#0b1020",
            color: "#d1fae5",
            padding: 12,
            borderRadius: 8,
            fontSize: 12,
            overflowX: "auto",
          }}
        >
          {JSON.stringify(token, null, 2)}
        </pre>
      )}

      {info && (
        <section style={{ marginBottom: 16 }}>
          <h2 style={h2}>initialize 响应</h2>
          <pre style={pre}>{info}</pre>
        </section>
      )}

      {tools.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <h2 style={h2}>工具列表（{tools.length}）</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <select value={selected} onChange={(e) => setSelected(e.target.value)} style={select}>
              {tools.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
            <button onClick={handleCall} style={btn}>
              调用工具
            </button>
          </div>
          {selected && (
            <p style={{ fontSize: 12, color: "#555" }}>
              {tools.find((t) => t.name === selected)?.description || "（无描述）"}
            </p>
          )}
          <textarea
            value={argsText}
            onChange={(e) => setArgsText(e.target.value)}
            rows={4}
            style={{ ...inputBox, width: "100%" }}
            placeholder='调用参数 JSON，例如 {}'
          />
          {callResult && <pre style={pre}>{callResult}</pre>}
        </section>
      )}

      {error && (
        <pre
          style={{
            background: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fecaca",
            padding: 12,
            borderRadius: 8,
            fontSize: 12,
            whiteSpace: "pre-wrap",
          }}
        >
          {error}
        </pre>
      )}

      <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "24px 0" }} />

      <section style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <h2 style={h2}>OpenRouter 聊天（使用已存令牌）</h2>
          <button
            onClick={clearChat}
            disabled={chatMessages.length === 0}
            style={{ ...linkBtn, color: "#dc2626", fontSize: 13 }}
          >
            清空聊天
          </button>
        </div>
        <p style={{ fontSize: 13, color: "#555", margin: "0 0 8px" }}>
          选择模型后直接对话；请求使用上方授权流程存入 localStorage 的令牌，
          从浏览器调用 OpenRouter 的 OpenAI 兼容接口。
        </p>

        {!hasToken && (
          <p style={{ fontSize: 13, color: "#991b1b" }}>
            尚未发现令牌，请先在上方点击「连接 / 登录」完成授权，聊天才可用。
          </p>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <select
            value={chatModel}
            onChange={(e) => setChatModel(e.target.value)}
            style={select}
            disabled={!hasToken}
          >
            {models.length === 0 && <option value="">（模型加载中…）</option>}
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}（{m.id}）
              </option>
            ))}
          </select>
        </div>

        <div style={chatWindow}>
          {chatMessages.length === 0 && !chatSending && (
            <p style={{ fontSize: 13, color: "#666", margin: 0 }}>
              还没有对话，发送一条消息开始。
            </p>
          )}
          {chatMessages.map((m, i) => {
            if (m.role === "user") {
              return (
                <div
                  key={i}
                  style={{ ...chatBubble, alignSelf: "flex-end", background: "#111827", color: "#fff" }}
                >
                  <Md content={m.content || ""} />
                </div>
              );
            }
            if (m.role === "tool") {
              return (
                <div key={i} style={toolResultBox}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    🔧 工具返回：{m.name || m.tool_call_id}
                  </div>
                  <ToolResult content={m.content || ""} images={images} />
                </div>
              );
            }
            if (m.tool_calls && m.tool_call_id === undefined) {
              return (
                <div key={i} style={toolCallBox}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    💡 模型请求调用工具
                  </div>
                  {m.tool_calls.map((tc) => (
                    <div key={tc.id} style={{ marginBottom: 6 }}>
                      <code style={{ fontSize: 12, color: "#1d4ed" }}>{tc.function.name}</code>
                      <pre
                        style={{
                          margin: "4px 0 0",
                          background: "#0b1020",
                          color: "#e5e7eb",
                          padding: 8,
                          borderRadius: 6,
                          fontSize: 11,
                          overflowX: "auto",
                        }}
                      >
                        {tc.function.arguments || "{}"}
                      </pre>
                    </div>
                  ))}
                </div>
              );
            }
            return (
              <div
                key={i}
                style={{ ...chatBubble, alignSelf: "flex-start", background: "#eef2ff", color: "#111" }}
              >
                <Md content={m.content || ""} />
              </div>
            );
          })}
          {chatSending && (
            <div
              style={{
                ...chatBubble,
                alignSelf: "flex-start",
                background: "#f3f4f6",
                color: "#555",
              }}
            >
              …（思考中）
            </div>
          )}
        </div>

        <div style={{ marginTop: 8 }}>
          <textarea
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendChat();
              }
            }}
            rows={3}
            style={{ ...inputBox, width: "100%" }}
            placeholder={hasToken ? "输入消息，Enter 发送，Shift+Enter 换行" : "请先完成授权"}
            disabled={!hasToken}
          />
        </div>
        <div style={{ marginTop: 8 }}>
          <button
            onClick={() => void sendChat()}
            disabled={!hasToken || chatSending || !chatInput.trim()}
            style={btn}
          >
            {chatSending ? "发送中…" : "发送"}
          </button>
        </div>

        {chatError && (
          <pre
            style={{
              background: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fecaca",
              padding: 12,
              borderRadius: 8,
              fontSize: 12,
              whiteSpace: "pre-wrap",
              marginTop: 8,
            }}
          >
            {chatError}
          </pre>
        )}
      </section>

      <p style={{ fontSize: 12, color: "#666", marginTop: 16 }}>
        流程：连接 → 若服务器返回 401，则在浏览器内走 OAuth(PKCE) →
        回调本页用 code 换令牌 → 存 localStorage → 重新 initialize 并列出工具。
        若授权服务器不允许网页回调（redirect_uri 非 https/非 loopback）或 CORS 拦截，
        上方会以红色错误明确展示原因。
      </p>
    </main>
  );
}

function msg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

// Inline markdown rendering for chat bubbles, with sensible styling that
// works on both the dark (user) and light (assistant) bubble backgrounds.
const mdComponents: Components = {
  a: ({ node, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer" />
  ),
  pre: ({ node, ...props }) => (
    <pre
      {...props}
      style={{
        background: "rgba(0,0,0,0.08)",
        padding: 8,
        borderRadius: 6,
        overflowX: "auto",
        fontSize: 12,
      }}
    />
  ),
  code: ({ node, ...props }) => (
    <code
      {...props}
      style={{
        background: "rgba(0,0,0,0.08)",
        padding: "1px 4px",
        borderRadius: 4,
        fontSize: 12,
      }}
    />
  ),
  table: ({ node, ...props }) => (
    <table
      {...props}
      style={{ borderCollapse: "collapse", width: "100%", fontSize: 12, margin: "4px 0" }}
    />
  ),
  th: ({ node, ...props }) => (
    <th {...props} style={{ border: "1px solid currentColor", padding: "4px 6px", textAlign: "left" }} />
  ),
  td: ({ node, ...props }) => (
    <td {...props} style={{ border: "1px solid currentColor", padding: "4px 6px" }} />
  ),
  img: ({ node, ...props }) => (
    <img {...props} style={{ maxWidth: "100%", borderRadius: 6 }} alt={props.alt ?? ""} />
  ),
};

function Md({ content }: { content: string }) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} components={mdComponents}>
      {content}
    </Markdown>
  );
}

// Recursively walk a tool result and replace any `{ type: "image", data }`
// node with a `{ type: "image", ref }` node, storing the base64 as a data URL
// in `store` keyed by a generated id. This keeps the (large) base64 out of the
// chat context that is sent back to the model.
function extractImages(value: unknown, store: Record<string, string>): unknown {
  if (Array.isArray(value)) return value.map((v) => extractImages(v, store));
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (obj.type === "image" && typeof obj.data === "string") {
      const id = "img_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const mime = obj.data.startsWith("/9j/") ? "image/jpeg" : "image/png";
      store[id] = `data:${mime};base64,${obj.data}`;
      return { type: "image", ref: id };
    }
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(obj)) out[k] = extractImages(obj[k], store);
    return out;
  }
  return value;
}

// Render a tool result's content, showing images (by ref) and text blocks.
function ToolResult({
  content,
  images,
}: {
  content: string;
  images: Record<string, string>;
}) {
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = null;
  }
  const items: unknown[] | null = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && Array.isArray((parsed as Record<string, unknown>).content)
      ? (parsed as Record<string, unknown>).content as unknown[]
      : null;

  if (items) {
    return (
      <>
        {items.map((it: unknown, idx: number) => {
          if (it && typeof it === "object" && (it as Record<string, unknown>).type === "image") {
            const im = it as Record<string, unknown>;
            const src = typeof im.data === "string"
              ? im.data.startsWith("data:")
                ? im.data
                : `data:image/png;base64,${im.data}`
              : (im.ref != null ? images[im.ref as string] : undefined);
            if (!src) {
              return (
                <span key={idx} style={{ fontSize: 12, color: "#888" }}>
                  （图片不存在或已清除）
                </span>
              );
            }
            return (
              <img
                key={idx}
                src={src}
                alt="工具返回图片"
                style={{ maxWidth: "100%", borderRadius: 6, display: "block", margin: "4px 0" }}
              />
            );
          }
          const text: string =
            it && typeof it === "object" && typeof (it as Record<string, unknown>).text === "string"
              ? (it as Record<string, unknown>).text as string
              : typeof it === "string"
                ? it
                : JSON.stringify(it, null, 2);
          return (
            <pre
              key={idx}
              style={{ margin: "4px 0 0", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12 }}
            >
              {text}
            </pre>
          );
        })}
      </>
    );
  }

  return (
    <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12 }}>
      {content}
    </pre>
  );
}

const btn: CSSProperties = {
  padding: "8px 14px",
  border: "none",
  borderRadius: 6,
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
  fontFamily: "inherit",
};

const linkBtn: CSSProperties = {
  border: "none",
  background: "none",
  color: "#2563eb",
  cursor: "pointer",
  fontFamily: "inherit",
  textDecoration: "underline",
  padding: 0,
  fontSize: 13,
};

const h2: CSSProperties = { fontSize: 15, margin: "12px 0 6px" };

const pre: CSSProperties = {
  background: "#0b1020",
  color: "#e5e7eb",
  padding: 12,
  borderRadius: 8,
  fontSize: 12,
  overflowX: "auto",
  fontFamily: "inherit",
};

const select: CSSProperties = {
  padding: 8,
  fontFamily: "inherit",
  borderRadius: 6,
  border: "1px solid #ccc",
};

const inputBox: CSSProperties = {
  padding: 12,
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "inherit",
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#111",
  resize: "vertical",
};

const chatWindow: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  padding: 12,
  minHeight: 160,
  maxHeight: 420,
  overflowY: "auto",
  fontFamily: "inherit",
};

const chatBubble: CSSProperties = {
  maxWidth: "80%",
  padding: "8px 12px",
  borderRadius: 10,
  fontSize: 13,
  lineHeight: 1.5,
  wordBreak: "break-word",
};

const toolCallBox: CSSProperties = {
  alignSelf: "flex-start",
  maxWidth: "90%",
  background: "#fefce8",
  border: "1px solid #fde68a",
  borderRadius: 10,
  padding: "8px 12px",
  fontSize: 13,
};

const toolResultBox: CSSProperties = {
  alignSelf: "flex-start",
  maxWidth: "90%",
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  borderRadius: 10,
  padding: "8px 12px",
  fontSize: 13,
};
