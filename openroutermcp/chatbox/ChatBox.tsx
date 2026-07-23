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
  getModelProviders,
  listModels,
  OPENROUTER_WEB_SEARCH_TOOL,
  type ChatMessage,
  type ChatTool,
  type ModelInfo,
} from "@/lib/openrouter";
import { CircleAlert, CircleCheck, Loader2, SlidersHorizontal, Trash2 } from "lucide-react";
import { useOpenRouterMcp } from "@/lib/openrouter-provider/useOpenRouterMcp";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLang, type Lang } from "@/lib/i18n";
import { localizePlatformErrorMessage } from "@/lib/platform-errors";
import { cn } from "@/lib/utils";
import {
  isOpenAICompatibleConfigured,
  loadOpenAICompatibleSettings,
  DEFAULT_OPENAI_COMPATIBLE_SETTINGS,
  type OpenAICompatibleSettings,
} from "@/lib/openai-compatible-settings";
import {
  trackChatSent,
  trackModelSelected,
  trackToolCalled,
} from "@/lib/analytics";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverPopup,
  PopoverPortal,
  PopoverPositioner,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ModelSelect } from "./ModelSelect";
import { ChatHistoryWindow } from "./ChatHistoryWindow";
import { extractImages, type ExtractedToolImage } from "./chatRender";
import {
  estimateContextUsage,
  estimateContextTokens,
  formatContextLimitForLang,
  formatContextSize,
} from "./contextSize";
import {
  buildCompressedLlmMessages,
  buildCompressionPrompt,
  fingerprintMessages,
  planContextCompression,
  type ChatCompressionState,
} from "./contextCompression";
import {
  applyGoalAssessment,
  applySetGoalToolInput,
  createGoalState,
  decideGoalContinuation,
  isGoalContinuationRequest,
  isTaskLikeRequest,
  pauseGoalAfterContinuationLimit,
  parseGoalAssessment,
  type GoalState,
} from "./goalMode";
import { pickInitialModelId } from "./modelSelection";
import {
  createContextCompressionNotice,
  createGoalStatusNotice,
  createModelSwitchNotice,
  llmMessagesFromTranscript,
  type ChatTranscriptItem,
} from "./transcript";
import { findLastUserInput } from "./inputHistory";

const LS_MODEL = "chatbox_model";
const LS_CHAT_PROVIDER = "chatbox_provider";
const LS_DISABLED_PROVIDERS = "chatbox_disabled_providers";
const LS_MESSAGES = "chatbox_messages";
const LS_IMAGES = "chatbox_images";
const LS_AUTO_COMPRESS = "chatbox_auto_compress";
const LS_COMPRESSION = "chatbox_context_compression";
const LS_GOAL = "chatbox_goal";
const LS_GOAL_MODE = "chatbox_goal_mode";
const MAX_GOAL_NO_PROGRESS = 2;
const MODEL_LOG_PREFIX = "[ChatBox:model]";
type ChatProviderId = "openrouter" | "custom-openai";

function logModelEvent(event: string, details?: Record<string, unknown>) {
  console.info(MODEL_LOG_PREFIX, event, details ?? "");
}

function modelStorageDiagnostics() {
  try {
    return {
      origin: window.location.origin,
      keys: Object.keys(window.localStorage).filter((key) => key.startsWith(LS_MODEL)),
      values: Object.fromEntries(
        Object.keys(window.localStorage)
          .filter((key) => key.startsWith(LS_MODEL))
          .map((key) => [key, window.localStorage.getItem(key)])
      ),
    };
  } catch (error) {
    return {
      storageError: error instanceof Error ? error.message : String(error),
    };
  }
}

function loadStoredChatProvider(): ChatProviderId {
  try {
    return window.localStorage.getItem(LS_CHAT_PROVIDER) === "custom-openai"
      ? "custom-openai"
      : "openrouter";
  } catch {
    return "openrouter";
  }
}

