// File: next.config.js
const path = require(`path`);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep your chosen runtime behavior
  reactStrictMode: false,
  productionBrowserSourceMaps: true,

  // Prevent Next from walking the entire parent tree when multiple lockfiles exist
  outputFileTracingRoot: path.join(__dirname, `..`),

  // NOTE: Next 15 no longer accepts `optimizeFonts` or `swcMinify`. Removed to silence warnings.

  // Optional: skip lint/type blocking during CI builds on tiny boxes
  // eslint: { ignoreDuringBuilds: true },
  // typescript: { ignoreBuildErrors: true },

  webpack: (config, { dev }) => {
    config.resolve = config.resolve || {};
    // Merge (don’t overwrite) existing fallbacks
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      net: false,
      tls: false,
    };

    // Aliases to keep single copies and silence RN-only deps in web builds
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      ethers: require.resolve(`ethers`),
      '@react-native-async-storage/async-storage': false,
    };

    // Keep your devtool tweak
    if (dev) {
      config.devtool = `source-map`; // or `eval-source-map` for faster rebuilds
    }

    return config;
  },

  async redirects() {
    return [
      {
        source: `/createRecipient`,
        destination: `/createAccount?type=Recipient`,
        permanent: false,
      },
      {
        source: `/websites/:site`,
        destination: `/websites/:site/index.html`,
        permanent: false,
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: `/createAccount`,
        destination: `/CreateAccount`,
      },
    ];
  },
};

module.exports = nextConfig;
