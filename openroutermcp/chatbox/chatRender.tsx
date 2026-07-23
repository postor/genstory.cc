"use client";

// Shared rendering helpers for the chat transcript: inline markdown (with
// shadcn-friendly Tailwind styling that adapts to both light and dark bubbles)
// and tool-result rendering that supports images stored by reference (so huge
// base64 never enters the chat context sent to the model).
//
// Mirrors the rendering from app/test/mcp/page.tsx so ChatBox can fully
// replace that chat dialog. Styling uses Tailwind utility classes only — no
// inline `style`.

/* eslint-disable @next/next/no-img-element -- Tool results render data URLs and local image refs. */

import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/* eslint-disable @typescript-eslint/no-unused-vars */
export const mdComponents: Components = {
  a: ({ node, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer" className="text-current underline" />
  ),
  pre: ({ node, ...props }) => (
    <pre {...props} className="my-1 overflow-x-auto rounded-md bg-foreground/10 p-2 text-xs" />
  ),
  code: ({ node, ...props }) => (
    <code {...props} className="rounded bg-foreground/10 px-1 py-0.5 text-xs" />
  ),
  table: ({ node, ...props }) => (
    <table {...props} className="my-1 w-full border-collapse text-xs" />
  ),
  th: ({ node, ...props }) => (
    <th {...props} className="border border-current px-1.5 py-1 text-left" />
  ),
  td: ({ node, ...props }) => <td {...props} className="border border-current px-1.5 py-1" />,
  img: ({ node, ...props }) => (
    <img {...props} className="max-w-full rounded-md" alt={props.alt ?? ""} />
  ),
};
/* eslint-enable @typescript-eslint/no-unused-vars */

export function Md({ content }: { content: string }) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} components={mdComponents}>
      {content}
    </Markdown>
  );
}

// Render a tool result's content, showing images (by ref) and text blocks.
export function ToolResult({
  content,
  images,
  missingImageLabel = "（图片不存在或已清除）",
  imageAlt = "工具返回图片",
}: {
  content: string;
  images: Record<string, string>;
  missingImageLabel?: string;
  imageAlt?: string;
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
                <span key={idx} className="text-xs text-muted-foreground">
                  {missingImageLabel}
                </span>
              );
            }
            return (
              <img
                key={idx}
                src={src}
                alt={imageAlt}
                className="my-1 block max-w-full rounded-md"
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
            <pre key={idx} className="my-1 whitespace-pre-wrap break-words text-xs">
              {text}
            </pre>
          );
        })}
      </>
    );
  }

  return <pre className="m-0 whitespace-pre-wrap break-words text-xs">{content}</pre>;
}

// Recursively walk a tool result and replace any { type: "image", data } node
// with { type: "image", ref }, storing the base64 as a data URL in `store`
// keyed by a generated id so the (large) base64 never lands in the chat
// context sent back to the model.
export interface ExtractedToolImage {
  source: string;
  mimeType: string;
}

export function extractImages(
  value: unknown,
  store: Record<string, string>,
  extracted: ExtractedToolImage[] = []
): unknown {
  if (Array.isArray(value)) return value.map((v) => extractImages(v, store, extracted));
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const source = typeof obj.data === "string"
      ? obj.data.startsWith("data:")
        ? obj.data
        : `data:${typeof obj.mimeType === "string" ? obj.mimeType : "image/png"};base64,${obj.data}`
      : typeof obj.url === "string" ? obj.url : null;
    if (obj.type === "image" && source) {
      const id = "img_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const mime = typeof obj.mimeType === "string"
        ? obj.mimeType
        : source.startsWith("data:image/jpeg") ? "image/jpeg" : "image/png";
      store[id] = source;
      extracted.push({ source, mimeType: mime });
      return { type: "image", ref: id };
    }
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(obj)) out[k] = extractImages(obj[k], store, extracted);
    return out;
  }
  return value;
}
