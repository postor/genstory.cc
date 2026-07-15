import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static Site Generation: emit a fully static site into ./out
  output: "export",
  // next/image optimization requires a server; disable it for static export
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
