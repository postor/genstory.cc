<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:project-rules -->
# Project preferences

- **Rendering**: Prefer Static Site Generation (SSG). Reach for dynamic/server rendering only when a page genuinely needs it.
- **Stack**: Next.js + shadcn/ui + Tailwind CSS are the default first choices for UI work.
- **Best practices**: Follow current best practices and idiomatic patterns for the chosen stack.
- **No legacy compatibility**: Do not spend effort supporting old browsers, deprecated APIs, or historical versions. Target modern, current runtimes only.
- **Styling**: Avoid bespoke/custom styles. Prefer shadcn/ui's original components and design tokens. For anything without a shadcn primitive, use Tailwind utility classes that match the shadcn look. **Never use the inline `style` attribute** — express all styling via shadcn components or Tailwind classes. When building UI, reuse shadcn primitives (Dialog, Button, Input, Select, Textarea, ScrollArea, …) instead of re-implementing them with custom CSS. A custom re-implementation of a shadcn primitive (e.g. a hand-rolled modal that mimics `Dialog`) is considered redundant and should be removed in favor of the original.
<!-- END:project-rules -->
