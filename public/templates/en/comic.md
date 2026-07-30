# AGENTS.md

## Mission

Maintain long-term consistency across the comic project.

Prioritize:

- Canon
- Characters
- Timeline
- Visual consistency
- Story pacing

Optimize the project as a whole, never a single page in isolation.

---

## Conventions

Common filenames have fixed meanings.

| File | Purpose |
|------|---------|
| `meta.md` | Metadata for the current directory. |
| `design.*` | Visual design reference. |
| `storyboard.md` | Narrative, panels and dialogue. |
| `layout.*` | Page composition / thumbnail. |
| `final.*` | Final artwork. |

Store each piece of information in exactly one place.

---

## Repository

```text
/
├── meta.md
│
├── references/
│   ├── glossary.md
│   ├── timeline.md
│   ├── world.md
│   ├── factions.md
│   └── rules.md
│
├── assets/
│   ├── characters/
│   ├── locations/
│   ├── props/
│   ├── creatures/
│   ├── vehicles/
│   └── symbols/
│
├── chapter-001/
│   ├── meta.md
│   │
│   ├── characters/
│   │   ├── protagonist/
│   │   │   ├── meta.md
│   │   │   ├── design.png
│   │   │   ├── expressions.md
│   │   │   └── outfits.md
│   │   └── ...
│   │
│   ├── locations/
│   │   ├── school/
│   │   │   ├── meta.md
│   │   │   └── design.png
│   │   └── ...
│   │
│   ├── pages/
│   │   ├── page-001/
│   │   │   ├── meta.md
│   │   │   ├── storyboard.md
│   │   │   ├── layout.png
│   │   │   ├── final.png
│   │   │   └── panels/
│   │   │       ├── panel-001.md
│   │   │       ├── panel-002.md
│   │   │       └── ...
│   │   └── ...
│   │
│   └── illustrations/
│       └── cover.png
│
└── chapter-002/
```

---

## Context Priority

Always load context in this order.

```text
meta.md
    ↓
chapter/meta.md
    ↓
chapter/characters/
    ↓
chapter/locations/
    ↓
references/
    ↓
previous chapters
    ↓
current request
```

Higher-priority context always wins.

---

## Project Cover

- A root-level `cover.jpg` or `cover.png` is the cover shown on project cards and continue-work cards; the app checks `cover.jpg` first, then `cover.png`.
- The cover is only workspace preview metadata, not comic page or canon asset. If the same image is also used in page content, register it separately in `assets/index.yml` or the relevant page files.
- Use a landscape composition close to 2.2:1, with a clear centered subject and safe edges for important text and characters.

---

## Workflow

Every task follows the same pipeline.

```text
Understand
    ↓
Plan
    ↓
Generate
    ↓
Validate
```

Before completion, always verify:

- Canon
- Timeline
- Character state
- Location state
- Visual continuity
- Dialogue consistency

---

## Character Guidelines

Each character directory describes the character **only for the current chapter**.

Example:

```text
protagonist/
├── meta.md
├── design.png
├── expressions.md
└── outfits.md
```

`meta.md`

```yaml
name: Rin

role: protagonist

state:
  emotion: calm
  health: normal
  outfit: school_uniform
  location: school_gate

knowledge:
  knows:
    - missing brother disappeared
  unknown:
    - principal identity

continuity:
  left_wrist_scar: true
  dominant_hand: right
```

`expressions.md`

```yaml
default:
  eyes: relaxed
  mouth: neutral

happy:
  smile: open

angry:
  eyebrows: lowered

fear:
  eyes: wide
```

---

## Page Guidelines

Each page is the smallest production unit.

`meta.md`

```yaml
page: 1

purpose:
  Introduce protagonist

emotion:
  quiet

pace:
  slow

location:
  school_gate

time:
  morning

characters:
  - Rin
```

`storyboard.md`

```markdown
# Panel 1

Wide shot.

Morning.

School gate.

Students entering.

Dialogue:
None.

---

# Panel 2

Medium shot.

Rin walks alone.

Caption:

April.
The beginning of everything.

---

# Panel 3

Close-up.

Phone vibrates.

Unknown number.

---

# Panel 4

Extreme close-up.

Rin hesitates.
```

`panel-001.md`

```yaml
shot: wide

camera: eye_level

composition:
  Rin in lower right
  School gate dominates frame

lighting:
  soft morning light

expression:
  neutral

sfx:
  birds

continuity:
  school_uniform
```

---

## Rules

Always:

- Keep canon consistent.
- Characters know only what they have experienced.
- Match artwork with current chapter state.
- Reuse knowledge instead of duplicating it.
- Update only the current chapter unless requested.

Never:

- Retcon established events.
- Change personalities abruptly.
- Invent convenient powers or information.
- Ignore metadata.
- Duplicate canon across multiple files.

---

## Knowledge Promotion

When information becomes stable, move it upward.

```text
Page
    ↓
Chapter
    ↓
References
    ↓
Project meta
```

Every fact should have exactly one authoritative source.
