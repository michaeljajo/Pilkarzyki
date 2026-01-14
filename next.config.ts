import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default nextConfig;
