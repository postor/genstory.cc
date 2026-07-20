# Phaser 游戏项目约束

本项目是一个可在浏览器中运行的 Phaser 游戏。真实源文件是唯一事实来源，`index.html` 负责入口，`src/scenes/` 负责场景，`assets/index.yml` 负责资产计划。

- 使用 Phaser 3 的场景生命周期：`preload`、`create`、`update`。
- 菜单场景只负责开始游戏、进入场景和显示操作提示；游戏场景负责玩法状态。
- 场景之间通过 `this.scene.start("SceneKey")` 切换，不要把所有逻辑堆在 `src/main.js`。
- 暂不生成图片和音频时，保留注释、逻辑资产 ID 和可直接交给图像/音频模型的 `prompt`，不要伪造二进制文件。
- 优先使用 Phaser Graphics 和文本保证模板在没有媒体资源时仍可运行。
- 修改场景后，先在浏览器预览，再检查菜单→测试游戏→返回菜单的状态流转。

## 文件职责

- `index.html`：静态入口与脚本加载顺序。
- `src/config.js`：Phaser 配置。
- `src/scenes/menu-scene.js`：菜单场景。
- `src/scenes/test-game-scene.js`：可操作的测试游戏场景。
- `assets/index.yml`：未来图片、音频和其他资产的逻辑 ID、状态与生成 prompt。
