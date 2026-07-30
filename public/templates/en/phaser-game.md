# Game Project Rules

This project is a runnable Phaser browser game. Real source files are the source of truth: `index.html` is the entry point, `src/scenes/` owns scenes, and `assets/index.yml` owns the asset plan. The template includes `assets/images/animal-cat.png` to demonstrate loading a real image asset.

- Follow Phaser 3 scene lifecycle methods: `preload`, `create`, and `update`.
- Keep the menu scene responsible for starting the game, scene navigation, and controls help; keep gameplay state in the game scene.
- Switch scenes with `this.scene.start("SceneKey")`; do not put every behavior in `src/main.js`.
- Register every image or audio asset with a logical asset ID before loading it from a scene's `preload()`.
- Resolve Phaser image, audio, and other media paths through `GenStoryAssets.resolve("assets/...")`. Preview injects an equivalent `?preview=1` state and maps OPFS files to blob URLs; downloaded local runs have no preview state and fall back to project-relative paths.
- `src/genstory-assets.js` is the shared asset-loading library entry point. Reuse it for new assets instead of repeating preview-mode checks in each scene.
- When images and audio are not generated yet, keep comments, logical asset IDs, and prompts that can be handed to an image/audio model; do not fabricate binary files.
- After changing scenes, use browser preview and verify menu → test game → menu state flow.

## Project Cover

- A root-level `cover.jpg` or `cover.png` is the cover shown on project cards and continue-work cards; the app checks `cover.jpg` first, then `cover.png`.
- The cover is only workspace preview metadata, not a Phaser runtime asset. If the same image is also used in the game, register it separately in `assets/index.yml` and load it through `GenStoryAssets.resolve("assets/...")`.
- Use a landscape composition close to 2.2:1, with a clear centered subject and safe edges for important text and characters.

## Game Asset Extractability

- When generating characters, enemies, NPCs, props, icons, effects, or other independently reusable image assets, add a clear, continuous, high-contrast outline around the subject whenever possible. Keep the outline consistent with the art style and prevent glow, shadows, or the background from swallowing it.
- Keep each asset's outer contour fully visible. Do not overlap or merge subjects, and avoid cropping, motion blur, excessive transparency, or busy backgrounds that make later cutout extraction unreliable.
- Prefer transparent backgrounds for separable assets. If a background is necessary, use a solid or low-detail background with clear luminance or hue contrast against the subject.
- Leave even safety padding around characters, props, and effects so the outline does not touch the canvas edge. Keep a set of related assets consistent in size, viewpoint, scale, outline width, and light direction.
- For sprite sheets or frame sequences, use a regular grid, fixed cell dimensions, and consistent spacing. Keep every frame inside its own cell without crossing cells, overlapping, or clipping the outline.
- In image asset `prompt` entries in `assets/index.yml`, record the subject, outline, background, padding, viewpoint, and extraction requirements. After generation, register the actual logical ID, intended use, dimensions, and status.

## File responsibilities

- `index.html`: static entry point and script order.
- `src/config.js`: Phaser configuration.
- `src/genstory-assets.js`: shared asset path resolver for preview and local runs.
- `src/scenes/menu-scene.js`: menu scene.
- `src/scenes/test-game-scene.js`: playable test game scene.
- `assets/index.yml`: logical IDs, status, and generation prompts for future images, audio, and other assets.
