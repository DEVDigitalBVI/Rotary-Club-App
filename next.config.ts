import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.24"],
  experimental: {
    // External macOS volumes can create `._*` sidecar files that Turbopack's
    // persistent database cannot parse. Keep Turbopack, but use in-memory
    // caches so development and production builds stay reliable on this volume.
    turbopackFileSystemCacheForDev: false,
    turbopackFileSystemCacheForBuild: false,
    serverActions: {
      // Profile photos are capped at 3 MB; leave a small allowance for the
      // rest of the multipart form while retaining a strict request ceiling.
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
