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
