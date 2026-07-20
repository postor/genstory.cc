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

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import {
  chat,
  listModels,
  type ChatMessage,
  type ChatTool,
  type ModelInfo,
} from "@/lib/openrouter";
import { useOpenRouterMcp } from "@/lib/openrouter-provider/useOpenRouterMcp";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
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
import {
  estimateContextUsage,
  estimateContextTokens,
  formatContextBreakdown,
  formatContextLimit,
  formatContextSize,
} from "./contextSize";
import {
  buildCompressedLlmMessages,
  buildCompressionPrompt,
  fingerprintMessages,
  planContextCompression,
  type ChatCompressionState,
} from "./contextCompression";
import { pickInitialModelId } from "./modelSelection";
import {
  createContextCompressionNotice,
  createModelSwitchNotice,
  llmMessagesFromTranscript,
  type ChatTranscriptItem,
} from "./transcript";

const LS_MODEL = "chatbox_model";
const LS_MESSAGES = "chatbox_messages";
const LS_IMAGES = "chatbox_images";
const LS_AUTO_COMPRESS = "chatbox_auto_compress";
const LS_COMPRESSION = "chatbox_context_compression";

/** Namespace a storage key by an optional chat/project id. */
function storageKey(base: string, chatId?: string): string {
  return chatId ? `${base}_${chatId}` : base;
}

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
  /** Lightweight project/workspace metadata appended to the system prompt.
   *  Full project files should be exposed through projectTools instead. */
  context?: string;
  /** Scope chat history + images to this id (e.g. project id) so different
   *  conversations do not share messages. Omit for a global shared chat. */
  chatId?: string;
  /** Fires when the user explicitly changes the selected model. */
  onModelChange?: (model: string) => void;
  /** Fires whenever a (non-empty) message is sent. */
  onSend?: (text: string) => void;
  /** Applies explicit file edits returned by the assistant after user confirmation. */
  onFileChanges?: (changes: ChatFileChange[]) => void | Promise<void>;
  /** Local project tools, such as list/read/search files, exposed to the model on demand. */
  projectTools?: ChatProjectTool[];
  className?: string;
}

export interface ChatProjectTool {
  name: string;
  description: string;
  inputSchema?: unknown;
  call: (args: Record<string, unknown>) => unknown | Promise<unknown>;
}

export interface ChatFileChange {
  path: string;
  content: string;
  description?: string;
}

function isFileChange(value: unknown): value is ChatFileChange {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.path === "string" && typeof item.content === "string";
}

function collectFileChanges(value: unknown): ChatFileChange[] {
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const source = record.fileChanges ?? record.files ?? record.changes;
  if (!Array.isArray(source)) return [];
  return source.filter(isFileChange).map((change) => ({
    path: change.path,
    content: change.content,
    description: change.description,
  }));
}

function parseFileChanges(content: string | null | undefined): ChatFileChange[] {
  if (!content) return [];
  const candidates: string[] = [];
  const fenced = content.matchAll(/```(?:json|genstory-file-changes)?\s*([\s\S]*?)```/gi);
  for (const match of fenced) candidates.push(match[1].trim());
  candidates.push(content.trim());

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      const changes = collectFileChanges(parsed);
      if (changes.length > 0) return changes;
    } catch {
      /* Try the next candidate. */
    }
  }
  return [];
}

/** Imperative handle so a parent can drive the chat (e.g. auto-send a prompt). */
export interface ChatBoxHandle {
  /** Send a message programmatically, as if typed and submitted by the user. */
  send: (text: string) => void;
  /** Fill the input with text and focus it, without sending. */
  prefill: (text: string) => void;
}

