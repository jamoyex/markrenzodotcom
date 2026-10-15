import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  reactStrictMode: true,
  images: {
    qualities: [75, 90],
  },
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-src 'self'; object-src 'none'; base-uri 'self'",
          },
        ],
      },
    ];
  },
  // Runtime credentials and mutable knowledge must never enter a deployment trace.
  outputFileTracingExcludes: {
    "/*": ["./.env*", "./.data/**/*", "./branding/**/*", "./artifacts/**/*"],
  },
};

export default config;
