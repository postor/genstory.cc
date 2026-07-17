import assert from "node:assert/strict";
import test from "node:test";

import { contentTypes, type ContentTypeId } from "./content-types.ts";
import { getProjectTemplate } from "./project-templates.ts";

for (const type of contentTypes.map((item) => item.id)) {
  test(`${type} template has shared metadata and type source files`, async () => {
    const files = await getProjectTemplate(type, "zh", "测试项目");
    const paths = files.map((file) => file.path);
    const text = files
      .filter((file) => file.kind === "text")
      .map((file) => file.content ?? "")
      .join("\n");

    assert.ok(paths.includes("AGENTS.md"));
    assert.ok(paths.includes("meta.md"));
    assert.ok(paths.some((path) => path.endsWith(".md") && path !== "AGENTS.md" && path !== "meta.md"));
    assert.match(text, /小红帽/);
    for (const path of paths) {
      assert.equal(path.includes(".."), false);
      assert.equal(path.startsWith("/"), false);
    }
  });
}

test("new projects use Little Red Riding Hood as the default theme", async () => {
  const files = await getProjectTemplate("book", "zh", "小红帽");
  const source = files.find((file) => file.path.includes("page-001.md"));

  assert.match(source?.content ?? "", /小红帽/);
  assert.match(source?.content ?? "", /外婆/);
});

test("visual novel template contains real OpenWebGal source files", async () => {
  const files = await getProjectTemplate("visual-novel", "zh", "小红帽");
  const paths = new Set(files.map((file) => file.path));

  assert.ok(paths.has("chapter-001/scenes/scene-001/script.md"));
  assert.ok(paths.has("chapter-001/scenes/scene-001/stage.yml"));
  assert.ok(paths.has("assets/index.yml"));
  assert.ok(files.some((file) => file.path.endsWith(".png") && file.kind === "binary"));
});

test("all content types expose the same template lookup contract", async () => {
  const results = await Promise.all(
    contentTypes.map((item) => getProjectTemplate(item.id as ContentTypeId, "en", "Story"))
  );
  assert.equal(results.length, contentTypes.length);
});
