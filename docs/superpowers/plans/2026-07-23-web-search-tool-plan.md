# Web Search Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a browser-local `web_search` function tool backed by Tavily so the existing OpenRouter chat can retrieve current web information without exposing a key in the static build.

**Architecture:** Keep the static-export deployment model. Store the user's Tavily key in browser storage, expose a local project-style tool from `ChatBox`, and call Tavily directly from the browser with normalized search results. Add a settings card for configuring, testing, and clearing the key; the existing OpenRouter MCP path remains unchanged.

**Tech Stack:** Next.js 16 App Router static export, React 19, TypeScript, shadcn/ui primitives, Tailwind CSS, Tavily Search API, Node test runner.

---

### Task 1: Define the search provider contract

**Files:**
- Create: `lib/web-search.ts`
- Test: `lib/web-search.test.ts`

- [ ] **Step 1: Write failing tests** for missing-key validation, request payload construction, and normalization of Tavily results.
- [ ] **Step 2: Run the focused test and confirm it fails because the module is missing.**
- [ ] **Step 3: Implement the minimal provider module** with browser storage helpers, an injectable fetch implementation, strict input validation, timeout handling, and normalized results.
- [ ] **Step 4: Run the focused test and confirm it passes.**

### Task 2: Expose `web_search` to the chat agent loop

**Files:**
- Modify: `openroutermcp/chatbox/ChatBox.tsx`
- Modify: `openroutermcp/chatbox/ChatBox.test.ts`
- Modify: `lib/analytics.ts` only if tool-source tracking needs a new source

- [ ] **Step 1: Add a failing source/behavior test** proving the chat tool list contains `web_search` and tool errors do not leak the API key.
- [ ] **Step 2: Run the focused test and confirm it fails.**
- [ ] **Step 3: Add the local tool definition and call path** while preserving MCP/project tool behavior and tool-result transcript rendering.
- [ ] **Step 4: Run the focused chat tests and confirm they pass.**

### Task 3: Add settings UI and bilingual copy

**Files:**
- Modify: `app/settings/settings-client.tsx`
- Modify: `lib/i18n.tsx`
- Modify: `app/projects/modal-interactions.test.ts` or add a focused settings test

- [ ] **Step 1: Add a failing test** for the Tavily settings controls and clear action.
- [ ] **Step 2: Run it and confirm it fails.**
- [ ] **Step 3: Add the shadcn-based settings card** with masked key input, save/test/clear actions, local-only security note, provider documentation link, and Chinese/English translations.
- [ ] **Step 4: Run the focused settings tests and confirm they pass.**

### Task 4: Verify the complete delivery

**Files:**
- Modify: `README.md` if the user-facing setup flow needs documentation

- [ ] **Step 1: Run focused tests for search, chat, and settings.**
- [ ] **Step 2: Run lint and TypeScript/build validation.**
- [ ] **Step 3: Inspect the diff and verify the key never enters the LLM message/tool result payload.**
- [ ] **Step 4: Document the selected free provider and its limitation in the final response and repository docs if needed.**
