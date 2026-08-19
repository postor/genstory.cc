import assert from "node:assert/strict";
import test from "node:test";

import {
  privatePageMetadata,
  publicPageMetadata,
  publicPages,
} from "./seo.ts";

test("builds localized public metadata in the homepage SEO shape", () => {
  const metadata = publicPageMetadata({
    lang: "en",
    path: "types",
    title: "Browser Story and Game Creation Tools - GenStory.cc",
    description: "Explore browser story and game creation workflows.",
    keywords: ["story creation tool"],
  });

  assert.deepEqual(metadata.title, {
    absolute: "Browser Story and Game Creation Tools - GenStory.cc",
  });
  assert.equal(metadata.description, "Explore browser story and game creation workflows.");
  assert.deepEqual(metadata.alternates, {
    canonical: "https://www.genstory.cc/en/types",
    languages: {
      "zh-CN": "https://www.genstory.cc/zh/types",
      en: "https://www.genstory.cc/en/types",
      "x-default": "https://www.genstory.cc/zh/types",
    },
  });
  assert.equal(metadata.openGraph?.siteName, "GenStory.cc");
  assert.equal(metadata.openGraph?.url, "https://www.genstory.cc/en/types");
  assert.deepEqual(metadata.twitter, {
    card: "summary_large_image",
    title: "Browser Story and Game Creation Tools - GenStory.cc",
    description: "Explore browser story and game creation workflows.",
    images: ["/og/genstory-og.png"],
  });
  assert.deepEqual(metadata.keywords, ["story creation tool"]);
});

test("builds noindex metadata for private workspace pages", () => {
  const metadata = privatePageMetadata({
    lang: "zh",
    path: "projects",
    title: "我的作品 - GenStory.cc",
    description: "管理浏览器中的本地创作项目。",
  });

  assert.deepEqual(metadata.title, { absolute: "我的作品 - GenStory.cc" });
  assert.equal(metadata.description, "管理浏览器中的本地创作项目。");
  assert.deepEqual(metadata.robots, { index: false, follow: false });
  assert.equal(metadata.alternates?.canonical, "https://www.genstory.cc/zh/projects");
  assert.equal(metadata.openGraph?.url, "https://www.genstory.cc/zh/projects");
  assert.deepEqual(metadata.twitter, {
    card: "summary_large_image",
    title: "我的作品 - GenStory.cc",
    description: "管理浏览器中的本地创作项目。",
    images: ["/og/genstory-og.png"],
  });
});

test("comic FAQ presents AI image generation as the drawing path", () => {
  const answer = publicPages.comic.faqs.find(
    (faq) => faq.question.zh === "GenStory.cc 可以直接画漫画吗？",
  )?.answer.zh;

  assert.ok(answer);
  assert.match(answer, /AI 生图/);
  assert.match(answer, /绘制漫画/);
  assert.doesNotMatch(answer, /不会/);
  assert.doesNotMatch(answer, /替代专业绘图工具/);
});

test("book page describes backup and cloud drive sync in user-facing terms", () => {
  const section = publicPages.book.sections.find(
    (item) => item.title.zh === "备份与网盘同步",
  );

  assert.ok(section);
  assert.match(section.body.zh, /ZIP 备份/);
  assert.match(section.body.zh, /授权自己的网盘/);
  assert.match(section.body.zh, /手动/);
  assert.match(section.body.zh, /不会自动运行/);
  assert.doesNotMatch(section.body.zh, /OAuth|OPFS|Google Cloud Console/);
});
