# AGENTS.md

## Mission

Maintain long-term consistency across this interactive video project.

Prioritize:

- Canon
- Character state
- Timeline
- Audiovisual continuity
- Branch logic
- Asset reuse

Interactive video is built from segments, timelines, choice points, videos, audio and scene images. Story facts and playback logic must stay separate.

---

## Conventions

Common filenames:

- `meta.md` — metadata
- `script.md` — narration, dialogue and segment text
- `timeline.yml` — segment timeline state
- `choices.yml` — choice points and branches
- `design.*` — visual / audio reference
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
│   ├── scenes/
│   ├── videos/
│   ├── audio/
│   ├── characters/
│   └── ui/
│
└── chapter-001/
    ├── meta.md
    ├── characters/
    ├── locations/
    └── segments/
        └── segment-001/
            ├── meta.md
            ├── script.md
            ├── timeline.yml
            └── choices.yml
```

---

## Context

```text
project
    ↓
chapter
    ↓
segment
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

## Timeline Model

Segment timelines describe **state** and **semantic events**, never player implementation details.

Good:

- video
- voice
- music
- caption
- choice
- state

Bad:

- player.seek(...)
- element.play()
- DOM operations
- external absolute paths

---

## Assets

Use logical IDs only. All assets are indexed by:

```text
assets/index.yml
```

Common asset types:

- Background
- Character
- Video
- Voice
- BGM
- SFX
- UI
- Transition
- Prop

---

## Workflow

```text
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
- Choice reachability
- Asset references
- Audiovisual continuity

---

## Rules

Always:

- Separate story, timeline and playback implementation.
- Reuse existing video, image and audio assets.
- Keep branches traceable and recoverable.
- Promote stable knowledge upward.

Never:

- Hardcode filesystem paths in scripts.
- Put player code into story files.
- Create unreachable or unrecoverable branches unless they are explicit endings.
- Duplicate canon or asset facts.
