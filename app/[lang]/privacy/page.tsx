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
    title: "隐私说明 - GenStory.cc",
    description: "GenStory.cc 数据保存、浏览器本地项目、第三方服务和用户控制说明。",
  },
  en: {
    title: "Privacy Notice - GenStory.cc",
    description:
      "How GenStory.cc handles local browser projects, third-party services, and user controls.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = normalizePublicLang((await params).lang);

  return publicPageMetadata({
    lang,
    path: "privacy",
    ...pageSeo[lang],
  });
}

export default function PrivacyPage() {
  return <LegalPage kind="privacy" />;
}
