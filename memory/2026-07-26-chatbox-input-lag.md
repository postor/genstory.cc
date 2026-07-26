# ChatBox Input Lag Investigation

- Symptom: Typing in the ChatBox input feels slow or stalls, especially after the transcript grows.
- Event wiring: `ChatBox.tsx` does not register explicit `onInput` or `onKeyUp` handlers. The controlled `Textarea` uses React `onChange`, which receives native textarea input updates, and `onKeyDown` for ArrowUp history recall and Enter-to-send.
- Root cause: Every input update calls `setInput`, which re-renders the entire `ChatBox`. The `contextUsage` memo was invalidated by `input` and recomputed project context and the complete message history on every keystroke. `ChatHistoryWindow` also re-rendered all transcript items, and each text item ran `react-markdown` with `remark-gfm` again.
- Evidence:
  - `openroutermcp/chatbox/ChatBox.tsx` binds `onChange={(e) => setInput(e.target.value)}` and `onKeyDown`, with no `onInput`/`onKeyUp`.
  - `openroutermcp/chatbox/ChatBox.tsx` computes `estimateContextUsage({ context, messages, input })` with `[context, messages, input]`.
  - `openroutermcp/chatbox/contextSize.ts` rebuilds the full history string, serializes tool calls, joins it, and scans it with three regexes.
  - `openroutermcp/chatbox/ChatHistoryWindow.tsx` maps the full transcript during each parent render.
  - `openroutermcp/chatbox/chatRender.tsx` parses every rendered message through `react-markdown` and `remark-gfm`.
- Not implicated in normal typing: Chat transcript IndexedDB persistence depends on `transcript`, not `input`; network calls and `sendChat` only happen on Enter or the Send button.
- Fix:
  - Split `ChatBox` token estimation into independent `useMemo` values for project context, message history, and current input.
  - Wrap `ChatHistoryWindow` in `React.memo` so stable transcript and image props skip Markdown reconciliation while typing.
- Regression test: `openroutermcp/chatbox/ChatBox.test.ts` verifies the independent calculations and memoized history component.
- Verification: targeted ESLint and `tsc --noEmit` pass; ChatBox tests pass except the pre-existing goal Popover hover assertion described below.
- Related concern: the existing goal-mode test still rejects `onMouseEnter`/`onMouseLeave`, while the current source contains those handlers. This is unrelated to the input-lag fix.
- Status: DONE_WITH_CONCERNS. Root cause fixed and statically verified; browser profiler timing was not run in this pass.
