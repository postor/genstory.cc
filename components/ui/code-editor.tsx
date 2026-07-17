"use client";

import { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type CodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  filename: string;
  dirty?: boolean;
  onRename?: (name: string) => void;
  lineCount?: number;
  readOnly?: boolean;
};

export function CodeEditor({
  value,
  onChange,
  filename,
  dirty,
  onRename,
  lineCount,
  readOnly = false,
}: CodeEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(filename);
  const [preview, setPreview] = useState(false);

  function commitRename() {
    const next = draft.trim().replace(/\.md$/i, "");
    if (next && onRename) onRename(next);
    setEditing(false);
  }

  const mdSource = markdown();

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#1e1e1e] text-[#d4d4d4]">
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
              title="双击重命名"
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

        <div className="ml-auto flex items-center px-2">
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            className="rounded px-2 py-1 text-[#cccccc] transition-colors hover:bg-white/10"
          >
            {preview ? "编辑" : "预览"}
          </button>
        </div>
      </div>

      {/* body */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {preview ? (
          <div className="h-full overflow-auto bg-background p-6 text-foreground">
            <div className="mx-auto max-w-3xl space-y-3 text-sm leading-6 [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <CodeMirror
            value={value}
            onChange={readOnly ? undefined : onChange}
            editable={!readOnly}
            theme={vscodeDark}
            height="100%"
            extensions={[mdSource]}
            className="text-sm [&_.cm-editor]:h-full [&_.cm-editor.cm-focused]:outline-none [&_.cm-scroller]:font-mono [&_.cm-scroller]:text-[13px]"
          />
        )}
      </div>

      {/* status bar */}
      <div className="flex items-center gap-4 bg-[#007acc] px-3 py-0.5 text-[11px] text-white">
        <span>Markdown</span>
        <span>UTF-8</span>
        <span>{lineCount ?? value.split("\n").length} 行</span>
        {dirty ? <span>● 未保存</span> : <span>已保存</span>}
        {preview && <span>预览模式</span>}
      </div>
    </div>
  );
}
