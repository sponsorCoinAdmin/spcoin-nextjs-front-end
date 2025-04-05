/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true, // ✅ Enable source maps for Chrome DevTools
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };

    // Optional: Explicitly set source map mode for frontend builds
    if (!config.devtool) {
      config.devtool = 'source-map';
    }

    return config;
  },
  async redirects() {
    return [
      {
        source: '/websites/:site',
        destination: '/websites/:site/index.html',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
