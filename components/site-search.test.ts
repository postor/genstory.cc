import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("search candidates identify their kind and do not show the keyboard shortcut", async () => {
  const source = await readFile(new URL("./site-search.tsx", import.meta.url), "utf8");

  assert.match(source, /\{result\.kindLabel\}/);
  assert.match(source, /highlightText\(result\.title, query\)/);
  assert.match(source, /highlightText\(result\.content, query\)/);
  assert.match(
    source,
    /className="max-w-lg gap-0 overflow-x-hidden p-0 pt-9"/,
  );
  assert.doesNotMatch(source, /Ctrl K/);
});
