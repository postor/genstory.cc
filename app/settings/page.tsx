import type { Metadata } from "next";

import SettingsClient from "./settings-client";

export const metadata: Metadata = {
  title: {
    absolute: "Cloud Sync Settings - GenStory.cc",
  },
  description:
    "Configure optional browser-only Google Drive sync for your local GenStory.cc workspace.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsPage() {
  return <SettingsClient />;
}
