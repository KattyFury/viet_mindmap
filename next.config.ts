import type { NextConfig } from "next";

/** GitHub Pages: static export tại /viet_mindmap */
const isGithubPages = process.env.GITHUB_PAGES === "true";
const repoName = "viet_mindmap";

const nextConfig: NextConfig = {
  // Ẩn badge "N" (Next.js Dev Tools) góc màn hình khi dev
  devIndicators: false,
  ...(isGithubPages
    ? {
        output: "export" as const,
        basePath: `/${repoName}`,
        assetPrefix: `/${repoName}/`,
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
