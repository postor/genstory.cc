"use client";

// Scrollable chat transcript. Automatically scrolls to the latest message on
// initial mount and whenever the messages (or loading state) change.
// Built with the shadcn ScrollArea and Tailwind utilities — no inline `style`.
// Renders user/assistant text with inline markdown and tool results with image
// support (images referenced by id so base64 stays out of the model context).

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/openrouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Md, ToolResult } from "./chatRender";

export interface ChatHistoryWindowProps {
  messages: ChatMessage[];
  loading?: boolean;
  /** id -> data URL map for images referenced by tool results. */
  images?: Record<string, string>;
}

export function ChatHistoryWindow({ messages, loading, images = {} }: ChatHistoryWindowProps) {
  const endRef = useRef<HTMLDivElement>(null);

  // Keep the latest content in view: runs on mount and on every change.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, loading]);

  return (
    <ScrollArea className="h-[420px] rounded-lg border bg-muted/40 p-3">
      <div className="flex flex-col gap-2">
        {messages.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground">还没有对话，发送一条消息开始。</p>
        )}
        {messages.map((m, i) => {
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
              <div key={i} className="max-w-[90%] self-start rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-800 dark:bg-emerald-950">
                <div className="mb-1 text-xs font-semibold">🔧 工具返回：{m.name ?? m.tool_call_id}</div>
                <ToolResult content={m.content ?? ""} images={images} />
              </div>
            );
          }
          if (m.tool_calls && m.tool_call_id === undefined) {
            return (
              <div key={i} className="max-w-[90%] self-start rounded-xl border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm dark:border-yellow-800 dark:bg-yellow-950">
                <div className="mb-1 text-xs font-semibold">💡 模型请求调用工具</div>
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
            …（思考中）
          </div>
        )}
        <div ref={endRef} />
      </div>
    </ScrollArea>
  );
}
