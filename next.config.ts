/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: { ignoreBuildErrors: true },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ronaldo-trt.s3.ap-south-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'ronaldo-prorevv.s3.eu-north-1.amazonaws.com',
      }
    ],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  async redirects() {
    return [
      {
        source: '/old-url',
        destination: '/new-url',
        permanent: true, // ✅ 301
      },
    ];
  },
};

module.exports = nextConfig;