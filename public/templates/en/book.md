# AGENTS.md

## Mission

Maintain long-term consistency across this fiction project.

Prioritize:

- Canon consistency
- Character consistency
- World consistency
- Timeline consistency
- Emotional continuity

Optimize the project as a whole, not individual chapters.

---

# Repository

```
/
├── meta.md                             # Project canon: genre, style, themes, world, terminology, AI constraints.
│
├── references/                         # Shared reusable knowledge.
│   ├── glossary.md                     # Terms and naming.
│   ├── timeline.md                     # Global timeline.
│   ├── history.md                      # World history.
│   ├── factions.md                     # Organizations and forces.
│   ├── rules.md                        # Magic / technology / combat rules.
│   └── ...
│
├── assets/                             # Global visual references.
│   ├── characters/
│   ├── locations/
│   ├── props/
│   ├── creatures/
│   └── symbols/
│
├── chapter-001/
│   ├── content.md                      # Chapter text only.
│   ├── meta.md                         # Summary, POV, timeline, status, foreshadowing.
│   │
│   ├── characters/
│   │   ├── meta.md                     # Character state for this chapter.
│   │   ├── design.png                  # Canonical appearance.
│   │   └── design-*.md                 # Variant / stage notes.
│   │
│   ├── locations/
│   │   ├── meta.md                     # Location state for this chapter.
│   │   ├── design.png
│   │   └── design-*.md
│   │
│   └── illustrations/
│       ├── cover.png                   # Chapter cover.
│       ├── scene-001.png               # Final illustration.
│       └── scene-001.md                # Composition, prompt, lighting, continuity notes.
│
├── chapter-002/
└── ...
```

---

## Context Priority

Always resolve context from highest priority to lowest.

```
Root/meta.md
    ↓
Current chapter/meta.md
    ↓
Current chapter/characters/
    ↓
Current chapter/locations/
    ↓
references/
    ↓
Previous chapters
    ↓
Current request
```

Higher-priority files always override lower-priority context.

---

## Workflow

Every writing task follows:

```
Understand
    ↓
Plan
    ↓
Generate
    ↓
Validate
```

Validation always includes:

- Canon
- Timeline
- Character state
- Location state
- Style
- Continuity

---

## Rules

Always:

- Treat `meta.md` as the source of truth.
- Preserve established canon unless explicitly revised.
- Keep character knowledge limited to what they have experienced.
- Maintain timeline and causal consistency.
- Match illustrations with the current chapter state.
- Store reusable knowledge in `references/` instead of duplicating it.

Never:

- Retcon established events without explanation.
- Rewrite personalities abruptly.
- Invent convenient abilities or solutions.
- Ignore chapter metadata.
- Modify existing metadata unless requested.

---

## Knowledge Management

When reusable knowledge emerges, promote it instead of repeating it.

Typical destinations:

- Project-wide rules → `meta.md`
- World lore → `references/`
- Character evolution → `characters/meta.md`
- Location evolution → `locations/meta.md`
- Visual changes → `design-*.md`
- Illustration guidance → `scene-*.md`

Keep each piece of knowledge in a single authoritative location.