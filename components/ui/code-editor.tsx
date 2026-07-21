"use client";

import { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { WrapText } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

const WRAP_LINES_STORAGE_KEY = "genstory.code-editor.wrap-lines";

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  filename: string;
  dirty?: boolean;
  onRename?: (name: string) => void;
  lineCount?: number;
  readOnly?: boolean;
  resolveImageSrc?: (src: string) => string;
  mediaKindForSrc?: (src: string) => "image" | "video" | "audio" | null;
};

export function CodeEditor({
  value,
  onChange,
  filename,
  dirty,
  onRename,
  lineCount,
  readOnly = false,
  resolveImageSrc,
  mediaKindForSrc,
}: CodeEditorProps) {
  const { t } = useLang();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(filename);
  const [preview, setPreview] = useState(false);
  const [wrapLines, setWrapLines] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setWrapLines(window.localStorage.getItem(WRAP_LINES_STORAGE_KEY) === "true");
    });
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  function toggleWrapLines() {
    setWrapLines((previous) => {
      const next = !previous;
      window.localStorage.setItem(WRAP_LINES_STORAGE_KEY, String(next));
      return next;
    });
  }

  function commitRename() {
    const next = draft.trim().replace(/\.md$/i, "");
    if (next && onRename) onRename(next);
    setEditing(false);
  }

  const mdSource = markdown();
  const markdownComponents: Components = {
    img: ({ node: _node, src, alt, ...props }) => {
      void _node;
      const resolvedSrc = typeof src === "string" && resolveImageSrc ? resolveImageSrc(src) : src;
      return (
        <>
          {/* Local OPFS previews use blob URLs; Next Image can render those as broken images. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            {...props}
            src={resolvedSrc}
            alt={alt ?? ""}
            className="max-w-full rounded-md border bg-background"
          />
        </>
      );
    },
    a: ({ node: _node, href, children, title }) => {
      void _node;
      const kind = typeof href === "string" && mediaKindForSrc ? mediaKindForSrc(href) : null;
      const resolvedHref = typeof href === "string" && resolveImageSrc ? resolveImageSrc(href) : href;
      if (kind === "video") {
        return (
          <video
            src={resolvedHref}
            controls
            title={title}
            className="my-3 max-h-96 w-full rounded-md border bg-black"
          >
            {children}
          </video>
        );
      }
      if (kind === "audio") {
        return <audio src={resolvedHref} controls title={title} className="my-3 w-full" />;
      }
      return (
        <a href={resolvedHref} title={title}>
          {children}
        </a>
      );
    },
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-[#1e1e1e] text-[#d4d4d4]">
      {/* tab bar */}
      <div className="flex items-stretch bg-[#252526] text-xs">
        <div className="flex items-center gap-2 border-r border-black/40 border-t-2 border-t-[#0e639c] bg-[#1e1e1e] px-3 py-1.5 text-[#ffffff]">
          {editing && !readOnly ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") setEditing(false);
              }}
              className="w-40 rounded-sm bg-[#3c3c3c] px-1 text-white outline-none"
            />
          ) : (
            <button
              type="button"
              onDoubleClick={() => {
                if (readOnly) return;
                setDraft(filename);
                setEditing(true);
              }}
              className="flex items-center gap-1.5"
              title={t("codeEditor.renameHint")}
            >
              <span
                className={
                  "inline-block size-2 rounded-full " +
                  (dirty ? "bg-[#e2c08d]" : "bg-transparent")
                }
              />
              {filename}
            </button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1 px-2">
          {!preview && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={toggleWrapLines}
              aria-pressed={wrapLines}
              aria-label={t("codeEditor.wrap")}
              title={t("codeEditor.wrap")}
              className={wrapLines ? "bg-white/15 text-white" : "text-[#cccccc]"}
            >
              <WrapText className="size-3.5" />
            </Button>
          )}
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className="rounded px-2 py-1 text-[#cccccc] transition-colors hover:bg-white/10"
          >
            {preview ? t("codeEditor.edit") : t("codeEditor.preview")}
          </button>
        </div>
      </div>

      {/* body */}
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        {preview ? (
          <div className="h-full overflow-auto bg-background p-6 text-foreground">
            <div className="mx-auto max-w-3xl space-y-3 text-sm leading-6 [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {value}
              </ReactMarkdown>
            </div>
          </div>
        ) : (
          <CodeMirror
            value={value}
            onChange={readOnly ? undefined : onChange}
            editable={!readOnly}
            theme={vscodeDark}
            height="100%"
            extensions={[mdSource, ...(wrapLines ? [EditorView.lineWrapping] : [])]}
            className="h-full min-h-0 text-sm [&_.cm-editor]:h-full [&_.cm-editor.cm-focused]:outline-none [&_.cm-scroller]:h-full [&_.cm-scroller]:overflow-auto [&_.cm-scroller]:font-mono [&_.cm-scroller]:text-[13px]"
          />
        )}
      </div>

      {/* status bar */}
      <div className="flex items-center gap-4 bg-[#007acc] px-3 py-0.5 text-[11px] text-white">
        <span>Markdown</span>
        <span>UTF-8</span>
        <span>{t("codeEditor.lines", { count: lineCount ?? value.split("\n").length })}</span>
        {dirty ? <span>{t("codeEditor.dirty")}</span> : <span>{t("codeEditor.saved")}</span>}
        {preview && <span>{t("codeEditor.previewMode")}</span>}
      </div>
    </div>
  );
}
