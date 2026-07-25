# 漫画预览以 final.png 补齐页面

- **症状：** 导入 `新的漫画-01-source.zip` 后，漫画预览只显示 `chapter-001` 的 3 张图，`chapter-002` 的 3 张 `final.png` 不显示。
- **根因：** `lib/project-source.ts` 的漫画预览先扫描 `chapter-*/pages/*/(storyboard|script).md` 生成页面列表，再把同目录 `final.png` 挂到页面上。该 ZIP 中 `chapter-002` 只有 `final.png`，没有 `meta.md`、`storyboard.md` 或 `script.md`，所以图片存在但没有进入预览 section。
- **修复：** 漫画预览改为按页面目录合并 `final.png` 与 `storyboard/script.md`。有正文的页面继续使用正文和标题；只有 `final.png` 的页面也会生成预览 section。
- **回归测试：** `lib/project-source.test.ts` 增加 `comic preview includes rendered pages without storyboard files`。
- **验证：**
  - `node --test --experimental-strip-types lib/project-source.test.ts`
  - `npx eslint lib/project-source.ts lib/project-source.test.ts`
  - `npx tsc --noEmit`
- **状态：** DONE
