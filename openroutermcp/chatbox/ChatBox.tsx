"use client";

// ChatBox: a self-contained chat widget backed by the OpenRouter MCP provider.
//
// Lifecycle:
//  - On mount it tries to (re)connect to MCP. If a token is already stored it
//    reconnects silently; if not, it pops a shadcn Dialog asking the user to
//    start OAuth.
//  - Confirming the dialog triggers the OAuth (PKCE) redirect.
//  - Cancelling leaves the widget disabled; clicking anywhere on the widget
//    re-opens the OAuth confirm dialog.
//
// Composed of ModelSelect (filter + loading) and ChatHistoryWindow
// (auto-scroll to latest, markdown + image rendering). Chat history, selected
// model, and tool images are persisted to localStorage. Requires the
// OpenRouterMcpProvider ancestor (already mounted in the root layout).
//
// Styling uses shadcn primitives + Tailwind utilities only — no inline `style`.

import { useCallback, useEffect, useState } from "react";
import {
  chat,
  listModels,
  type ChatMessage,
  type ChatTool,
  type ModelInfo,
} from "@/lib/openrouter";
import { useOpenRouterMcp } from "@/lib/openrouter-provider/useOpenRouterMcp";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ModelSelect } from "./ModelSelect";
import { ChatHistoryWindow } from "./ChatHistoryWindow";
import { extractImages } from "./chatRender";

const LS_MODEL = "chatbox_model";
const LS_MESSAGES = "chatbox_messages";
const LS_IMAGES = "chatbox_images";

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export interface ChatBoxProps {
  /** Placeholder text for the input. */
  placeholder?: string;
  /** Max agent-loop iterations per send. Defaults to 8. */
  maxToolRounds?: number;
}

