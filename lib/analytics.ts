export type AnalyticsEventName =
  | "project_create"
  | "model_select"
  | "chat_send"
  | "tool_call";

type AnalyticsParam = string | number | boolean | null | undefined;
export type AnalyticsParams = Record<string, AnalyticsParam>;

declare global {
  interface Window {
    gtag?: (
      command: "event",
      eventName: AnalyticsEventName,
      params: Record<string, string | number | boolean>
    ) => void;
  }
}

function sanitizeParams(params: AnalyticsParams): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(params).filter(
      (entry): entry is [string, string | number | boolean] =>
        entry[1] !== null && entry[1] !== undefined
    )
  );
}

export function trackEvent(
  eventName: AnalyticsEventName,
  params: AnalyticsParams = {}
): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", eventName, sanitizeParams(params));
}

export function trackProjectCreated(input: {
  template: string;
  lang: string;
  customTitle: boolean;
}): void {
  trackEvent("project_create", {
    template: input.template,
    lang: input.lang,
    custom_title: input.customTitle,
  });
}

export function trackModelSelected(input: { model: string }): void {
  trackEvent("model_select", {
    model: input.model,
  });
}

export function trackChatSent(input: {
  model: string;
  messageLength: number;
  hasContext: boolean;
  mcpToolCount: number;
  projectToolCount: number;
  autoCompress: boolean;
}): void {
  trackEvent("chat_send", {
    model: input.model,
    message_length: input.messageLength,
    has_context: input.hasContext,
    mcp_tool_count: input.mcpToolCount,
    project_tool_count: input.projectToolCount,
    auto_compress: input.autoCompress,
  });
}

export function trackToolCalled(input: {
  toolName: string;
  source: "mcp" | "project";
  success: boolean;
}): void {
  trackEvent("tool_call", {
    tool_name: input.toolName,
    source: input.source,
    success: input.success,
  });
}
