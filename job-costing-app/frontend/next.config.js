/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  env: {
    API_URL: process.env.API_URL || 'http://localhost:3001/api/v1',
    APP_URL: process.env.APP_URL || 'http://localhost:3000',
  },
};

module.exports = nextConfig;