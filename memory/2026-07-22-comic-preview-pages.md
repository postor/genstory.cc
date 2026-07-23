# 漫画预览显示文本

- **症状：** 漫画项目点击预览后主要看到 `storyboard.md` 的 Markdown 文本，不像一本漫画。
- **根因：** `app/projects/preview/preview-client.tsx` 只把视觉小说和 Phaser 项目送入运行时预览；漫画走 `readProjectPreview()` 的通用文档预览分支。`lib/project-source.ts` 原本只读取 `storyboard.md`，没有把同页的 `final.png` 加入预览模型。模板实际已经把页面成品图写入 `chapter-001/pages/<page>/final.png`。
- **修复：** 漫画 section 现在携带可选的 `pageImagePath`，同时兼容当前的 `storyboard.md` 和旧项目的 `script.md`。预览页使用独立的漫画阅读器，只连续展示 OPFS 页面图，不渲染 storyboard、对白或其他正文文本；页面统一为同一阅读宽度，并显示 `当前页 / 总页数`。
- **验证：**
  - `node --test --experimental-strip-types lib/project-source.test.ts lib/project-templates.test.ts`
  - `npx eslint app/projects/preview/preview-client.tsx lib/project-source.ts lib/project-source.test.ts`
  - `npx tsc --noEmit`
  - Full test run: 117 passed, 3 unrelated existing failures (`components/public-home-page.test.ts` assertion drift and native Node extension-resolution failures in `lib/markdown/preview-media.test.ts` / `lib/openrouter.test.ts`).
  - 浏览器实测 3 张漫画页图均加载成功，`naturalWidth` 为 1024、768、768，CSS 阅读宽度统一为 768px，页码显示为 `1 / 3`、`2 / 3`、`3 / 3`，控制台无错误/警告。
- **回归测试：** `lib/project-source.test.ts`
- **状态：** DONE
