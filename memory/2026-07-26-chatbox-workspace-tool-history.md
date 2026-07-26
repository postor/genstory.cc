# ChatBox Workspace Tool History Investigation

- Symptom: ChatBox LLM file updates did not appear like other tool call blocks, and full file contents risked entering visible chat/history when files were created or modified.
- Root cause: Text file edits used a legacy assistant-text side channel: the system prompt asked the model to append `fileChanges` JSON, `ChatBox` parsed that ordinary assistant message, and `editor-client` applied the changes through `onFileChanges`. Because this was not an OpenRouter `tool_calls` response, the tool request/result renderer never saw it. When moving files, the project already exposed `genstory_move_project_file`, so move/rename operations could appear as tool calls.
- Fix:
  - Added `genstory_write_project_files` in `app/projects/editor/editor-client.tsx` so text create/update operations can use the normal tool call path.
  - Updated ChatBox system copy to prefer `genstory_write_project_files` and keep JSON `fileChanges` only as a fallback when the write tool is unavailable.
  - Redacted `genstory_write_project_files` arguments before storing/rendering assistant tool calls, replacing `content`/`patch` with omitted-character markers.
  - Redacted legacy `fileChanges` assistant content before storing it in chat history, while still applying the original complete content.
  - Added a visible workspace operation notice for legacy JSON fallback applications; notices are not sent back to the LLM.
- Evidence:
  - `npx eslint openroutermcp\chatbox\ChatBox.tsx openroutermcp\chatbox\transcript.ts openroutermcp\chatbox\ChatBox.test.ts openroutermcp\chatbox\transcript.test.ts app\projects\editor\editor-client.tsx` passed.
  - `node --experimental-strip-types --test --test-name-pattern "file changes|workspace write|project tool|workspace operation" openroutermcp\chatbox\ChatBox.test.ts openroutermcp\chatbox\transcript.test.ts` passed 4/4.
  - Full targeted chatbox/transcript test run still has the pre-existing goal Popover hover assertion failure recorded in prior chatbox input-lag work.
  - `npx tsc --noEmit` is currently blocked by an unrelated existing error in `lib/ai-prompt-examples.ts`: `"phaser-game"` is not assignable to `"book" | "comic"`.
- Status: DONE_WITH_CONCERNS
