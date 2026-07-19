import assert from "node:assert/strict";
import test from "node:test";

import { OpenRouterStreamParser } from "./openrouter-stream.ts";

test("parses split SSE frames into text and tool-call deltas", () => {
  const parser = new OpenRouterStreamParser();

  assert.deepEqual(
    parser.push(
      'data: {"choices":[{"delta":{"content":"你好"}}]}\n\ndata: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_1","type":"function","function":{"name":"search","arguments":"{\\"q\\""}}]}}]}\n\n'
    ),
    [
      { type: "text", content: "你好" },
      {
        type: "tool_call",
        index: 0,
        id: "call_1",
        name: "search",
        arguments: '{"q"',
      },
    ]
  );

  assert.deepEqual(
    parser.push(
      'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":":\\"天气\\"}"}}]}}]}\n\ndata: [DONE]\n\n'
    ),
    [
      {
        type: "tool_call",
        index: 0,
        arguments: ':"天气"}',
      },
      { type: "done" },
    ]
  );
});
