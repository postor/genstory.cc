import type { Metadata } from "next";

import SettingsClient from "./settings-client";

export const metadata: Metadata = {
  title: "Cloud Sync Settings | GenStory",
  description:
    "Configure optional browser-only Google Drive, OneDrive, or Dropbox sync for your local GenStory workspace.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsPage() {
  return <SettingsClient />;
}
