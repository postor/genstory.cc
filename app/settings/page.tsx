import type { Metadata } from "next";

import SettingsClient from "./settings-client";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata({
  path: "settings",
  title: "设置 - GenStory.cc",
  description:
    "配置浏览器本地存储、云盘同步和 OpenAI 兼容 API 设置。",
});

export default function SettingsPage() {
  return <SettingsClient />;
}
