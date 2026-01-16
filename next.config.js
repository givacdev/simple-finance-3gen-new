/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // NÃO coloca nada em experimental.turbopack – deixa o Vercel decidir
  // Se quiser forçar Webpack clássico (mais estável), usa isso abaixo:
  // webpack: (config) => {
  //   return config;
  // },
};

module.exports = nextConfig;