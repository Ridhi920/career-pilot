import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  },
  async redirects() {
    return [
      // short-lived themed routes → plain routes
      { source: "/command", destination: "/dashboard", permanent: false },
      { source: "/scan", destination: "/resume", permanent: false },
      { source: "/radar", destination: "/jobs", permanent: false },
      { source: "/missions", destination: "/applications", permanent: false },
      { source: "/sim", destination: "/interview", permanent: false },
      { source: "/intel", destination: "/learning", permanent: false },
      { source: "/system", destination: "/settings", permanent: false },
      // old multi-page resume section now lives on one page
      { source: "/resume/:path+", destination: "/resume", permanent: false },
    ];
  },
};

export default nextConfig;
