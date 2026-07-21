# Game Project Rules

This project is a runnable Phaser browser game. Real source files are the source of truth: `index.html` is the entry point, `src/scenes/` owns scenes, and `assets/index.yml` owns the asset plan.

- Follow Phaser 3 scene lifecycle methods: `preload`, `create`, and `update`.
- Keep the menu scene responsible for starting the game, scene navigation, and controls help; keep gameplay state in the game scene.
- Switch scenes with `this.scene.start("SceneKey")`; do not put every behavior in `src/main.js`.
- When images and audio are not generated yet, keep comments, logical asset IDs, and prompts that can be handed to an image/audio model; do not fabricate binary files.
- Prefer Phaser Graphics and text so the template remains runnable without generated media.
- After changing scenes, use browser preview and verify menu → test game → menu state flow.

## File responsibilities

- `index.html`: static entry point and script order.
- `src/config.js`: Phaser configuration.
- `src/scenes/menu-scene.js`: menu scene.
- `src/scenes/test-game-scene.js`: playable test game scene.
- `assets/index.yml`: logical IDs, status, and generation prompts for future images, audio, and other assets.
