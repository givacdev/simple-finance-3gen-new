/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Desativa Turbopack e força Webpack clássico (mais estável)
  experimental: {
    turbopack: false,
  },
};

module.exports = nextConfig;