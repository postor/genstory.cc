import type { MetadataRoute } from "next";

import { siteMetadata } from "@/lib/seo";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteMetadata.zhTitle,
    short_name: siteMetadata.name,
    description: siteMetadata.zhDescription,
    start_url: "/zh",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1f1f1f",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
