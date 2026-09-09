import type { NextConfig } from "next";
import { EVENT_FORM_MAX_BYTES } from "./lib/event-materials";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.24"],
  experimental: {
    // External macOS volumes can create `._*` sidecar files that Turbopack's
    // persistent database cannot parse. Keep Turbopack, but use in-memory
    // caches so development and production builds stay reliable on this volume.
    turbopackFileSystemCacheForDev: false,
    turbopackFileSystemCacheForBuild: false,
    proxyClientMaxBodySize: EVENT_FORM_MAX_BYTES,
    serverActions: {
      // Allow both 10 MB event attachments plus multipart overhead.
      bodySizeLimit: EVENT_FORM_MAX_BYTES,
    },
  },
};

export default nextConfig;
