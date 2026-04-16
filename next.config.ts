import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Security headers (additional layer on top of middleware)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Remove server fingerprinting
          { key: "X-Powered-By", value: "" },
        ],
      },
      {
        // Protect Next.js internal routes
        source: "/api/:path*",
        headers: [
          { key: "X-Powered-By", value: "" },
        ],
      },
    ];
  },

  // Image optimization configuration
  images: {
    // Only allow images from trusted domains
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.islamic.network",
      },
    ],
  },

  // Redirects for SEO
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
      {
        source: "/index.html",
        destination: "/",
        permanent: true,
      },
    ];
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // Enable strict mode for catching bugs in development
  reactStrictMode: true,
};

export default nextConfig;
