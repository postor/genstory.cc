import type { Metadata } from "next";

import SettingsClient from "./settings-client";
import {
  normalizePublicLang,
  privatePageMetadata,
  type PublicLang,
} from "@/lib/seo";

type Props = {
  params: Promise<{ lang: string }>;
};

const pageSeo: Record<PublicLang, { title: string; description: string }> = {
  zh: {
    title: "设置 - GenStory.cc",
    description: "配置浏览器本地存储、云盘同步和 OpenAI 兼容 API 设置。",
  },
  en: {
    title: "Settings - GenStory.cc",
    description:
      "Configure browser local storage, cloud sync, and OpenAI-compatible API settings.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = normalizePublicLang((await params).lang);

  return privatePageMetadata({
    lang,
    path: "settings",
    ...pageSeo[lang],
  });
}

export default function SettingsPage() {
  return <SettingsClient />;
}
