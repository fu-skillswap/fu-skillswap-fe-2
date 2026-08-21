import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api.skillswap.asia/api/:path*',
      },
    ];
  },
};

export default nextConfig;
