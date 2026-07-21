"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, HelpCircle, LogIn, LogOut, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLang } from "@/lib/i18n";
import {
  beginCloudOAuth,
  CLOUD_OAUTH_CONFIG,
  clearCloudToken,
  handleCloudOAuthCallback,
  loadCloudToken,
  requestGoogleToken,
} from "@/lib/cloud-sync/oauth";
import { loadCloudSyncSettings, saveCloudSyncSettings } from "@/lib/cloud-sync/storage";
import {
  CLOUD_PROVIDER_LABELS,
  type CloudProviderId,
  type CloudSyncSettings,
} from "@/lib/cloud-sync/types";

const GOOGLE_DRIVE_PROVIDER = "google-drive" satisfies CloudProviderId;
const PROVIDERS = [GOOGLE_DRIVE_PROVIDER] as const;
type VisibleCloudProviderId = (typeof PROVIDERS)[number];

const DOCS: Record<VisibleCloudProviderId, string> = {
  "google-drive": "https://developers.google.com/drive/api/guides/about-sdk",
};

const OAUTH_DOCS: Record<VisibleCloudProviderId, string> = {
  "google-drive": "https://developers.google.com/identity/oauth2/web/guides/use-token-model",
};

export default function SettingsClient() {
  const { lang, t } = useLang();
  const [settings, setSettings] = useState<CloudSyncSettings>(() => ({
    ...loadCloudSyncSettings(),
    provider: GOOGLE_DRIVE_PROVIDER,
  }));
  const [connected, setConnected] = useState<Record<CloudProviderId, boolean>>(() =>
    Object.fromEntries(
      PROVIDERS.map((provider) => [provider, loadCloudToken(provider) !== null])
    ) as Record<CloudProviderId, boolean>
  );
  const [busyProvider, setBusyProvider] = useState<CloudProviderId | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = t("meta.settingsTitle");
  }, [t]);

  const visibleSettings = useMemo<CloudSyncSettings>(
    () => ({ ...settings, provider: GOOGLE_DRIVE_PROVIDER }),
    [settings]
  );

  useEffect(() => {
    void handleCloudOAuthCallback()
      .then((provider) => {
        if (provider !== GOOGLE_DRIVE_PROVIDER) return;
        setConnected((current) => ({ ...current, [provider]: true }));
        setSettings((current) => ({ ...current, provider }));
        setFeedback(t("settings.cloud.connected", { provider: CLOUD_PROVIDER_LABELS[provider][lang] }));
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : String(reason)));
  }, [lang, t]);

  function updateSettings(patch: Partial<CloudSyncSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  async function connect(provider: CloudProviderId) {
    setBusyProvider(provider);
    setError(null);
    setFeedback(null);
    updateSettings({ provider });
    saveCloudSyncSettings({ ...visibleSettings, provider });
    try {
      if (provider === "google-drive") {
        await requestGoogleToken(visibleSettings.rememberAuthorization);
        setConnected((current) => ({ ...current, [provider]: true }));
        setFeedback(t("settings.cloud.connected", { provider: CLOUD_PROVIDER_LABELS[provider][lang] }));
      } else {
        await beginCloudOAuth(provider, visibleSettings.rememberAuthorization);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusyProvider(null);
    }
  }

  function disconnect(provider: CloudProviderId) {
    clearCloudToken(provider);
    setConnected((current) => ({ ...current, [provider]: false }));
    setFeedback(t("settings.cloud.disconnected", { provider: CLOUD_PROVIDER_LABELS[provider][lang] }));
  }

  function savePreferences() {
    saveCloudSyncSettings(visibleSettings);
    setFeedback(t("settings.cloud.preferencesSaved"));
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("settings.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("settings.cloud.subtitle")}</p>
        </div>
        <Button type="button" variant="outline" onClick={() => setGuideOpen(true)}>
          <HelpCircle className="size-4" />
          {t("settings.cloud.guideButton")}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("settings.cloud.title")}</CardTitle>
          <CardDescription>{t("settings.cloud.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <p className="text-sm font-medium">{t("settings.cloud.providerLabel")}</p>
            <div className="grid gap-3">
              {PROVIDERS.map((provider) => {
                const label = CLOUD_PROVIDER_LABELS[provider][lang];
                const configured = Boolean(CLOUD_OAUTH_CONFIG[provider].clientId);
                const isConnected = connected[provider];
                const active = visibleSettings.provider === provider;
                return (
                  <div
                    key={provider}
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 ${
                      active ? "border-primary/60 bg-primary/5" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => updateSettings({ provider })}
                    >
                      <span className="flex items-center gap-2 font-medium">
                        {label}
                        {isConnected ? <CheckCircle2 className="size-4 text-emerald-600" /> : null}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {isConnected
                          ? t("settings.cloud.connectedStatus")
                          : configured
                            ? t("settings.cloud.notConnectedStatus")
                            : t("settings.cloud.notConfiguredStatus")}
                      </span>
                    </button>
                    {isConnected ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => disconnect(provider)}>
                        <LogOut className="size-4" />
                        {t("settings.cloud.disconnect")}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void connect(provider)}
                        disabled={!configured || busyProvider !== null}
                      >
                        <LogIn className="size-4" />
                        {busyProvider === provider
                          ? t("settings.cloud.connecting")
                          : t("settings.cloud.connect")}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
            <input
              type="checkbox"
              checked={visibleSettings.rememberAuthorization}
              onChange={(event) => updateSettings({ rememberAuthorization: event.target.checked })}
              className="mt-0.5 size-4 accent-primary"
            />
            <span>
              <span className="font-medium">{t("settings.cloud.rememberLabel")}</span>
              <span className="mt-1 block text-muted-foreground">{t("settings.cloud.rememberHint")}</span>
            </span>
          </label>

          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {feedback ? (
            <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
              {feedback}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={savePreferences}>
              <Save className="size-4" />
              {t("settings.cloud.savePreferences")}
            </Button>
          </div>

          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm leading-6 text-amber-800 dark:text-amber-200">
            {t("settings.cloud.folderNote")}
          </p>
        </CardContent>
      </Card>

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("settings.cloud.guideTitle")}</DialogTitle>
            <DialogDescription>{t("settings.cloud.guideDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p className="rounded-lg bg-muted p-3 leading-6">{t("settings.cloud.guideSteps")}</p>
            <div className="grid gap-2">
              {PROVIDERS.map((provider) => (
                <a
                  key={provider}
                  href={DOCS[provider]}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-lg border px-3 py-2 font-medium hover:bg-muted"
                >
                  {CLOUD_PROVIDER_LABELS[provider][lang]} · {t("settings.cloud.apiDocs")}
                  <ExternalLink className="size-4" />
                </a>
              ))}
              {PROVIDERS.map((provider) => (
                <a
                  key={`${provider}-oauth`}
                  href={OAUTH_DOCS[provider]}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-lg border px-3 py-2 font-medium hover:bg-muted"
                >
                  {CLOUD_PROVIDER_LABELS[provider][lang]} · {t("settings.cloud.oauthDocs")}
                  <ExternalLink className="size-4" />
                </a>
              ))}
            </div>
            <p className="text-xs leading-5 text-muted-foreground">{t("settings.cloud.clientIdNote")}</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setGuideOpen(false)}>
              {t("common.ok")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
