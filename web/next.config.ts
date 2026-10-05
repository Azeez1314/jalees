import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this app so a stray lockfile higher up the tree isn't picked up.
  turbopack: { root: path.resolve(__dirname) },
};

export default nextConfig;
