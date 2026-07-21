# Cloud reconnect button debug report

## Symptom

When cloud sync failed with `云端授权已过期，请重新连接`, the Projects page rendered the whole message as inert text. The user could read "重新连接" but could not click it.

## Root cause

`app/projects/projects-client.tsx` stored cloud failures as a plain string in `error` and rendered that string inside a text-only alert. The existing OAuth reconnect action only lived on the Settings page, so the recoverable expired-token failure had no action attached at the failure site.

## Fix

- Detect the expired cloud authorization error in `setCloudError`.
- Render a shadcn `Button` labeled `settings.cloud.reconnect` inside the Projects page error alert when the error is recoverable.
- Reuse the current cloud provider settings to request Google authorization again, forcing a consent prompt for explicit reconnect.
- Add Chinese and English reconnect labels.

## Evidence

- `node --test --experimental-strip-types app/projects/page.test.ts`
- `node --test --experimental-strip-types app/projects/modal-interactions.test.ts lib/cloud-sync/oauth.test.ts`
- `npx tsc --noEmit`
- `npm run lint`

## Regression test

`app/projects/page.test.ts` now asserts that expired cloud authorization exposes a reconnect handler, a button click binding, and the reconnect i18n label.

## Status

DONE
