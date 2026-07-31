import type { Metadata } from "next";

import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "服务条款 - GenStory.cc",
  description: "GenStory.cc 服务条款与使用边界。",
};

export default function TermsPage() {
  return <LegalPage kind="terms" />;
}
