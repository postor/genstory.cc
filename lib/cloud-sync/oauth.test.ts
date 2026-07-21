import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAuthorizationUrl,
  CLOUD_OAUTH_CONFIG,
  clearCloudToken,
  GOOGLE_DRIVE_CLIENT_ID,
  DROPBOX_APP_KEY,
  loadCloudToken,
  saveCloudToken,
  type CloudOAuthConfig,
  type StorageLike,
} from "./oauth.ts";

const config: CloudOAuthConfig = {
  provider: "dropbox",
  clientId: "public-client",
  authorizationEndpoint: "https://auth.example/authorize",
  tokenEndpoint: "https://auth.example/token",
  scope: "files.content.read files.content.write",
  authParams: { token_access_type: "offline" },
};

test("builds a PKCE authorization URL without exposing a client secret", () => {
  const url = new URL(buildAuthorizationUrl(config, "https://app.example/settings", "state", "challenge"));
  assert.equal(url.searchParams.get("client_id"), "public-client");
  assert.equal(url.searchParams.get("code_challenge"), "challenge");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("token_access_type"), "offline");
  assert.equal(url.searchParams.get("client_secret"), null);
});

test("uses the built-in Google Drive OAuth client ID", () => {
  assert.equal(CLOUD_OAUTH_CONFIG["google-drive"].clientId, GOOGLE_DRIVE_CLIENT_ID);
  assert.equal(
    GOOGLE_DRIVE_CLIENT_ID,
    "271171439504-vc4fhde8ei0736h7qlkfqcqdcbsh3d5l.apps.googleusercontent.com"
  );
});

test("uses the built-in Dropbox app key and removes OneDrive OAuth", () => {
  assert.equal(CLOUD_OAUTH_CONFIG.dropbox.clientId, DROPBOX_APP_KEY);
  assert.equal(DROPBOX_APP_KEY, "rlwotrslri8sko6");
  assert.equal(Object.hasOwn(CLOUD_OAUTH_CONFIG, "one-drive"), false);
});

test("round-trips cloud tokens through an injected storage shape", () => {
  const makeStorage = () => {
    const values = new Map<string, string>();
    return {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => void values.set(key, value),
      removeItem: (key: string) => void values.delete(key),
    } satisfies StorageLike;
  };
  const local = makeStorage();
  const session = makeStorage();
  const stores = { local, session };
  assert.equal(loadCloudToken("dropbox", stores), null);
  saveCloudToken("dropbox", { accessToken: "token" }, false, stores);
  assert.equal(loadCloudToken("dropbox", stores)?.accessToken, "token");
  clearCloudToken("dropbox", stores);
  assert.equal(loadCloudToken("dropbox", stores), null);
});
