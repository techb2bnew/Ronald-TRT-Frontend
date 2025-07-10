/** @type {import('next').NextConfig} */
const nextConfig = { 
  reactStrictMode: false,  // Disable Strict Mode
  typescript: { ignoreBuildErrors: true },
  images: {
    domains: ["ronaldo-trt.s3.ap-south-1.amazonaws.com"], // ✅ Add the domain here
  },
  // output: 'export'  
};

module.exports = nextConfig;
