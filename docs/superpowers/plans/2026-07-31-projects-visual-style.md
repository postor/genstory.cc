# Projects Page Visual Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle `/projects` so its local project manager feels like the existing GenStory home page while preserving every project, import, cloud sync, share, edit, and delete workflow.

**Architecture:** Keep the current client component and state handlers in `app/projects/projects-client.tsx`. Add only presentational helpers and Tailwind classes in that file, using the existing `Card`, `Button`, `Popover`, `Dialog`, and `InteractionModal` primitives. Derive a project type label/icon from the existing `contentTypeById` registry so the UI uses logical project metadata rather than hard-coded asset paths.

**Tech Stack:** Next.js App Router, React client component, Tailwind CSS v4, shadcn/base-ui primitives, lucide-react, existing i18n and local project storage.

---

### Task 1: Establish the home-page visual surface

**Files:**
- Modify: `app/projects/projects-client.tsx`

- [ ] Wrap the existing main content in the homepage background and typography tokens: `bg-[linear-gradient(180deg,#f8f6ff_0%,#ffffff_34%,#fbfaff_100%)]`, `text-[#121331]`, and homepage max-width/gutters.
- [ ] Restyle the title area with a compact icon treatment, dark-purple heading, muted descriptive copy, and responsive action group.
- [ ] Keep the hidden file input and every existing action handler unchanged.

### Task 2: Restyle project cards without changing behavior

**Files:**
- Modify: `app/projects/projects-client.tsx`

- [ ] Import `contentTypeById` and the matching lucide icon map from `content-types.ts` so each card can show its registered type.
- [ ] Add a small type marker and metadata row, while retaining inline title editing and updated-at text.
- [ ] Apply homepage card tokens: pale-purple border, translucent white surface, soft shadow, hover lift, and a purple primary open action.
- [ ] Keep share, more actions, download, cloud sync, and delete actions accessible with existing labels and menus.

### Task 3: Improve empty and feedback states

**Files:**
- Modify: `app/projects/projects-client.tsx`

- [ ] Replace the plain empty card with a centered, illustrated-feeling empty state using existing icon primitives and a clear link to `/projects/new`.
- [ ] Restyle error, cloud success, and share feedback blocks with the homepage palette while preserving the existing reconnect action.
- [ ] Ensure long feedback text wraps without horizontal overflow.

### Task 4: Verify behavior and rendering

**Files:**
- Test: `app/projects/page.test.ts`
- Test: `app/projects/modal-interactions.test.ts`

- [ ] Run the focused project page tests and lint the modified component.
- [ ] Run TypeScript checking and a production build.
- [ ] Start the dev server, inspect `/projects` at desktop and mobile widths, and verify card actions, inline title editing, empty state, and dialogs remain usable.

