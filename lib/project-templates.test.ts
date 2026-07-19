import assert from "node:assert/strict";
import test from "node:test";

import { contentTypes, type ContentTypeId } from "./content-types.ts";
import { getProjectTemplate } from "./project-templates.ts";
import { readFile } from "node:fs/promises";

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
  const source = files.find((file) => file.path === "chapter-001/content.md");

  assert.match(source?.content ?? "", /小红帽/);
  assert.match(source?.content ?? "", /外婆/);
});

for (const lang of ["zh", "en"] as const) {
  for (const type of contentTypes.map((item) => item.id)) {
    test(`${lang}/${type} uses public template file as AGENTS.md`, async () => {
      const files = await getProjectTemplate(type, lang, "测试项目");
      const agents = files.find((file) => file.path === "AGENTS.md");
      const expected = await readFile(`public/templates/${lang}/${type}.md`, "utf8");
      assert.equal(agents?.content, expected);
    });
  }
}

test("book template follows the book AGENTS.md repository structure", async () => {
  const files = await getProjectTemplate("book", "zh", "小红帽");
  const paths = new Set(files.map((file) => file.path));

  assert.ok(paths.has("chapter-001/content.md"));
  assert.ok(paths.has("chapter-001/characters/meta.md"));
  assert.ok(paths.has("chapter-001/locations/meta.md"));
  assert.ok(paths.has("chapter-001/illustrations/scene-001.md"));
  assert.ok(paths.has("chapter-001/illustrations/scene-001.png"));
  assert.equal(paths.has("chapter-001/pages/page-001.md"), false);
});

test("comic template follows the comic AGENTS.md page structure", async () => {
  const files = await getProjectTemplate("comic", "zh", "小红帽");
  const paths = new Set(files.map((file) => file.path));

  assert.ok(paths.has("chapter-001/pages/page-001/meta.md"));
  assert.ok(paths.has("chapter-001/pages/page-001/storyboard.md"));
  assert.ok(paths.has("chapter-001/pages/page-001/panels/panel-001.md"));
  assert.ok(paths.has("chapter-001/pages/page-001/layout.md"));
  assert.ok(paths.has("chapter-001/pages/page-001/final.png"));
  assert.equal(paths.has("chapter-001/pages/page-001/script.md"), false);
});

test("interactive video template follows the interactive video AGENTS.md segment structure", async () => {
  const files = await getProjectTemplate("interactive-video", "zh", "小红帽");
  const paths = new Set(files.map((file) => file.path));

  assert.ok(paths.has("chapter-001/segments/segment-001/meta.md"));
  assert.ok(paths.has("chapter-001/segments/segment-001/script.md"));
  assert.ok(paths.has("chapter-001/segments/segment-001/timeline.yml"));
  assert.ok(paths.has("chapter-001/segments/segment-001/choices.yml"));
  assert.ok(paths.has("assets/index.yml"));
});
test("visual novel template contains real OpenWebGal source files", async () => {
  const files = await getProjectTemplate("visual-novel", "zh", "小红帽");
  const paths = new Set(files.map((file) => file.path));

  assert.ok(paths.has("chapter-001/scenes/scene-001/script.md"));
  assert.ok(paths.has("chapter-001/scenes/scene-001/stage.yml"));
  assert.ok(paths.has("assets/index.yml"));
  assert.ok(paths.has("assets/ui/menu-background.png"));
  assert.ok(files.some((file) => file.path.endsWith(".png") && file.kind === "binary"));
});

test("all content types expose the same template lookup contract", async () => {
  const results = await Promise.all(
    contentTypes.map((item) => getProjectTemplate(item.id as ContentTypeId, "en", "Story"))
  );
  assert.equal(results.length, contentTypes.length);
});
