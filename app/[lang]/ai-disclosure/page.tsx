import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";
import {
  normalizePublicLang,
  publicPageMetadata,
  type PublicLang,
} from "@/lib/seo";

type Props = {
  params: Promise<{ lang: string }>;
};

const pageSeo: Record<PublicLang, { title: string; description: string }> = {
  zh: {
    title: "AI 使用说明 - GenStory.cc",
    description: "GenStory.cc AI 助手、生成结果、输入边界和第三方模型服务使用说明。",
  },
  en: {
    title: "AI Use Notice - GenStory.cc",
    description:
      "How GenStory.cc uses optional AI assistants, generated outputs, input boundaries, and third-party model services.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = normalizePublicLang((await params).lang);

  return publicPageMetadata({
    lang,
    path: "ai-disclosure",
    ...pageSeo[lang],
  });
}

export default function AiDisclosurePage() {
  return <LegalPage kind="ai" />;
}
