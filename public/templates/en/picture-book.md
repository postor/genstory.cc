# AGENTS.md

## Picture-book mission

Maintain a continuous read-aloud experience built from landscape art, page text, and narration.

## Project structure

```text
/
├── meta.md
├── assets/
│   ├── index.yml
│   ├── pages/
│   └── voice/
└── chapter-001/
    └── pages/
        └── page-001/
            ├── meta.md
            └── story.md
```

## Page rules

- `story.md` stores story text and logical asset IDs such as `image_asset` and `voice_asset`.
- `assets/index.yml` is the single source of truth for image and voice files; never hard-code paths in story text.
- Keep page order stable with `order` or page names, and use landscape composition by default.
- Narration is optional page state; missing narration must never make the written story unreadable.
- Describe state in source files, not playback functions or rendering commands.

## Validation

Check canon and timeline, edit pages, validate the asset index and character state, then preview pagination, narration, and PDF export.