export const ChatBox = forwardRef<ChatBoxHandle, ChatBoxProps>(function ChatBox(
  {
    placeholder = "输入消息，Enter 发送",
    maxToolRounds = 8,
    context,
    chatId,
    onModelChange,
    onSend,
    onFileChanges,
    projectTools = [],
    className,
  }: ChatBoxProps,
  ref
) {
  const { status, isAuthorized, ready, tools, connect, callTool, refreshToken, authorize } =
    useOpenRouterMcp();

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelLoading, setModelLoading] = useState(true);
  const [model, setModel] = useState<string>("");
  const [modelStorageReady, setModelStorageReady] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [transcript, setTranscript] = useState<ChatTranscriptItem[]>([]);
  const [images, setImages] = useState<Record<string, string>>({});
  const [compression, setCompression] = useState<ChatCompressionState | null>(null);
  const [autoCompress, setAutoCompress] = useState(false);
  const [compressionStorageReady, setCompressionStorageReady] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [chatStorageReady, setChatStorageReady] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingText, setStreamingText] = useState(false);
  const [applyingChanges, setApplyingChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<ChatFileChange[]>([]);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [oauthOpen, setOauthOpen] = useState(false);

  const authorized = isAuthorized && status === "connected";
  const contextUsage = useMemo(
    () => estimateContextUsage({ context, messages, input }),
    [context, messages, input]
  );
  const selectedModel = useMemo(
    () => models.find((item) => item.id === model),
    [model, models]
  );
  const requestTokens = contextUsage.context + contextUsage.history + contextUsage.input;
  const projectToolNames = useMemo(
    () => new Set(projectTools.map((tool) => tool.name)),
    [projectTools]
  );

  // --- init: load models + attempt to connect to MCP ---
  useEffect(() => {
    let cancelled = false;
    setModelLoading(true);
    listModels()
      .then((ms) => {
        if (cancelled) return;
        setModels(ms);
        // Models load asynchronously (independent of MCP init). Keep the last
        // selected model (restored from localStorage) only if it still exists;
        // otherwise prefer the first free model before falling back further.
        setModel((cur) => pickInitialModelId(ms, cur));
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
    setModel(loadJSON(LS_MODEL, ""));
    setModelStorageReady(true);
  }, []);

  useEffect(() => {
    setAutoCompress(loadJSON<boolean>(LS_AUTO_COMPRESS, false));
    setCompressionStorageReady(true);
  }, []);

  useEffect(() => {
    setChatStorageReady(false);
    const storedTranscript = loadJSON<ChatTranscriptItem[]>(
      storageKey(LS_MESSAGES, chatId),
      []
    );
    setMessages(llmMessagesFromTranscript(storedTranscript));
    setTranscript(storedTranscript);
    setImages(loadJSON<Record<string, string>>(storageKey(LS_IMAGES, chatId), {}));
    setCompression(
      loadJSON<ChatCompressionState | null>(
        storageKey(LS_COMPRESSION, chatId),
        null
      )
    );
    setChatStorageReady(true);
  }, [chatId]);

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
      setOauthOpen(true);
    }
    // Run once when the provider becomes ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Close the dialog automatically once the handshake completes successfully.
  useEffect(() => {
    if (ready && isAuthorized && status === "connected" && oauthOpen) {
      setOauthOpen(false);
    }
  }, [ready, isAuthorized, status, oauthOpen]);

  // --- persist chat state to localStorage ---
  // Model selection stays global (user preference); messages + images are
  // scoped per chatId so each project keeps its own conversation.
  useEffect(() => {
    if (!modelStorageReady || !model) return;
    if (model) window.localStorage.setItem(LS_MODEL, model);
  }, [model, modelStorageReady]);

  useEffect(() => {
    if (!chatStorageReady) return;
    window.localStorage.setItem(
      storageKey(LS_MESSAGES, chatId),
      JSON.stringify(transcript)
    );
  }, [transcript, chatId, chatStorageReady]);

  useEffect(() => {
    if (!chatStorageReady) return;
    try {
      window.localStorage.setItem(storageKey(LS_IMAGES, chatId), JSON.stringify(images));
    } catch {
      /* localStorage may overflow with many/large images; ignore. */
    }
  }, [images, chatId, chatStorageReady]);

  useEffect(() => {
    if (!compressionStorageReady) return;
    window.localStorage.setItem(LS_AUTO_COMPRESS, JSON.stringify(autoCompress));
  }, [autoCompress, compressionStorageReady]);

  useEffect(() => {
    if (!chatStorageReady) return;
    const key = storageKey(LS_COMPRESSION, chatId);
    if (compression) {
      window.localStorage.setItem(key, JSON.stringify(compression));
    } else {
      window.localStorage.removeItem(key);
    }
  }, [compression, chatId, chatStorageReady]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setTranscript([]);
    setImages({});
    setCompression(null);
    setError(null);
  }, []);

  const compressHistory = useCallback(
    async (
      token: string,
      nextTranscript: ChatTranscriptItem[],
      fixedTokens = 0,
      force = false
    ) => {
      const llmMessages = llmMessagesFromTranscript(nextTranscript);
      const currentCompression =
        compression &&
        fingerprintMessages(
          llmMessages.slice(0, compression.coveredMessageCount)
        ) === compression.sourceFingerprint
          ? compression
          : null;
      const plan = planContextCompression({
        messages: llmMessages,
        context,
        fixedTokens,
        modelLimit: selectedModel?.contextLength,
        existingCoveredMessageCount: currentCompression?.coveredMessageCount ?? 0,
        force,
      });

      if (!force && !plan.shouldCompress) {
        return {
          messages: buildCompressedLlmMessages({
            summary: currentCompression?.summary,
            recentMessages: plan.recentMessages,
          }),
          compression: currentCompression,
          compressionApplied: false,
        };
      }

      if (plan.summarySourceMessages.length === 0) {
        return {
          messages: buildCompressedLlmMessages({
            summary: currentCompression?.summary,
            recentMessages: plan.recentMessages,
          }),
          compression: currentCompression,
          compressionApplied: false,
        };
      }

      setCompressing(true);
      try {
        const result = await chat(
          token,
          model,
          buildCompressionPrompt({
            previousSummary: currentCompression?.summary,
            messages: plan.summarySourceMessages,
          })
        );
        const summary = result.content?.trim();
        if (!summary) throw new Error("上下文压缩未返回摘要");

        const nextCompression: ChatCompressionState = {
          summary,
          coveredMessageCount: plan.coveredMessageCount,
          sourceFingerprint: fingerprintMessages(
            llmMessages.slice(0, plan.coveredMessageCount)
          ),
          updatedAt: Date.now(),
        };
        setCompression(nextCompression);
        return {
          messages: buildCompressedLlmMessages({
            summary,
            recentMessages: plan.recentMessages,
          }),
          compression: nextCompression,
          compressionApplied: true,
        };
      } catch (error) {
        return {
          messages: buildCompressedLlmMessages({
            summary: currentCompression?.summary,
            recentMessages: plan.recentMessages,
          }),
          compression: currentCompression,
          compressionApplied: false,
          error: error instanceof Error ? error : new Error(String(error)),
        };
      } finally {
        setCompressing(false);
      }
    },
    [compression, context, model, selectedModel?.contextLength]
  );

  const sendChat = useCallback(
    async (presetText?: string) => {
      const text = (presetText ?? input).trim();
      if (!text || sending) return;

    const tk = await refreshToken();
    if (!tk) {
      setError("未找到可用令牌，请先完成 OAuth 授权。");
      setOauthOpen(true);
      return;
    }
    if (tools.length === 0 && projectTools.length === 0) {
      setError("尚未连接 MCP 或未发现工具，无法在聊天中调用工具。");
      return;
    }

    const runtimeTools = [
      ...tools.map((t) => ({
        name: t.name,
        description: t.description || "",
        inputSchema: t.inputSchema ?? { type: "object", properties: {} },
      })),
      ...projectTools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema ?? { type: "object", properties: {} },
      })),
    ];
    const mcpTools: ChatTool[] = runtimeTools.map((t) => ({
      type: "function",
      function: { name: t.name, description: t.description, parameters: t.inputSchema },
    }));

    const userMessage: ChatMessage = { role: "user", content: text };
    let displayTranscript: ChatTranscriptItem[] = [...transcript, userMessage];
    let history: ChatMessage[] = llmMessagesFromTranscript(displayTranscript);
    setMessages(history);
    setTranscript(displayTranscript);
    setInput("");
    setError(null);
    setSending(true);
    setStreamingText(false);
    onSend?.(text);

    const systemMsg: ChatMessage = {
      role: "system",
      content:
        "你可以通过调用提供的 MCP 工具来获取信息或执行操作。" +
        "当用户的需求需要工具时，请调用最合适的工具；工具返回结果后，再基于结果继续回答。" +
        "只在确实需要的时调用工具，不要编造工具参数。" +
        (projectTools.length > 0
          ? "项目正文和素材不会默认附带在请求中；当前项目概况会随请求发送。如果需要了解项目内容，请先调用 genstory_list_project_files、genstory_read_project_file 或 genstory_search_project_files 精确读取。"
          : "") +
        (onFileChanges
          ? "\n\n如果你要修改项目文件，请在回答末尾追加一个 JSON 代码块，格式为：```json\n{\"fileChanges\":[{\"path\":\"chapter-001/pages/page-001.md\",\"content\":\"完整文件内容\",\"description\":\"修改说明\"}]}\n```。path 必须是项目内相对路径，content 必须是完整文件内容。"
          : "") +
        (context
          ? `\n\n当前项目概况（非完整文件内容）：\n${context}`
          : ""),
    };

    try {
      if (autoCompress) {
        const compressed = await compressHistory(
          tk,
          displayTranscript,
          estimateContextTokens(systemMsg.content ?? "") +
            estimateContextTokens(JSON.stringify(mcpTools))
        );
        history = compressed.messages;
        if (compressed.error) {
          setError(`上下文压缩失败，已改用最近历史：${compressed.error.message}`);
        }
        if (compressed.compressionApplied && compressed.compression) {
          displayTranscript = [
            ...displayTranscript,
            createContextCompressionNotice({
              coveredMessageCount: compressed.compression.coveredMessageCount,
              summaryTokens: estimateContextTokens(compressed.compression.summary),
            }),
          ];
          setTranscript(displayTranscript);
        }
        setMessages(history);
      }

      for (let i = 0; i < maxToolRounds; i++) {
        const apiMessages = runtimeTools.length ? [systemMsg, ...history] : history;
        let streamedContent = "";
        const { content, toolCalls } = await chat(tk, model, apiMessages, mcpTools, {
          onTextDelta: (delta) => {
            streamedContent += delta;
            setStreamingText(true);
            setTranscript([
              ...displayTranscript,
              { role: "assistant", content: streamedContent },
            ]);
          },
        });
        const finalContent = content ?? (streamedContent || null);

        if (toolCalls.length > 0) {
          setStreamingText(false);
          const assistantMessage: ChatMessage = {
            role: "assistant",
            content: finalContent,
            tool_calls: toolCalls,
          };
          history.push(assistantMessage);
          displayTranscript = [...displayTranscript, assistantMessage];
          setMessages([...history]);
          setTranscript(displayTranscript);

          const collected: Record<string, string> = {};
          for (const tc of toolCalls) {
            let resultText: string;
            try {
              const args = tc.function.arguments ? JSON.parse(tc.function.arguments) as Record<string, unknown> : {};
              const localTool = projectToolNames.has(tc.function.name)
                ? projectTools.find((tool) => tool.name === tc.function.name)
                : undefined;
              const res = localTool
                ? await localTool.call(args)
                : await callTool(tc.function.name, args);
              // Replace inline image base64 with a stable id reference so the
              // data never enters the chat context sent back to the model.
              const display = extractImages(res, collected);
              resultText = JSON.stringify(display, null, 2);
            } catch (e) {
              resultText = "工具调用失败: " + (e instanceof Error ? e.message : String(e));
            }
            const toolMessage: ChatMessage = {
              role: "tool",
              tool_call_id: tc.id,
              name: tc.function.name,
              content: resultText,
            };
            history.push(toolMessage);
            displayTranscript = [...displayTranscript, toolMessage];
          }
          if (Object.keys(collected).length > 0) {
            setImages((prev) => ({ ...prev, ...collected }));
          }
          setMessages([...history]);
          setTranscript(displayTranscript);
          continue;
        }

        const assistantMessage: ChatMessage = { role: "assistant", content: finalContent ?? "" };
        history.push(assistantMessage);
        displayTranscript = [...displayTranscript, assistantMessage];
        const fileChanges = parseFileChanges(finalContent);
        if (fileChanges.length > 0) setPendingChanges(fileChanges);
        setMessages([...history]);
        setTranscript(displayTranscript);
        break;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
      setStreamingText(false);
    }
  }, [
    autoCompress,
    callTool,
    compressHistory,
    context,
    input,
    maxToolRounds,
    model,
    onFileChanges,
    onSend,
    projectToolNames,
    projectTools,
    refreshToken,
    sending,
    tools,
    transcript,
  ]);

  async function applyPendingChanges() {
    if (!onFileChanges || pendingChanges.length === 0) return;
    setApplyingChanges(true);
    setError(null);
    try {
      await onFileChanges(pendingChanges);
      setPendingChanges([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setApplyingChanges(false);
    }
  }

  useImperativeHandle(
    ref,
    () => ({
      send: (text: string) => {
        setInput(text);
        void sendChat(text);
      },
      prefill: (text: string) => {
        setInput(text);
        // Focus after the controlled value paints.
        requestAnimationFrame(() => textareaRef.current?.focus());
      },
    }),
    [sendChat]
  );

  // Click anywhere on the widget re-opens the OAuth dialog while unauthenticated.
  const handleRootClick = useCallback(() => {
    if (!authorized && !oauthOpen) {
      setOauthOpen(true);
    }
  }, [authorized, oauthOpen]);

  return (
    <div
      onClick={handleRootClick}
      className={cn(
        "flex w-full max-w-[640px] min-h-0 flex-col gap-2.5 rounded-xl border bg-card p-4",
        authorized ? "cursor-default opacity-100" : "cursor-pointer opacity-70",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">OpenRouter 聊天</span>
        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); clearChat(); }} disabled={transcript.length === 0}>
          清空聊天
        </Button>
      </div>

      <ModelSelect
        models={models}
        value={model}
        onChange={(id) => {
          setModel(id);
          if (id !== model) {
            const modelName = models.find((item) => item.id === id)?.name ?? id;
            setTranscript((previous) => [...previous, createModelSwitchNotice(modelName)]);
          }
          onModelChange?.(id);
        }}
        loading={modelLoading}
        disabled={!authorized}
      />

      <ChatHistoryWindow messages={transcript} loading={sending && !streamingText} images={images} />

      {pendingChanges.length > 0 && (
        <div className="rounded-md border bg-muted/40 p-3">
          <p className="mb-2 text-xs font-semibold">待应用文件变更</p>
          <div className="mb-3 space-y-1">
            {pendingChanges.map((change) => (
              <div key={change.path} className="text-xs">
                <span className="font-mono">{change.path}</span>
                {change.description ? (
                  <span className="text-muted-foreground"> · {change.description}</span>
                ) : null}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void applyPendingChanges()} disabled={applyingChanges}>
              {applyingChanges ? "应用中…" : "应用变更"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPendingChanges([])} disabled={applyingChanges}>
              丢弃
            </Button>
          </div>
        </div>
      )}

      {error && <p className="whitespace-pre-wrap text-xs text-destructive">{error}</p>}

      <Textarea
        value={input}
        ref={textareaRef}
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

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <span className="min-w-0 text-xs text-muted-foreground" aria-live="polite">
          <span className="block">本次请求约 {formatContextSize(requestTokens)}/{formatContextLimit(selectedModel?.contextLength)}</span>
          <span className="block truncate">{formatContextBreakdown(contextUsage)}</span>
          {compression && (
            <span className="block truncate">
              已压缩 {compression.coveredMessageCount} 条早期消息，摘要{" "}
              {formatContextSize(estimateContextTokens(compression.summary))}
            </span>
          )}
        </span>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              id="chatbox-auto-compress"
              type="checkbox"
              checked={autoCompress}
              onChange={(event) => setAutoCompress(event.target.checked)}
              disabled={!authorized || sending || compressing}
              className="size-4 accent-primary"
            />
            <Label htmlFor="chatbox-auto-compress" className="cursor-pointer text-xs">
              自动压缩
            </Label>
          </div>
          {!autoCompress && (
            <Button
              variant="outline"
              size="sm"
              onClick={async (event) => {
                event.stopPropagation();
                const tk = await refreshToken();
                if (!tk) {
                  setError("未找到可用令牌，请先完成 OAuth 授权。");
                  setOauthOpen(true);
                  return;
                }
                const result = await compressHistory(tk, transcript, 0, true);
                if (result.error) {
                  setError(`上下文压缩失败：${result.error.message}`);
                  return;
                }
                setMessages(result.messages);
                const nextCompression = result.compression;
                if (result.compressionApplied && nextCompression) {
                  setTranscript((previous) => [
                    ...previous,
                    createContextCompressionNotice({
                      coveredMessageCount: nextCompression.coveredMessageCount,
                      summaryTokens: estimateContextTokens(nextCompression.summary),
                    }),
                  ]);
                }
              }}
              disabled={
                !authorized ||
                sending ||
                compressing ||
                llmMessagesFromTranscript(transcript).length === 0
              }
            >
              {compressing ? "压缩中…" : "压缩上下文"}
            </Button>
          )}
          <Button
            onClick={(e) => { e.stopPropagation(); void sendChat(); }}
            disabled={!authorized || sending || !input.trim()}
          >
            {sending ? "发送中…" : "发送"}
          </Button>
        </div>
      </div>

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
});
