import type { Metadata } from "next";

import ProjectsClient from "./projects-client";

export const metadata: Metadata = {
  title: "我的项目 - GenStory",
  description: "管理保存在浏览器本地的 GenStory 项目。",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProjectsPage() {
  return <ProjectsClient />;
}
