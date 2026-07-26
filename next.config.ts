import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repoName = "thirdspace.toronto.edu";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? `/${repoName}` : "",
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;