export function ChatBox({ placeholder = "输入消息，Enter 发送", maxToolRounds = 8 }: ChatBoxProps) {
  const { status, isAuthorized, ready, tools, connect, callTool, refreshToken, authorize } =
    useOpenRouterMcp();

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelLoading, setModelLoading] = useState(true);
  const [model, setModel] = useState<string>(() => loadJSON(LS_MODEL, ""));

  const [messages, setMessages] = useState<ChatMessage[]>(() => loadJSON<ChatMessage[]>(LS_MESSAGES, []));
  const [images, setImages] = useState<Record<string, string>>(() => loadJSON<Record<string, string>>(LS_IMAGES, {}));
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [oauthOpen, setOauthOpen] = useState(false);

  const authorized = isAuthorized && status === "connected";

  // --- init: load models + attempt to connect to MCP ---
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setModelLoading(true);
    listModels()
      .then((ms) => {
        if (cancelled) return;
        setModels(ms);
        // Models load asynchronously (independent of MCP init). Keep the last
        // selected model (restored from localStorage) only if it still exists
        // in the freshly loaded list; otherwise fall back to the first model.
        setModel((cur) => (cur && ms.some((m) => m.id === cur) ? cur : ms[0]?.id || ""));
      })
      .catch(() => {
        /* picker falls back to empty list */
      })
      .finally(() => !cancelled && setModelLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // Wait until the provider has finished its initial handshake (token load +
    // OAuth callback). Reading loadTokens() here would race with the provider's
    // callback exchange on the redirect-return load, wrongly popping the dialog
    // even though we just authorized. Once `ready`, the provider's isAuthorized
    // is the source of truth.
    if (!ready) return;
    if (isAuthorized) {
      void connect();
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOauthOpen(true);
    }
    // Run once when the provider becomes ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Close the dialog automatically once the handshake completes successfully.
  useEffect(() => {
    if (ready && isAuthorized && status === "connected" && oauthOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOauthOpen(false);
    }
  }, [ready, isAuthorized, status, oauthOpen]);

  // --- persist chat state to localStorage ---
  useEffect(() => {
    if (model) window.localStorage.setItem(LS_MODEL, model);
  }, [model]);

  useEffect(() => {
    window.localStorage.setItem(LS_MESSAGES, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LS_IMAGES, JSON.stringify(images));
    } catch {
      /* localStorage may overflow with many/large images; ignore. */
    }
  }, [images]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setImages({});
    setError(null);
  }, []);

  const sendChat = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    const tk = await refreshToken();
    if (!tk) {
      setError("未找到可用令牌，请先完成 OAuth 授权。");
      setOauthOpen(true);
      return;
    }
    if (tools.length === 0) {
      setError("尚未连接 MCP 或未发现工具，无法在聊天中调用工具。");
      return;
    }

    const mcpTools: ChatTool[] = tools.map((t) => ({
      type: "function",
      function: { name: t.name, description: t.description || "", parameters: t.inputSchema ?? { type: "object", properties: {} } },
    }));

    const history: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(history);
    setInput("");
    setError(null);
    setSending(true);

    const systemMsg: ChatMessage = {
      role: "system",
      content:
        "你可以通过调用提供的 MCP 工具来获取信息或执行操作。" +
        "当用户的需求需要工具时，请调用最合适的工具；工具返回结果后，再基于结果继续回答。" +
        "只在确实需要的时调用工具，不要编造工具参数。",
    };

    try {
      for (let i = 0; i < maxToolRounds; i++) {
        const apiMessages = tools.length ? [systemMsg, ...history] : history;
        const { content, toolCalls } = await chat(tk, model, apiMessages, mcpTools);

        if (toolCalls.length > 0) {
          history.push({ role: "assistant", content, tool_calls: toolCalls });
          setMessages([...history]);

          const collected: Record<string, string> = {};
          for (const tc of toolCalls) {
            let resultText: string;
            try {
              const args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
              const res = await callTool(tc.function.name, args);
              // Replace inline image base64 with a stable id reference so the
              // data never enters the chat context sent back to the model.
              const display = extractImages(res, collected);
              resultText = JSON.stringify(display, null, 2);
            } catch (e) {
              resultText = "工具调用失败: " + (e instanceof Error ? e.message : String(e));
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
          setMessages([...history]);
          continue;
        }

        history.push({ role: "assistant", content: content ?? "" });
        setMessages([...history]);
        break;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  }, [input, sending, refreshToken, tools, messages, model, callTool, maxToolRounds]);

  // Click anywhere on the widget re-opens the OAuth dialog while unauthenticated.
  const handleRootClick = useCallback(() => {
    if (!authorized && !oauthOpen) {
      setOauthOpen(true);
    }
  }, [authorized, oauthOpen]);

  return (
    <div
      onClick={handleRootClick}
      className={
        "flex w-full max-w-[640px] flex-col gap-2.5 rounded-xl border bg-card p-4 " +
        (authorized ? "cursor-default opacity-100" : "cursor-pointer opacity-70")
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">OpenRouter 聊天</span>
        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); clearChat(); }} disabled={messages.length === 0}>
          清空聊天
        </Button>
      </div>

      <ModelSelect
        models={models}
        value={model}
        onChange={setModel}
        loading={modelLoading}
        disabled={!authorized}
      />

      <ChatHistoryWindow messages={messages} loading={sending} images={images} />

      {error && <p className="whitespace-pre-wrap text-xs text-destructive">{error}</p>}

      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void sendChat();
          }
        }}
        rows={3}
        placeholder={authorized ? placeholder : "请先完成 OAuth 授权（点击此处）"}
        disabled={!authorized}
      />

      <Button
        onClick={(e) => { e.stopPropagation(); void sendChat(); }}
        disabled={!authorized || sending || !input.trim()}
        className="self-start"
      >
        {sending ? "发送中…" : "发送"}
      </Button>

      <Dialog
        open={oauthOpen}
        onOpenChange={(o) => {
          // Closing via overlay/ESC cancels the OAuth flow.
          if (!o) setOauthOpen(false);
        }}
      >
        <DialogContent onClick={(e) => e.stopPropagation()} showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>需要授权</DialogTitle>
            <DialogDescription>
              该聊天需要连接 OpenRouter MCP 才能调用工具。是否跳转到授权页面完成 OAuth 登录？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOauthOpen(false)}>
              取消
            </Button>
            <Button
              onClick={() => {
                setOauthOpen(false);
                authorize(); // redirects the browser to the OAuth page
              }}
            >
              前往授权
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
