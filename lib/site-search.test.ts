import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSearchDocuments,
  searchSiteContent,
  type SearchLocalProject,
} from "./site-search.ts";

const localProjects: SearchLocalProject[] = [
  {
    id: "project-1",
    title: "星之旅人",
    template: "visual-novel",
    lang: "zh",
    createdAt: 1,
    updatedAt: 2,
  },
  {
    id: "project-2",
    title: "Clockwork City",
    template: "comic",
    lang: "en",
    createdAt: 1,
    updatedAt: 3,
  },
];

test("searches SEO documents by localized title and description", () => {
  const documents = buildSearchDocuments("zh");
  const results = searchSiteContent("OpenWebGal", documents, localProjects, "zh");
  const page = results.find(
    (result) => result.kind === "document" && result.slug === "visual-novel",
  );

  assert.equal(page?.title, "在浏览器中制作视觉小说和 WebGAL 项目");
  assert.equal(page?.kindLabel, "页面");
  assert.match(page?.content ?? "", /OpenWebGal/);
  assert.equal(page?.content.match(/OpenWebGal/g)?.length, 1);
  assert.equal(results.some((result) => result.kind === "project"), false);
});

test("searches local projects by title and returns the editor link", () => {
  const documents = buildSearchDocuments("en");
  const results = searchSiteContent("Clockwork", documents, localProjects, "en");
  const project = results.find((result) => result.kind === "project");

  assert.equal(project?.title, "Comic");
  assert.equal(project?.kindLabel, "Project");
  assert.equal(project?.content, "Clockwork City");
  assert.equal(project?.href, "/projects/editor?id=project-2");
  assert.equal(project?.templateLabel, "Comic");
});

test("returns an empty list for blank or unmatched queries", () => {
  const documents = buildSearchDocuments("zh");

  assert.deepEqual(searchSiteContent("   ", documents, localProjects, "zh"), []);
  assert.deepEqual(searchSiteContent("不存在的内容", documents, localProjects, "zh"), []);
});
