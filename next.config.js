/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/alpaca/:path*',
        destination: '/api/alpaca-proxy?path=:path*',
      },
      {
        source: '/api/alpaca-data/:path*',
        destination: '/api/alpaca-data-proxy?path=:path*',
      },
    ];
  },
};

module.exports = nextConfig;
