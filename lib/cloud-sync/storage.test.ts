import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_CLOUD_SYNC_SETTINGS } from "./types.ts";

test("cloud sync has a deterministic global default provider", () => {
  assert.equal(DEFAULT_CLOUD_SYNC_SETTINGS.provider, "google-drive");
  assert.equal(DEFAULT_CLOUD_SYNC_SETTINGS.rememberAuthorization, false);
});
