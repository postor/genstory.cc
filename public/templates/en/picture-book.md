# AGENTS.md

## Picture-book mission

Maintain a continuous read-aloud experience built from landscape art, page text, and narration.

## Project structure

```text
/
├── meta.md
└── chapter-001/
    └── pages/
        └── page-001/
            ├── meta.md
            ├── story.md
            ├── page.png
            └── voice.mp3
```

## Page rules

- Each page keeps `story.md`, `page.png`, and `voice.mp3` together in one page directory.
- `story.md` stores story text and overlay settings: `text_position`, `text_size`, `text_color`, `text_stroke`, and `text_width`.
- Keep page order stable with `order` or page names, and use landscape composition by default.
- Narration is optional page state; missing narration must never make the written story unreadable.
- Text is page state rendered over the illustration; do not write playback or rendering functions into story files.

## Project Cover

- A root-level `cover.jpg` or `cover.png` is the cover shown on project cards and continue-work cards; the app checks `cover.jpg` first, then `cover.png`.
- The cover is only workspace preview metadata, not page art or narration asset. If the same image is also used on a picture-book page, register it separately in `assets/index.yml`.
- Use a landscape composition close to 2.2:1, with a clear centered subject and safe edges for important text and characters.

## Validation

Check canon and timeline, edit pages, validate the asset index and character state, then preview pagination, narration, and PDF export.
