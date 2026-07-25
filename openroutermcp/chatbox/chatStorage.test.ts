import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  loadStoredChatTranscript,
  persistChatTranscript,
} from "./chatStorage.ts";

function installLocalStorageMock() {
  const values = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage },
  });
  return localStorage;
}

test("chat storage uses IndexedDB as the primary large chat state store", async () => {
  const source = await readFile(new URL("./chatStorage.ts", import.meta.url), "utf8");

  assert.match(source, /const DB_NAME = "genstory-chatbox"/);
  assert.match(source, /indexedDB\.open\(DB_NAME, DB_VERSION\)/);
  assert.match(source, /db\.createObjectStore\(STORE, \{ keyPath: "key" \}\)/);
  assert.match(source, /saveChatStorageValue/);
  assert.match(source, /loadChatStorageValue/);
});

test("chat transcript storage falls back to compacted localStorage when IndexedDB is unavailable", async () => {
  const localStorage = installLocalStorageMock();
  const largeToolContent = "x".repeat(13_000);
  const transcript = [
    { role: "user" as const, content: "read" },
    {
      role: "tool" as const,
      tool_call_id: "call_1",
      name: "genstory_read_project_file",
      content: largeToolContent,
    },
  ];

  await persistChatTranscript("chat", transcript);

  const saved = localStorage.getItem("chat");
  assert.ok(saved);
  const parsed = JSON.parse(saved);
  assert.match(parsed[1].content, /\[truncated for local storage/);
  assert.ok(parsed[1].content.length < largeToolContent.length);
});

test("chat transcript storage reads legacy localStorage data when IndexedDB has no value", async () => {
  const localStorage = installLocalStorageMock();
  const transcript = [{ role: "user" as const, content: "legacy" }];
  localStorage.setItem("chat", JSON.stringify(transcript));

  assert.deepEqual(await loadStoredChatTranscript("chat"), transcript);
});
