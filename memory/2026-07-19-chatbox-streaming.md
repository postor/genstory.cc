# Chatbox Streaming Debug Report

- Symptom: Chatbox waited for the entire model answer before rendering assistant text.
- Root cause: `lib/openrouter.ts` sent `stream: false` to OpenRouter and awaited `res.json()`. `ChatBox` only updated its transcript after `chat()` resolved.
- Fix: Added incremental SSE parsing in `lib/openrouter-stream.ts`, changed OpenRouter requests to `stream: true`, merged streamed tool-call deltas, and added an `onTextDelta` callback. `ChatBox` now renders a temporary assistant message as text deltas arrive and only commits the complete message to model history after the stream ends.
- Regression tests: `lib/openrouter-stream.test.ts` covers split SSE frames and tool-call deltas. `lib/openrouter.test.ts` verifies `stream: true` and immediate text callbacks.
- Verification: 50/50 repository tests passed; lint has no errors; `git diff --check` passed. `next build` remains blocked by the existing external `next/font`/Turbopack font resolution failure.
- Status: DONE_WITH_CONCERNS
