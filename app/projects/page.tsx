import type { Metadata } from "next";

import ProjectsClient from "./projects-client";

export const metadata: Metadata = {
  title: "我的作品 - GenStory",
  description: "管理保存在这台设备浏览器中的 GenStory 作品。",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProjectsPage() {
  return <ProjectsClient />;
}
