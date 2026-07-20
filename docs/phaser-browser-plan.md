# Phaser 游戏浏览器内创作方案

Phaser 项目和其他 GenStory 类型一样，正文保存在浏览器 OPFS 的
`<type>/<projectId>/` 目录中，IndexedDB 只保存项目索引和 UI 状态。

## 模板结构

新建 `phaser-game` 项目会写入：

- `index.html`：入口和脚本加载顺序。
- `src/config.js`、`src/main.js`：Phaser 配置与启动入口。
- `src/scenes/menu-scene.js`：菜单场景，可进入 `TestGameScene`。
- `src/scenes/test-game-scene.js`：使用 Graphics、物理和键盘输入的可玩测试场景，可返回菜单。
- `assets/index.yml`：图片、BGM、SFX 的逻辑 ID、状态和 AI prompt；模板暂不写入媒体二进制文件。

模板刻意使用 Phaser Graphics 和文本，因此即使图片与音频尚未生成，预览仍然可以运行。

## 运行与导出

应用依赖中的 Phaser 运行时由 `scripts/sync-phaser.mjs` 同步到 `public/phaser/`。预览读取 OPFS
中的真实 HTML/JavaScript 文件，内联项目脚本并加载本地运行时，不使用 CDN。导出 Phaser ZIP
会保留所有源文件，并把运行时写入 `vendor/phaser.min.js`，同时改写入口引用，因此导出的
ZIP 可直接用静态服务器打开。

源码 ZIP 仍由通用项目导出入口负责，导入时通过 `meta.md` 的 `type: phaser-game` 或
`index.html + src/scenes/*.js` 结构识别项目类型。

## AI 协作约定

聊天助手可以直接读取和修改 `src/`、`assets/index.yml` 与 `README.md`。新增场景时先在
`src/scenes/` 创建独立文件，再在 `index.html` 的脚本顺序和 `src/main.js` 的 `scene` 数组
登记。生成媒体前先更新 `assets/index.yml` 的 prompt 和状态，生成后再把逻辑 ID 接入场景。
