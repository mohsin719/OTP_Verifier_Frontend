import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(process.cwd(), ".."),
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