const CHAT_SYSTEM_COPY = {
  zh: {
    tools:
      "你可以通过调用提供的 MCP 工具来获取信息或执行操作。" +
      "如果用户需要当前或外部网页信息，请调用 web_search；它会返回网页标题、链接和摘要。" +
      "当用户的需求需要工具时，请调用最合适的工具；工具返回结果后，再基于结果继续回答。" +
      "只在确实需要的时调用工具，不要编造工具参数。",
    projectTools:
      "项目正文和素材不会默认附带在请求中；当前项目概况会随请求发送。如果需要了解或操作项目内容，请先调用 genstory_list_project_files、genstory_read_project_file 或 genstory_search_project_files 精确读取；移动图片等二进制文件时调用 genstory_move_project_file。",
    fileChanges:
      "\n\n如果你要修改项目文件，请在回答末尾追加一个 JSON 代码块，格式为：```json\n{\"fileChanges\":[{\"path\":\"chapter-001/pages/page-001.md\",\"content\":\"完整文件内容\",\"description\":\"修改说明\"}]}\n```。path 必须是项目内相对路径，content 必须是完整文件内容。",
    contextHeader: "当前项目概况（非完整文件内容）：",
    goal:
      "\n\n把任务型用户请求当作一个 goal，负责推进到完成，不要因为非关键偏好而停下来提问。" +
      "例如用户说“帮我画个人”，可以采用合理的中性默认设定继续，不要追问国籍等不影响任务完成的细节。" +
      "只有缺少改变任务含义或安全性的关键依赖、需要用户授权不可逆操作，或连续没有进展时才暂停。" +
      "每次准备结束前都要自检：目标是否完成、完成是否有工具结果或文件状态等证据、是否存在关键依赖、能否自行解决依赖、是否在空转。" +
      "目标状态必须通过本地工具 set_goal 或 clear_goal 更新，不要用普通文本或末尾 JSON 更新 goal。" +
      "开始、进展、暂停或阻塞时调用 set_goal；完成时调用 set_goal 且 status=complete，并提供 evidence；如果目标不再需要展示，调用 clear_goal。",
  },
  en: {
    tools:
      "You can call the provided MCP tools to gather information or perform actions. " +
      "When the user needs current or external web information, call web_search; it returns page titles, links, and excerpts. " +
      "When the user's request needs a tool, call the most appropriate tool; after the tool returns, continue your answer based on the result. " +
      "Only call tools when they are actually needed, and do not invent tool arguments.",
    projectTools:
      "Project content and assets are not included by default; the current project overview is sent with the request. If you need to inspect or operate on project content, first call genstory_list_project_files, genstory_read_project_file, or genstory_search_project_files; use genstory_move_project_file to move images and other binary files.",
    fileChanges:
      '\n\nIf you need to modify project files, append a JSON code block at the end of your answer in this format: ```json\n{"fileChanges":[{"path":"chapter-001/pages/page-001.md","content":"complete file content","description":"change description"}]}\n```. path must be project-relative, and content must contain the complete file content.',
    contextHeader: "Current project overview (not complete file content):",
    goal:
      "\n\nTreat task-like user requests as goals and keep working toward completion; do not stop for optional preferences." +
      'For example, if the user says "draw a person", choose a reasonable neutral default instead of asking about nationality or other details that do not affect completion.' +
      "Pause only when a missing dependency changes the meaning or safety of the task, an irreversible action needs user authorization, or there is repeated no progress." +
      "Before ending, self-check: is the goal complete, is there evidence such as a tool result or file state, are key dependencies missing, can the agent resolve them, and is it spinning?" +
      "Update goal state only by calling the local set_goal or clear_goal tools; do not update goals with plain text or trailing JSON." +
      "Call set_goal when starting, progressing, pausing, or blocking; when complete, call set_goal with status=complete and evidence; call clear_goal when the goal should no longer be shown.",
  },
} satisfies Record<
  Lang,
  {
    tools: string;
    projectTools: string;
    fileChanges: string;
    contextHeader: string;
    goal: string;
  }
>;

function buildChatSystemPrompt(input: {
  lang: Lang;
  hasProjectTools: boolean;
  canChangeFiles: boolean;
  context?: string;
  goalMode: "auto" | "off";
}): string {
  const copy = CHAT_SYSTEM_COPY[input.lang];
  return (
    copy.tools +
    (input.hasProjectTools ? copy.projectTools : "") +
    (input.canChangeFiles ? copy.fileChanges : "") +
    (input.goalMode === "auto" ? copy.goal : "") +
    (input.context ? `\n\n${copy.contextHeader}\n${input.context}` : "")
  );
}

function buildGoalContinuationPrompt(
  lang: Lang,
  reason: "needs-verification" | "needs-next-action",
  goal: GoalState
): string {
  if (lang === "zh") {
    return reason === "needs-verification"
      ? `继续处理目标“${goal.objective}”。不要结束回复，先补充并检查可验证的完成证据；如果还缺关键依赖，优先自行解决。`
      : `继续处理目标“${goal.objective}”。执行下一步：${goal.nextAction || "采取最直接的可执行动作"}。不要因可选偏好向用户提问。`;
  }
  return reason === "needs-verification"
    ? `Continue working on "${goal.objective}". Do not end yet; add and verify checkable completion evidence, resolving any solvable dependency first.`
    : `Continue working on "${goal.objective}". Take the next action: ${goal.nextAction || "take the most direct executable action"}. Do not ask the user about optional preferences.`;
}

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

