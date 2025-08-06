import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    unoptimized: true, // For static exports and local cache files
  },
};

export default nextConfig;
