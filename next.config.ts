import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.24"],
  experimental: {
    // External macOS volumes can create `._*` sidecar files that Turbopack's
    // persistent database cannot parse. Keep Turbopack, but use its in-memory
    // development cache so `next dev` starts reliably on this volume.
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
