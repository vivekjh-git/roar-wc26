import type { NextConfig } from "next";

const defaultCache = require("next-pwa/cache");

const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // The FIFA match-centre proxy makes chained external calls that can occasionally take longer
  // than the default 10s NetworkFirst timeout used for /api/* routes — when that happens the
  // service worker falls back to a cached (possibly empty/stale) response instead of waiting,
  // which is how real data can get permanently "stuck" showing as unavailable. This route's data
  // is real-time and already cached server-side (Next's fetch cache) and retried client-side, so
  // the service worker should always go straight to the network for it with no artificial cutoff.
  runtimeCaching: [
    {
      urlPattern: /\/api\/wc\/fifa-match/,
      handler: "NetworkOnly",
    },
    ...defaultCache,
  ],
});

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "flagcdn.com" },
      { protocol: "https", hostname: "media.api-sports.io" },
    ],
  },
};

export default withPWA(nextConfig);
