import type { Metadata } from "next";

import ProjectsClient from "./projects-client";
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
    title: "我的作品 - GenStory.cc",
    description:
      "管理保存在浏览器中的故事、漫画、视觉小说、互动视频和 Phaser 游戏项目。",
  },
  en: {
    title: "My works - GenStory.cc",
    description:
      "Manage stories, comics, visual novels, interactive videos, and Phaser game projects saved in this browser.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = normalizePublicLang((await params).lang);

  return privatePageMetadata({
    lang,
    path: "projects",
    ...pageSeo[lang],
  });
}

export default function ProjectsPage() {
  return <ProjectsClient />;
}
