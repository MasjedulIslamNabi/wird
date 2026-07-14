import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Capacitor (Android/iOS) — generates pure HTML/CSS/JS in out/
  output: "export",

  // Disable server-side image optimization (not available in static export)
  images: {
    unoptimized: true,
  },

  // Trailing slash for consistent routing in the static export
  trailingSlash: true,

  typescript: {
    ignoreBuildErrors: true,
  },

  reactStrictMode: true,
};

export default nextConfig;
