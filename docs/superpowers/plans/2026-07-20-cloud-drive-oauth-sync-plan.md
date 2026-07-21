# Browser-only Cloud Drive OAuth Sync Plan

**Goal:** Let a user back up and restore the global GenStory.cc workspace with Google Drive or Dropbox, without a GenStory.cc account, backend, or ZIP-based cloud transfer.

## Product decisions

- OPFS remains the local source of truth.
- Cloud sync is global and starts from the Projects page.
- OAuth happens directly in the browser with the provider's official flow.
- Google Drive and Dropbox use built-in public client IDs.
- Files are stored under an isolated provider app folder. Google Drive and Dropbox use `GenStory.cc Workspace - Local Story Projects`.
- Upload warns that matching relative paths overwrite remote files.
- Download compares content, warns about conflicts, overwrites only after confirmation, merges new files, and never deletes unrelated local files.
- “Download, merge, then upload” is available as an explicit three-step action.
- Tokens and sync preferences stay in browser storage and are never included in source ZIPs.

## Implementation map

- `lib/cloud-sync/types.ts`: provider contracts, progress, conflict models, and the global root name.
- `lib/cloud-sync/oauth.ts`: Google Identity Services plus Dropbox PKCE OAuth.
- `lib/cloud-sync/providers.ts`: provider-specific list, upload, and download adapters.
- `lib/cloud-sync/sync.ts`: OPFS snapshots, content comparison, merge plans, and upload/download execution.
- `app/settings/settings-client.tsx`: provider selection, connection state, OAuth onboarding dialog, and official docs links.
- `app/projects/projects-client.tsx`: global upload/download/sync actions, overwrite confirmations, conflict previews, and progress dialog.

## Acceptance checklist

- [x] No user system or GenStory.cc backend.
- [x] No S3/presigned URL dependency.
- [x] No ZIP is used for cloud sync.
- [x] Cloud target is global, not per-project.
- [x] Upload, download/merge, and merge-then-upload flows are visible.
- [x] Conflicts and overwrite behavior are explicit in Chinese and English.
- [x] Official Google and Dropbox guidance is linked from a dialog.
- [x] Local source ZIP export/import remains available as an independent offline backup.
