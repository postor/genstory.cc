import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "AI 使用说明 - GenStory.cc",
  description: "GenStory.cc AI 助手和第三方模型服务使用说明。",
};

export default function AiDisclosurePage() {
  return <LegalPage kind="ai" />;
}
