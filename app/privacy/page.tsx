import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "隐私说明 - GenStory.cc",
  description: "GenStory.cc 数据保存、第三方服务和用户控制说明。",
};

export default function PrivacyPage() {
  return <LegalPage kind="privacy" />;
}
