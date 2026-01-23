/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },

  // Experimental features
  experimental: {
    // Turbopack is enabled by default in Next.js 16
    // Memory and performance optimizations handled automatically
  },

  // Turbopack configuration
  // Turbopack automatically handles server-only module exclusions (fs, net, tls)
  // No additional configuration needed for standard Next.js apps
  turbopack: {},

  // Webpack fallback configuration (if Turbopack fails)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // Output configuration for better caching
  output: 'standalone',

  // Optimize production builds
  productionBrowserSourceMaps: false,

  // React strict mode for better development experience
  reactStrictMode: true,

  // Optimize image handling
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
};

module.exports = nextConfig;
