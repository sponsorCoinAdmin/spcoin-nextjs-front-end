const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  webpack: (config, { dev }) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };

    if (dev) {
      config.devtool = 'source-map'; // or 'eval-source-map' for faster rebuilds
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