function loadStoredModel(key: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

export interface ChatBoxProps {
  /** Placeholder text for the input. */
  placeholder?: string;
  /** Max agent-loop iterations per send. Defaults to 8. */
  maxToolRounds?: number;
  /** Automatically track task-like requests as goals. Defaults to "auto". */
  goalMode?: "auto" | "off";
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
  onToolImages?: (input: {
    images: ExtractedToolImage[];
    toolCallId: string;
    toolName: string;
  }) => Promise<{ path: string; toolCallId: string; toolName: string }[]>;
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
    placeholder,
    maxToolRounds = 8,
    goalMode = "auto",
    context,
    chatId,
    onModelChange,
    onSend,
    onFileChanges,
    onToolImages,
    projectTools = [],
    className,
  }: ChatBoxProps,
  ref
) {
  const { lang, t } = useLang();
  const { status, isAuthorized, ready, tools, connect, callTool, refreshToken, authorize } =
    useOpenRouterMcp();
  const [apiSettings, setApiSettings] = useState<OpenAICompatibleSettings>(
    DEFAULT_OPENAI_COMPATIBLE_SETTINGS
  );
  const [apiSettingsReady, setApiSettingsReady] = useState(false);
  const customApiConfigured =
    apiSettingsReady && isOpenAICompatibleConfigured(apiSettings);
  const [chatProvider, setChatProvider] =
    useState<ChatProviderId>("openrouter");
  const [chatProviderStorageReady, setChatProviderStorageReady] = useState(false);

  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelLoading, setModelLoading] = useState(true);
  const [model, setModel] = useState<string>("");
  const [providersByModel, setProvidersByModel] = useState<
    Record<string, { name: string; slug: string }[]>
  >({});
  const [providerLoading, setProviderLoading] = useState(false);
  const [disabledProviders, setDisabledProviders] = useState<Record<string, string[]>>({});
  const [providerStorageReady, setProviderStorageReady] = useState(false);
  const restoredStorageKeyRef = useRef<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [transcript, setTranscript] = useState<ChatTranscriptItem[]>([]);
  const [images, setImages] = useState<Record<string, string>>({});
  const [goal, setGoal] = useState<GoalState | null>(null);
  const [goalEnabled, setGoalEnabled] = useState(goalMode === "auto");
  const [compression, setCompression] = useState<ChatCompressionState | null>(null);
  const [autoCompress, setAutoCompress] = useState(false);
  const [compressionStorageReady, setCompressionStorageReady] = useState(false);
  const [goalModeStorageReady, setGoalModeStorageReady] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [chatStorageReady, setChatStorageReady] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingText, setStreamingText] = useState(false);
  const [applyingChanges, setApplyingChanges] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<ChatFileChange[]>([]);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const goalRef = useRef<GoalState | null>(null);

  const [oauthOpen, setOauthOpen] = useState(false);

  useEffect(() => {
    setApiSettings(loadOpenAICompatibleSettings());
    setApiSettingsReady(true);
  }, []);

  useEffect(() => {
    // Restore the selected provider after hydration because it is browser-only state.
    setChatProvider(loadStoredChatProvider());
    setChatProviderStorageReady(true);
  }, []);

  useEffect(() => {
    if (chatProvider === "custom-openai" && apiSettingsReady && !customApiConfigured) {
      setChatProvider("openrouter");
    }
  }, [apiSettingsReady, chatProvider, customApiConfigured]);

  const activeCustomApi = chatProvider === "custom-openai" && customApiConfigured;
  const activeApiSettings = activeCustomApi ? apiSettings : null;
  const providerOptions = useMemo(
    () => [
      { id: "openrouter", name: t("chat.providerOpenRouter") },
      { id: "custom-openai", name: t("chat.providerCustomOpenAI") },
    ],
    [t]
  );
  const selectedProviderLabel =
    providerOptions.find((option) => option.id === chatProvider)?.name ??
    t("chat.providerOpenRouter");
  const authorized =
    chatProvider === "openrouter"
      ? isAuthorized && status === "connected"
      : activeCustomApi;
  const contextUsage = useMemo(
    () => estimateContextUsage({ context, messages, input }),
    [context, messages, input]
  );
  const selectedModel = useMemo(
    () => {
      const item = models.find((candidate) => candidate.id === model);
      return item ? { ...item, providers: providersByModel[model] } : undefined;
    },
    [model, models, providersByModel]
  );
  const displayModels = useMemo(() => {
    if (!model || models.some((item) => item.id === model)) return models;
    return [{ id: model, name: model }, ...models];
  }, [model, models]);
  const selectedDisabledProviders = useMemo(
    () => disabledProviders[model] ?? [],
    [disabledProviders, model]
  );
  const selectedProviderOnly = useMemo(() => {
    if (!selectedModel?.providers?.length) return undefined;
    const disabled = new Set(selectedDisabledProviders);
    const enabled = selectedModel.providers
      .map((provider) => provider.slug)
      .filter((slug) => !disabled.has(slug));
    return enabled.length ? enabled : [selectedModel.providers[0].slug];
  }, [selectedDisabledProviders, selectedModel]);
  const requestTokens = contextUsage.context + contextUsage.history + contextUsage.input;
  const goalModeActive = goalMode === "auto" && goalEnabled;
  const projectToolNames = useMemo(
    () => new Set(projectTools.map((tool) => tool.name)),
    [projectTools]
  );
  const updateGoal = useCallback((next: GoalState | null) => {
    const previous = goalRef.current;
    goalRef.current = next;
    setGoal(next);
    const status = next?.status;
    if (
      next &&
      (status === "blocked" || status === "stalled") &&
      previous?.status !== status
    ) {
      setTranscript((current) => [
        ...current,
        createGoalStatusNotice({
          status,
          blocker: next.blocker,
          nextAction: next.nextAction,
        }, lang),
      ]);
    }
  }, [lang]);

  const handleChatProviderChange = useCallback((next: string) => {
    if (next !== "openrouter" && next !== "custom-openai") return;
    const nextProvider = next as ChatProviderId;
    if (nextProvider === chatProvider) return;
    if (nextProvider === "custom-openai" && !customApiConfigured) {
      setError(t("chat.customApiNotConfigured"));
      return;
    }
    setChatProvider(nextProvider);
    setModels([]);
    setModel("");
    setProvidersByModel({});
    setProviderLoading(false);
    setError(null);
    setOauthOpen(false);
    restoredStorageKeyRef.current = null;
  }, [chatProvider, customApiConfigured, t]);

  // --- init: load models for the selected provider ---
  useEffect(() => {
    if (!apiSettingsReady || !chatProviderStorageReady) return;
    let cancelled = false;
    setModelLoading(true);
    logModelEvent("model list loading started", { provider: chatProvider });
    listModels(activeApiSettings)
      .then((ms) => {
        logModelEvent("model list loaded", {
          cancelled,
          provider: chatProvider,
          count: ms.length,
          modelIds: ms.map((item) => item.id),
        });
        if (cancelled) return;
        setModels(ms);
      })
      .catch((error) => {
        logModelEvent("model list failed", {
          provider: chatProvider,
          error: error instanceof Error ? error.message : String(error),
        });
        if (!cancelled && activeCustomApi) {
          setModels([]);
          setModel("");
          setError(t("chat.customApiModelListFailed"));
        }
      })
      .finally(() => {
        logModelEvent("model list loading finished", {
          cancelled,
          provider: chatProvider,
        });
        if (!cancelled) setModelLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    activeApiSettings,
    activeCustomApi,
    apiSettingsReady,
    chatProvider,
    chatProviderStorageReady,
    t,
  ]);

  useEffect(() => {
    if (modelLoading) {
      logModelEvent("restore skipped while model list is loading", { chatId });
      return;
    }
    // In project-scoped chats, wait for the project id. The editor initially
    // renders ChatBox without chatId while the project is loading; restoring
    // the global default at that point can overwrite the eventual project
    // selection during the same mount.
    if (!chatId && restoredStorageKeyRef.current !== LS_MODEL) {
      logModelEvent("restore skipped until chat id is available");
      return;
    }
    const chatStorageKey = storageKey(LS_MODEL, chatId);
    if (restoredStorageKeyRef.current === chatStorageKey) return;
    const savedChatModel = loadStoredModel(chatStorageKey);
    const savedGlobalModel = loadStoredModel(LS_MODEL);
    const savedModel = savedChatModel || savedGlobalModel;
    const restoredModel =
      pickInitialModelId(models, {
        chatModelId: savedChatModel,
        globalModelId: savedGlobalModel,
      }) || savedModel;

    logModelEvent("model restore decision", {
      chatId: chatId ?? null,
      chatStorageKey,
      savedChatModel: savedChatModel || null,
      savedGlobalModel: savedGlobalModel || null,
      savedModel: savedModel || null,
      restoredModel: restoredModel || null,
      savedModelInLoadedList: savedModel ? models.some((item) => item.id === savedModel) : false,
      loadedModelIds: models.map((item) => item.id),
      storage: modelStorageDiagnostics(),
    });

    // Restore the saved id even when the model index is temporarily incomplete.
    // The next model refresh can enrich it with provider metadata without
    // silently replacing the user's choice with Free Models Router.
    setModel(restoredModel);
    restoredStorageKeyRef.current = chatStorageKey;
  }, [chatId, modelLoading, models]);

  useEffect(() => {
    if (!model || providersByModel[model]) return;
    let cancelled = false;
    setProviderLoading(true);
    logModelEvent("provider loading started", { modelId: model });
    getModelProviders(model, activeApiSettings)
      .then((providers) => {
        if (cancelled) return;
        setProvidersByModel((current) => ({ ...current, [model]: providers }));
        logModelEvent("provider loading finished", { modelId: model, providers });
      })
      .catch((error) => {
        logModelEvent("provider loading failed", {
          modelId: model,
          error: error instanceof Error ? error.message : String(error),
        });
      })
      .finally(() => {
        if (!cancelled) setProviderLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeApiSettings, model, providersByModel]);

  useEffect(() => {
    setAutoCompress(loadJSON<boolean>(LS_AUTO_COMPRESS, false));
    setCompressionStorageReady(true);
  }, []);

  useEffect(() => {
    setDisabledProviders(loadJSON<Record<string, string[]>>(LS_DISABLED_PROVIDERS, {}));
    setProviderStorageReady(true);
  }, []);

  useEffect(() => {
    if (!providerStorageReady) return;
    window.localStorage.setItem(LS_DISABLED_PROVIDERS, JSON.stringify(disabledProviders));
  }, [disabledProviders, providerStorageReady]);

  useEffect(() => {
    if (!chatProviderStorageReady) return;
    window.localStorage.setItem(LS_CHAT_PROVIDER, chatProvider);
  }, [chatProvider, chatProviderStorageReady]);

  useEffect(() => {
    setGoalEnabled(goalMode === "auto" && loadJSON<boolean>(LS_GOAL_MODE, true));
    setGoalModeStorageReady(true);
  }, [goalMode]);

  useEffect(() => {
    setChatStorageReady(false);
    const storedTranscript = loadJSON<ChatTranscriptItem[]>(
      storageKey(LS_MESSAGES, chatId),
      []
    );
    setMessages(llmMessagesFromTranscript(storedTranscript));
    setTranscript(storedTranscript);
    setImages(loadJSON<Record<string, string>>(storageKey(LS_IMAGES, chatId), {}));
    const storedGoal = loadJSON<GoalState | null>(
      storageKey(LS_GOAL, chatId),
      null
    );
    goalRef.current = storedGoal;
    setGoal(storedGoal);
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
    if (
      !apiSettingsReady ||
      !chatProviderStorageReady ||
      chatProvider !== "openrouter"
    ) {
      setOauthOpen(false);
      return;
    }
    if (!ready) return;
    if (isAuthorized) {
      void connect();
    } else {
      setOauthOpen(true);
    }
    // Run once when the provider becomes ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiSettingsReady, chatProvider, chatProviderStorageReady, ready]);

  // Close the dialog automatically once the handshake completes successfully.
  useEffect(() => {
    if (
      chatProvider === "openrouter" &&
      ready &&
      isAuthorized &&
      status === "connected" &&
      oauthOpen
    ) {
      setOauthOpen(false);
    }
  }, [chatProvider, ready, isAuthorized, status, oauthOpen]);

  // --- persist chat state to localStorage ---
  // Model selections are written only after an explicit user choice. Automatic
  // defaults remain derived from the current chat and global preferences.
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
    if (!chatStorageReady) return;
    const key = storageKey(LS_GOAL, chatId);
    if (goal) {
      window.localStorage.setItem(key, JSON.stringify(goal));
    } else {
      window.localStorage.removeItem(key);
    }
  }, [goal, chatId, chatStorageReady]);

  useEffect(() => {
    if (!compressionStorageReady) return;
    window.localStorage.setItem(LS_AUTO_COMPRESS, JSON.stringify(autoCompress));
  }, [autoCompress, compressionStorageReady]);

  useEffect(() => {
    if (!goalModeStorageReady || goalMode !== "auto") return;
    window.localStorage.setItem(LS_GOAL_MODE, JSON.stringify(goalEnabled));
  }, [goalEnabled, goalMode, goalModeStorageReady]);

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
    updateGoal(null);
    setCompression(null);
    setError(null);
  }, [updateGoal]);

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
            lang,
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
            lang,
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
            lang,
          }),
          undefined,
          { providerOnly: selectedProviderOnly, apiSettings: activeApiSettings }
        );
        const summary = result.content?.trim();
        if (!summary) throw new Error(t("chat.emptySummary"));

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
            lang,
          }),
          compression: nextCompression,
          compressionApplied: true,
        };
      } catch (error) {
        return {
          messages: buildCompressedLlmMessages({
            summary: currentCompression?.summary,
            recentMessages: plan.recentMessages,
            lang,
          }),
          compression: currentCompression,
          compressionApplied: false,
          error: error instanceof Error ? error : new Error(String(error)),
        };
      } finally {
        setCompressing(false);
      }
    },
    [
      activeApiSettings,
      compression,
      context,
      lang,
      model,
      selectedModel?.contextLength,
      selectedProviderOnly,
      t,
    ]
  );

  const sendChat = useCallback(
    async (presetText?: string) => {
      const text = (presetText ?? input).trim();
      if (!text || sending) return;

      const tk = activeCustomApi ? apiSettings.apiKey : await refreshToken();
      if (!tk) {
        setError(t("chat.noToken"));
        setOauthOpen(true);
        return;
      }
      if (tools.length === 0 && projectTools.length === 0) {
        setError(t("chat.noTools"));
        return;
      }

      const previousGoal = goalRef.current;
      const turnGoal =
        goalModeActive && isTaskLikeRequest(text)
          ? createGoalState(text)
          : goalModeActive &&
              previousGoal &&
              previousGoal.status !== "complete" &&
              (previousGoal.status === "blocked" ||
                isGoalContinuationRequest(text))
            ? {
                ...previousGoal,
                status: "active" as const,
                blocker: "",
                nextAction: "",
                noProgressCount: 0,
                lastProgressFingerprint: "",
                updatedAt: Date.now(),
            }
            : null;
      updateGoal(turnGoal);
      let goalForTurn = turnGoal;

      const goalTools: ChatProjectTool[] = goalModeActive
        ? [
            {
              name: "set_goal",
              description:
                "Locally set the current goal state. Use this when starting, progressing, completing, blocking, or pausing a task goal.",
              inputSchema: {
                type: "object",
                properties: {
                  objective: { type: "string" },
                  status: {
                    type: "string",
                    enum: ["in_progress", "active", "complete", "blocked", "stalled"],
                  },
                  summary: { type: "string" },
                  evidence: { type: "array", items: { type: "string" } },
                  missingDependencies: { type: "array", items: { type: "string" } },
                  resolvableDependencies: { type: "array", items: { type: "string" } },
                  userDependencies: { type: "array", items: { type: "string" } },
                  resolvedDependencies: { type: "array", items: { type: "string" } },
                  blocker: { type: "string" },
                  nextAction: { type: "string" },
                },
                required: ["status", "summary"],
              },
              call: (args) => {
                const next = applySetGoalToolInput(
                  goalForTurn ?? goalRef.current,
                  args,
                  text
                );
                goalForTurn = next;
                updateGoal(next);
                return { goal: next };
              },
            },
            {
              name: "clear_goal",
              description:
                "Locally clear the current goal when it is complete, cancelled, or no longer needs to be displayed.",
              inputSchema: {
                type: "object",
                properties: {
                  reason: { type: "string" },
                },
              },
              call: (args) => {
                goalForTurn = null;
                updateGoal(null);
                return {
                  cleared: true,
                  reason: typeof args.reason === "string" ? args.reason : "",
                };
              },
            },
          ]
        : [];
      const goalToolNames = new Set(goalTools.map((tool) => tool.name));

      const runtimeTools = [
        ...goalTools.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.inputSchema ?? { type: "object", properties: {} },
        })),
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
      const mcpTools: ChatTool[] = [
        ...runtimeTools.map((t) => ({
          type: "function" as const,
          function: { name: t.name, description: t.description, parameters: t.inputSchema },
        })),
        ...(activeCustomApi ? [] : [OPENROUTER_WEB_SEARCH_TOOL]),
      ];

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
      trackChatSent({
        model,
        messageLength: text.length,
        hasContext: Boolean(context),
        mcpToolCount: tools.length,
        projectToolCount: projectTools.length,
        autoCompress,
      });

      const systemMsg: ChatMessage = {
        role: "system",
        content: buildChatSystemPrompt({
          lang,
          hasProjectTools: projectTools.length > 0,
          canChangeFiles: Boolean(onFileChanges),
          context,
          goalMode: goalModeActive ? "auto" : "off",
        }),
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
          setError(t("chat.compressionFallback", { message: compressed.error.message }));
        }
        if (compressed.compressionApplied && compressed.compression) {
          displayTranscript = [
            ...displayTranscript,
            createContextCompressionNotice({
              coveredMessageCount: compressed.compression.coveredMessageCount,
              summaryTokens: estimateContextTokens(compressed.compression.summary),
            }, lang),
          ];
          setTranscript(displayTranscript);
        }
        setMessages(history);
      }

      for (let i = 0; i < maxToolRounds; i++) {
        const apiMessages = runtimeTools.length ? [systemMsg, ...history] : history;
        let streamedContent = "";
        const { content, toolCalls } = await chat(tk, model, apiMessages, mcpTools, {
          providerOnly: selectedProviderOnly,
          apiSettings: activeApiSettings,
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
          if (!goalForTurn && goalModeActive) {
            goalForTurn = createGoalState(text);
            updateGoal(goalForTurn);
          }
          if (goalForTurn) {
            goalForTurn = {
              ...goalForTurn,
              noProgressCount: 0,
              lastProgressFingerprint: "",
              updatedAt: Date.now(),
            };
            updateGoal(goalForTurn);
          }
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
            const toolSource = goalToolNames.has(tc.function.name)
              ? "local"
              : projectToolNames.has(tc.function.name)
              ? "project"
              : "mcp";
            try {
              const args = tc.function.arguments ? JSON.parse(tc.function.arguments) as Record<string, unknown> : {};
              const localTool =
                toolSource === "local"
                  ? goalTools.find((tool) => tool.name === tc.function.name)
                  : toolSource === "project"
                    ? projectTools.find((tool) => tool.name === tc.function.name)
                    : undefined;
              const res = localTool
                ? await localTool.call(args)
                : await callTool(tc.function.name, args);
              // Replace inline image base64 with a stable id reference so the
              // data never enters the chat context sent back to the model.
               const extracted: ExtractedToolImage[] = [];
               const display = extractImages(res, collected, extracted);
               resultText = JSON.stringify(display, null, 2);
               if (extracted.length > 0 && onToolImages) {
                 const saved = await onToolImages({
                   images: extracted,
                   toolCallId: tc.id,
                   toolName: tc.function.name,
                 });
                 if (saved.length > 0) resultText += `\n[toolImages] ${JSON.stringify(saved)}`;
               }
              trackToolCalled({
                toolName: tc.function.name,
                source: toolSource,
                success: true,
              });
                } catch (e) {
                  trackToolCalled({
                    toolName: tc.function.name,
                    source: toolSource,
                    success: false,
                  });
                  resultText = t("chat.toolCallFailed", {
                    message: e instanceof Error ? e.message : String(e),
                  });
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

        if (goalForTurn) {
          const assessment = parseGoalAssessment(finalContent);
          if (assessment) {
            goalForTurn = applyGoalAssessment(goalForTurn, assessment);
          }
          const decision = decideGoalContinuation({
            goal: goalForTurn,
            responseFingerprint: fingerprintMessages([
              { role: "assistant", content: finalContent ?? "" },
            ]),
            maxNoProgress: MAX_GOAL_NO_PROGRESS,
          });
          goalForTurn = decision.goal;
          updateGoal(goalForTurn);
          if (decision.action === "continue" && i < maxToolRounds - 1) {
            const continuationReason =
              decision.reason === "needs-verification" ||
              decision.reason === "needs-next-action"
                ? decision.reason
                : "needs-next-action";
            history.push({
              role: "user",
              content: buildGoalContinuationPrompt(
                lang,
                continuationReason,
                goalForTurn
              ),
            });
            setMessages([...history]);
            continue;
          }
          if (decision.action === "continue") {
            goalForTurn = pauseGoalAfterContinuationLimit(
              goalForTurn,
              decision.reason
            );
            updateGoal(goalForTurn);
          }
        }
        break;
      }
    } catch (e) {
      setError(localizePlatformErrorMessage(e instanceof Error ? e.message : String(e), lang));
    } finally {
      setSending(false);
      setStreamingText(false);
    }
  }, [
    autoCompress,
    activeApiSettings,
    activeCustomApi,
    apiSettings,
    callTool,
    compressHistory,
    context,
    goalModeActive,
    input,
    lang,
    maxToolRounds,
    model,
    onFileChanges,
    onToolImages,
    onSend,
    projectToolNames,
    projectTools,
    refreshToken,
    sending,
    selectedProviderOnly,
    t,
    tools,
    transcript,
    updateGoal,
  ]);

  async function applyPendingChanges() {
    if (!onFileChanges || pendingChanges.length === 0) return;
    setApplyingChanges(true);
    setError(null);
    try {
      await onFileChanges(pendingChanges);
      setPendingChanges([]);
    } catch (e) {
      setError(localizePlatformErrorMessage(e instanceof Error ? e.message : String(e), lang));
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
    if (!authorized && !customApiConfigured && !oauthOpen) {
      setOauthOpen(true);
    }
  }, [authorized, customApiConfigured, oauthOpen]);

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
        <span className="text-sm font-semibold">{t("chat.title")}</span>
        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); clearChat(); }} disabled={transcript.length === 0}>
          {t("chat.clear")}
        </Button>
      </div>

      <ModelSelect
        models={displayModels}
        value={model}
        onChange={(id) => {
          logModelEvent("model selected by user", {
            previousModel: model || null,
            nextModel: id,
            chatStorageKey: storageKey(LS_MODEL, chatId),
          });
          setModel(id);
          try {
            const chatStorageKey = storageKey(LS_MODEL, chatId);
            window.localStorage.setItem(LS_MODEL, id);
            window.localStorage.setItem(chatStorageKey, id);
            logModelEvent("model selection persisted", {
              globalKey: LS_MODEL,
              chatKey: chatStorageKey,
              globalReadback: window.localStorage.getItem(LS_MODEL),
              chatReadback: window.localStorage.getItem(chatStorageKey),
              storage: modelStorageDiagnostics(),
            });
          } catch (error) {
            logModelEvent("model selection persistence failed", {
              error: error instanceof Error ? error.message : String(error),
              storage: modelStorageDiagnostics(),
            });
          }
          if (id !== model) {
            const modelName = models.find((item) => item.id === id)?.name ?? id;
            setTranscript((previous) => [...previous, createModelSwitchNotice(modelName, lang)]);
            trackModelSelected({ model: id });
          }
          onModelChange?.(id);
        }}
        providerOptions={providerOptions}
        selectedProvider={chatProvider}
        onProviderChange={handleChatProviderChange}
        providerLabel={selectedProviderLabel}
        loading={modelLoading}
        disabled={!apiSettingsReady}
      />

      {goal && goalModeActive && (
        <div
          className={cn(
            "rounded-md border px-3 py-2 text-xs",
            goal.status === "complete" && "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950",
            goal.status === "blocked" && "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950",
            goal.status === "stalled" && "border-destructive/30 bg-destructive/10",
            goal.status === "active" && "border-primary/30 bg-primary/5"
          )}
        >
          <div className="flex items-center gap-2 font-semibold">
            <div className="flex min-w-0 items-center gap-2">
              {goal.status === "complete" ? (
                <CircleCheck className="size-3.5 text-emerald-600" />
              ) : goal.status === "active" && sending ? (
                <Loader2 className="size-3.5 animate-spin text-primary" />
              ) : (
                <CircleAlert className="size-3.5 text-amber-600" />
              )}
              <span>
                {goal.status === "complete"
                  ? t("chat.goalComplete")
                  : goal.status === "blocked"
                    ? t("chat.goalBlocked")
                    : goal.status === "stalled"
                      ? t("chat.goalStalled")
                      : t("chat.goalActive")}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={t("chat.clearGoal")}
              title={t("chat.clearGoal")}
              onClick={() => updateGoal(null)}
            >
              <Trash2 />
            </Button>
          </div>
          <p className="mt-1 truncate text-muted-foreground">
            {t("chat.goalObjective", { objective: goal.objective })}
          </p>
          {goal.blocker && goal.status === "blocked" && (
            <p className="mt-1 text-amber-700 dark:text-amber-300">
              {t("chat.goalBlocker", { blocker: goal.blocker })}
            </p>
          )}
          {goal.nextAction && (goal.status === "active" || goal.status === "stalled") && (
            <p className="mt-1 text-muted-foreground">
              {t("chat.goalNextAction", { action: goal.nextAction })}
            </p>
          )}
        </div>
      )}

      <ChatHistoryWindow messages={transcript} loading={sending && !streamingText} images={images} />

      {pendingChanges.length > 0 && (
        <div className="rounded-md border bg-muted/40 p-3">
          <p className="mb-2 text-xs font-semibold">{t("chat.pendingChanges")}</p>
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
              {applyingChanges ? t("chat.applyingChanges") : t("chat.applyChanges")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPendingChanges([])} disabled={applyingChanges}>
              {t("chat.discard")}
            </Button>
          </div>
        </div>
      )}

      {error && <p className="whitespace-pre-wrap text-xs text-destructive">{error}</p>}

      <div className="rounded-lg border bg-background transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20">
        <Textarea
          value={input}
          ref={textareaRef}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp" && !input.trim()) {
              const previousInput = findLastUserInput(transcript);
              if (previousInput) {
                e.preventDefault();
                setInput(previousInput);
              }
              return;
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void sendChat();
            }
          }}
          rows={3}
          placeholder={authorized ? (placeholder ?? t("chat.placeholder")) : t("chat.authPlaceholder")}
          disabled={!authorized}
          className="min-h-24 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center gap-2 border-t px-3 pb-2 pt-2" aria-live="polite">
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              {formatContextSize(requestTokens).replace(/\s+tokens$/, "")}/{formatContextLimitForLang(selectedModel?.contextLength, lang)}
              {compression ? ` · ${t("chat.compressedCount", { count: compression.coveredMessageCount })}` : ""}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={!authorized}
                    aria-label={t("chat.compressionOptionsLabel")}
                    title={t("chat.compressionOptionsLabel")}
                  />
                }
              >
                <SlidersHorizontal />
              </PopoverTrigger>
              <PopoverPortal>
                <PopoverPositioner side="top" align="end" sideOffset={6} className="w-72">
                  <PopoverPopup onClick={(e) => e.stopPropagation()} className="p-3">
                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="text-sm font-medium">{t("chat.compressionOptions")}</p>
                        <p className="text-xs text-muted-foreground">{t("chat.compressionDescription")}</p>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2">
                        <Label htmlFor="chatbox-auto-compress" className="cursor-pointer text-xs">
                          {t("chat.autoCompress")}
                        </Label>
                        <input
                          id="chatbox-auto-compress"
                          type="checkbox"
                          checked={autoCompress}
                          onChange={(event) => setAutoCompress(event.target.checked)}
                          disabled={!authorized || sending || compressing}
                          className="size-4 accent-primary"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2">
                        <Label htmlFor="chatbox-goal-mode" className="cursor-pointer text-xs">
                          {t("chat.goalMode")}
                        </Label>
                        <input
                          id="chatbox-goal-mode"
                          type="checkbox"
                          checked={goalEnabled}
                          onChange={(event) => {
                            const enabled = event.target.checked;
                            setGoalEnabled(enabled);
                            if (!enabled) updateGoal(null);
                          }}
                          disabled={!authorized || sending || compressing}
                          className="size-4 accent-primary"
                        />
                      </div>
                      {providerLoading ? (
                        <p className="text-xs text-muted-foreground">{t("chat.providerLoading")}</p>
                      ) : selectedModel?.providers?.length ? (
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-medium">{t("chat.providerOptions")}</p>
                            <p className="text-xs text-muted-foreground">{t("chat.providerDescription")}</p>
                          </div>
                          <div className="space-y-1 rounded-md bg-muted/40 p-2">
                            {selectedModel.providers.map((provider) => {
                              const checked = !selectedDisabledProviders.includes(provider.slug);
                              const enabledCount =
                                selectedModel.providers!.length - selectedDisabledProviders.length;
                              return (
                                <label key={provider.slug} className="flex items-center gap-2 px-1 py-1 text-xs">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(event) => {
                                      setDisabledProviders((current) => {
                                        const currentDisabled = new Set(current[model] ?? []);
                                        if (event.target.checked) currentDisabled.delete(provider.slug);
                                        else currentDisabled.add(provider.slug);
                                        return {
                                          ...current,
                                          [model]: [...currentDisabled],
                                        };
                                      });
                                    }}
                                    disabled={!authorized || sending || compressing || (checked && enabledCount <= 1)}
                                    className="size-4 accent-primary"
                                  />
                                  <span className="truncate">{provider.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                      {!autoCompress && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async (event) => {
                            event.stopPropagation();
                            const tk = activeCustomApi ? apiSettings.apiKey : await refreshToken();
                            if (!tk) {
                              setError(t("chat.noToken"));
                              setOauthOpen(true);
                              return;
                            }
                            const result = await compressHistory(tk, transcript, 0, true);
                            if (result.error) {
                              setError(t("chat.compressionFailed", { message: result.error.message }));
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
                                }, lang),
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
                          {compressing ? t("chat.compressing") : t("chat.compressContext")}
                        </Button>
                      )}
                    </div>
                  </PopoverPopup>
                </PopoverPositioner>
              </PopoverPortal>
            </Popover>
            <Button
              onClick={(e) => { e.stopPropagation(); void sendChat(); }}
              disabled={!authorized || sending || !input.trim()}
            >
              {sending ? t("chat.sending") : t("chat.send")}
            </Button>
          </div>
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
            <DialogTitle>{t("chat.authTitle")}</DialogTitle>
            <DialogDescription>
              {t("chat.authDescription")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOauthOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                setOauthOpen(false);
                authorize(); // redirects the browser to the OAuth page
              }}
            >
              {t("chat.authorize")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});
