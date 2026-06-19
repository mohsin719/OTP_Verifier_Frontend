import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hostinger: use `next start` (not standalone) so CSS/JS static files
  // stay in .next/static automatically — no manual folder copy needed.
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  async rewrites() {
    return [
      { source: "/manage", destination: "/admin" },
      { source: "/manage/:path*", destination: "/admin/:path*" },
    ];
  },
};

export default nextConfig;
