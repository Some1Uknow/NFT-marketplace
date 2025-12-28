import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Set to false only if you know what you're doing
    ignoreBuildErrors: false,
  },
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
              hostname: "gateway.irys.xyz",
            },
            {
              protocol: "https",
              hostname: "*.irys.xyz",
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
