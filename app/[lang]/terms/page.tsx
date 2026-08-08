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
    title: "服务条款 - GenStory.cc",
    description: "GenStory.cc 服务条款、使用边界、本地存储、AI 和第三方服务说明。",
  },
  en: {
    title: "Terms of Service - GenStory.cc",
    description:
      "GenStory.cc terms for usage boundaries, local storage, AI, and third-party services.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = normalizePublicLang((await params).lang);

  return publicPageMetadata({
    lang,
    path: "terms",
    ...pageSeo[lang],
  });
}

export default function TermsPage() {
  return <LegalPage kind="terms" />;
}
