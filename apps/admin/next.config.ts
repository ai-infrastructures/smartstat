import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile the local workspace shared package so Next.js handles its TS source directly.
  transpilePackages: ["@smartstat/shared"],
  // Stricter checks during build
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
