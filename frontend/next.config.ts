import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/manage", destination: "/admin" },
      { source: "/manage/:path*", destination: "/admin/:path*" },
    ];
  },
  async redirects() {
    return [
      { source: "/favicon.ico", destination: "/next.svg", permanent: false },
    ];
  },
};

export default nextConfig;
