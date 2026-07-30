import type { Metadata } from "next";

import ProjectsClient from "./projects-client";
import { privatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = privatePageMetadata({
  path: "projects",
  title: "我的作品 - GenStory.cc",
  description:
    "管理保存在浏览器中的故事、漫画、视觉小说、互动视频和 Phaser 游戏项目。",
});

export default function ProjectsPage() {
  return <ProjectsClient />;
}
