# 顶栏搜索关闭按钮定位修复

- 症状：顶栏搜索弹层的关闭按钮出现在搜索输入框右上角附近，视觉上与输入框重叠。
- 根因：`DialogContent` 使用 `p-0` 移除了通用 Dialog 默认内容内边距，但通用关闭按钮仍使用相对弹层的 `top-2 right-2` 定位，导致按钮和首行输入框处在同一垂直区域。
- 修复：在 `components/site-search.tsx` 的搜索弹层上增加 `pt-9`，为关闭按钮保留独立的顶部空间。
- 回归：`components/site-search.test.ts` 断言搜索弹层保留顶部间距；桌面端和 390x844 移动端均验证关闭按钮与输入框分离，点击关闭后弹层消失。
- 验证：搜索专项测试通过，ESLint 通过；全量测试当前为 217 通过、4 个既有失败，失败位于 `local-project-summary`、`site-header`、`public platform pages` 和 `chatbox` 测试，与本次改动文件无关。
