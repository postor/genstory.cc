import type { Metadata } from "next";

import ProjectsClient from "./projects-client";

export const metadata: Metadata = {
  title: {
    absolute: "Projects - GenStory.cc",
  },
  description: "GenStory.cc local creative workspace.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProjectsPage() {
  return <ProjectsClient />;
}
