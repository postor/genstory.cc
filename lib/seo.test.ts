import assert from "node:assert/strict";
import test from "node:test";

import { publicPages } from "./seo.ts";

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
