/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: [
    '@messenger/types',
    '@messenger/auth',
    '@messenger/drive-connector',
    '@messenger/ai-connector',
    '@messenger/matrix',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.API_INTERNAL_URL ? `${process.env.API_INTERNAL_URL}/api/:path*` : 'http://localhost:4000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
