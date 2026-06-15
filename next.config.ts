import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/image-cards/cards.json",
        destination: "/cards.json",
      },
    ];
  },
};

export default nextConfig;
