import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.24"],
  experimental: {
    // External macOS volumes can create `._*` sidecar files that Turbopack's
    // persistent database cannot parse. Keep Turbopack, but use in-memory
    // caches so development and production builds stay reliable on this volume.
    turbopackFileSystemCacheForDev: false,
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
