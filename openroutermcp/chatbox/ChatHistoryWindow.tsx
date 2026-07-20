"use client";

// Scrollable chat transcript. Automatically scrolls to the latest message on
// initial mount and whenever the messages (or loading state) change.
// Built with the shadcn ScrollArea and Tailwind utilities — no inline `style`.
// Renders user/assistant text with inline markdown and tool results with image
// support (images referenced by id so base64 stays out of the model context).

import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Md, ToolResult } from "./chatRender";
import { thinkingDotCount } from "./thinkingIndicator";
import { isChatNotice, type ChatTranscriptItem } from "./transcript";
import { useLang } from "@/lib/i18n";

export interface ChatHistoryWindowProps {
  messages: ChatTranscriptItem[];
  loading?: boolean;
  /** id -> data URL map for images referenced by tool results. */
  images?: Record<string, string>;
  className?: string;
}

export function ChatHistoryWindow({ messages, loading, images = {}, className }: ChatHistoryWindowProps) {
  const { t } = useLang();
  const endRef = useRef<HTMLDivElement>(null);
  const [thinkingFrame, setThinkingFrame] = useState(0);

  // Keep the latest content in view: runs on mount and on every change.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) {
      return;
    }

    const timerId = window.setInterval(() => {
      setThinkingFrame((frame) => frame + 1);
    }, 450);

    return () => window.clearInterval(timerId);
  }, [loading]);

  return (
    <ScrollArea className={cn("min-h-0 flex-1 rounded-lg border bg-muted/40 p-3", className)}>
      <div className="flex flex-col gap-2">
        {messages.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground">{t("chat.empty")}</p>
        )}
        {messages.map((m, i) => {
          if (isChatNotice(m)) {
            return (
              <div key={m.id} className="self-center px-2 py-1 text-xs text-muted-foreground">
                {m.content}
              </div>
            );
          }

          if (m.role === "user") {
            return (
              <div
                key={i}
                className="max-w-[80%] self-end rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground"
              >
                <Md content={m.content ?? ""} />
              </div>
            );
          }
          if (m.role === "tool") {
            return (
              <details
                key={i}
                className="group max-w-[90%] self-start rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-800 dark:bg-emerald-950"
              >
                <summary className="cursor-pointer select-none text-xs font-semibold marker:text-emerald-700 dark:marker:text-emerald-300">
                  {t("chat.toolResult", { name: m.name ?? m.tool_call_id ?? "" })}
                </summary>
                <div className="mt-2">
                  <ToolResult
                    content={m.content ?? ""}
                    images={images}
                    missingImageLabel={t("chat.missingImage")}
                    imageAlt={t("chat.toolImageAlt")}
                  />
                </div>
              </details>
            );
          }
          if (m.tool_calls && m.tool_call_id === undefined) {
            return (
              <div key={i} className="max-w-[90%] self-start rounded-xl border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm dark:border-yellow-800 dark:bg-yellow-950">
                <div className="mb-1 text-xs font-semibold">{t("chat.toolRequest")}</div>
                {m.tool_calls.map((tc) => (
                  <pre key={tc.id} className="mt-1 whitespace-pre-wrap break-words text-xs">
                    {tc.function.name}({tc.function.arguments || "{}"})
                  </pre>
                ))}
              </div>
            );
          }
          return (
            <div
              key={i}
              className="max-w-[80%] self-start rounded-xl bg-muted px-3 py-2 text-sm"
            >
              <Md content={m.content ?? ""} />
            </div>
          );
        })}
        {loading && (
          <div className="max-w-[80%] self-start rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
            {t("chat.thinking", { dots: ".".repeat(thinkingDotCount(thinkingFrame)) })}
          </div>
        )}
        <div ref={endRef} />
      </div>
    </ScrollArea>
  );
}
