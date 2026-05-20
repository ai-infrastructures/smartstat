import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Transpile the local workspace shared package so Next.js handles its TS source directly.
  transpilePackages: ["@smartstat/shared"],
  // Stricter checks during build
  typescript: {
    ignoreBuildErrors: false,
  },
  // Pin Turbopack to the monorepo root so the multi-lockfile warning goes away
  // and the runtime resolves workspace packages correctly.
  turbopack: {
    root: path.join(__dirname, "..", ".."),
  },
};

export default nextConfig;
