/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
  async redirects() {
    return [
      {
        source: "/websites/:site",
        destination: "/websites/:site/index.html",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
