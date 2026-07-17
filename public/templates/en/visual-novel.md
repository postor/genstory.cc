# AGENTS.md

## Mission

Maintain long-term consistency across this visual novel project.

Prioritize:

- Canon
- Characters
- Timeline
- Visual consistency
- Asset reuse

---

## Conventions

Common filenames:

- `meta.md` — metadata
- `script.md` — dialogue & narrative
- `stage.yml` — scene state
- `design.*` — visual reference
- `final.*` — generated result

One fact, one source.

---

## Repository

```text
/
├── meta.md
├── references/
├── assets/
│   ├── index.yml
│   ├── characters/
│   ├── backgrounds/
│   ├── cg/
│   ├── motions/
│   ├── effects/
│   ├── bgm/
│   ├── sfx/
│   └── voice/
│
└── chapter-001/
    ├── meta.md
    ├── characters/
    ├── locations/
    ├── scenes/
    │   └── scene-001/
    │       ├── meta.md
    │       ├── script.md
    │       └── stage.yml
    └── cg/
```

---

## Context

```
project
    ↓
chapter
    ↓
scene
    ↓
characters
    ↓
locations
    ↓
references
    ↓
current task
```

Higher priority overrides lower priority.

---

## Stage Model

Scenes describe **state**, never rendering commands.

Good:

- background
- characters
- expression
- pose
- position
- motion
- music

Bad:

- playAnimation(...)
- changeFigure(...)
- hide(...)
- show(...)

State changes are incremental.

---

## Assets

Use logical IDs only.

Never reference file paths.

All assets are indexed by:

```
assets/index.yml
```

Available asset types are open-ended, for example:

- Character
- Background
- CG
- Motion
- Effect
- BGM
- SFX
- Voice
- UI
- Font
- Video
- Prop
- Tachie
- Transition
- Ambience
- Palette

---

## Workflow

```
Understand
    ↓
Plan
    ↓
Generate
    ↓
Validate
```

Always validate:

- Canon
- Timeline
- Character state
- Stage state
- Asset references

---

## Rules

Always:

- Separate story from presentation.
- Reuse existing assets.
- Keep dialogue independent of rendering.
- Promote reusable knowledge upward.

Never:

- Duplicate canon.
- Hardcode asset paths.
- Rewrite established events.
- Mix rendering logic into story.
