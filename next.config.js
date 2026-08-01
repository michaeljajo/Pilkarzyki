/** @type {import('next').NextConfig} */
const nextConfig = {
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

  // Permanent (308) redirects from the legacy /dashboard IA to the new
  // /leagues IA. Order matters: first match wins, so specific/renamed routes
  // are listed before generic catch-alls. Keep these so external links and
  // bookmarks never 404.
  async redirects() {
    return [
      // Roots
      { source: '/dashboard', destination: '/leagues', permanent: true },
      { source: '/dashboard/create-league', destination: '/leagues/new', permanent: true },

      // Legacy top-level dead pages
      { source: '/dashboard/results', destination: '/leagues', permanent: true },
      { source: '/dashboard/squad', destination: '/leagues', permanent: true },
      { source: '/dashboard/standings', destination: '/leagues', permanent: true },

      // Player league routes (renamed)
      { source: '/dashboard/leagues/:id/standings', destination: '/leagues/:id/league/table', permanent: true },
      { source: '/dashboard/leagues/:id/results', destination: '/leagues/:id/league/results', permanent: true },
      { source: '/dashboard/leagues/:id/squads', destination: '/leagues/:id/league/lineups', permanent: true },
      { source: '/dashboard/leagues/:id/top-scorers', destination: '/leagues/:id/league/scorers', permanent: true },
      { source: '/dashboard/leagues/:id/schedule', destination: '/leagues/:id/fixtures', permanent: true },
      { source: '/dashboard/leagues/:id/cup/standings', destination: '/leagues/:id/cup/bracket', permanent: true },
      // Tablica removed entirely -> land on Skład
      { source: '/dashboard/leagues/:id/tablica', destination: '/leagues/:id/squad', permanent: true },
      // Bare league -> Skład (default landing)
      { source: '/dashboard/leagues/:id', destination: '/leagues/:id/squad', permanent: true },
      // Everything else under a league keeps its slug (squad, cup/results, settings,
      // default-lineup, draft, midseason-draft, ...)
      { source: '/dashboard/leagues/:id/:path*', destination: '/leagues/:id/:path*', permanent: true },
      { source: '/dashboard/leagues', destination: '/leagues', permanent: true },

      // Admin -> per-league manage mode
      { source: '/dashboard/admin/leagues/:id/kolejka', destination: '/leagues/:id/manage/results', permanent: true },
      { source: '/dashboard/admin/leagues/new', destination: '/leagues/new', permanent: true },
      { source: '/dashboard/admin/leagues/:id/:path*', destination: '/leagues/:id/manage/:path*', permanent: true },
      { source: '/dashboard/admin/leagues/:id', destination: '/leagues/:id/manage', permanent: true },
      { source: '/dashboard/admin/leagues', destination: '/leagues', permanent: true },
      { source: '/dashboard/admin', destination: '/leagues', permanent: true },
    ];
  },
};

module.exports = nextConfig;
