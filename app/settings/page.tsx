import type { Metadata } from "next";

import SettingsClient from "./settings-client";

export const metadata: Metadata = {
  title: {
    absolute: "Settings - GenStory.cc",
  },
  description:
    "Configure browser-only cloud sync and OpenAI-compatible API settings for GenStory.cc.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsPage() {
  return <SettingsClient />;
}
