import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns:
      process.env.NODE_ENV === "development"
        ? [
            {
              protocol: "https",
              hostname: "**", // Allow all hostnames in development
            },
            {
              protocol: "http",
              hostname: "**",
            },
          ]
        : [
            // In production, specify allowed domains
            {
              protocol: "https",
              hostname: "arweave.net",
            },
            {
              protocol: "https",
              hostname: "*.arweave.net",
            },
            {
              protocol: "https",
              hostname: "ipfs.io",
            },
            {
              protocol: "https",
              hostname: "*.ipfs.io",
            },
          ],
  },
};

export default nextConfig;
