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

Recommended fields for generated video assets:

- `model` — OpenRouter video model slug, for example `google/veo-3.1-lite`
- `duration` — clip duration in seconds, within the selected model's supported range
- `resolution` — output resolution, for example `720p`
- `aspect_ratio` — output shape, for example `16:9`
- `generation_status` — `planned`, `submitted`, `completed`, or `failed`

## Project Cover

- A root-level `cover.jpg` or `cover.png` is the cover shown on project cards and continue-work cards; the app checks `cover.jpg` first, then `cover.png`.
- The cover is only workspace preview metadata, not video, scene-image, or timeline asset. If the same image is also used in interactive content, register it separately in `assets/index.yml`.
- Use a landscape composition close to 2.2:1, with a clear centered subject and safe edges for important text and characters.

---

## OpenRouter Video Generation

Video generation is handled by project tools. Results are not automatically written into story files or downloaded to local disk.

Flow:

- Use `genstory_submit_openrouter_video_generation` to submit a generation task and record the returned job ID and status.
- Use `genstory_poll_openrouter_video_generation` to check progress; save only after the job is complete.
- Use `genstory_save_openrouter_video_result` to write the completed result into `assets/videos/*.mp4` after user confirmation.
- After saving, update `assets/index.yml` with the logical ID, file location, and generation status.
- If the job fails, is cancelled, or expires, state that clearly and do not register it as a final asset.

The user does not need a separate “fetch tool”; use the project tools above.

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
