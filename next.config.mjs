/** @type {import('next').NextConfig} */
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: true,
});

const isVercel = process.env.VERCEL === "1";
const isDev = process.env.NODE_ENV !== "production";

const nextConfig = {
  ...(isVercel ? { output: "standalone" } : {}),
  ...(isDev && !isVercel ? { distDir: ".next-dev" } : {}),
  reactStrictMode: !isDev, // Disabled in dev to prevent double-invoke Fast Refresh loops
  ...(isVercel ? {
    compiler: {
      removeConsole: { exclude: ["error", "warn"] }
    }
  } : {}),
  transpilePackages: ["@alrehla/atmosfera", "@alrehla/dawayir", "@alrehla/masarat"],
  poweredByHeader: false,
  experimental: {
    esmExternals: true,
    optimizePackageImports: ["lucide-react", "framer-motion", "recharts"]
  },
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },

  // ═══ SEO & Security Headers ═══
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Security
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=(), interest-cohort=()"
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload"
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.clarity.ms",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com https://www.google-analytics.com https://www.facebook.com https://graph.facebook.com https://*.clarity.ms https://*.vercel-insights.com https://*.vercel-analytics.com",
              "frame-src 'self' https://accounts.google.com",
              "media-src 'self' blob:",
              "worker-src 'self' blob:",
              "object-src 'self' data:",
            ].join("; ")
          },
        ],
      },
      // Cache static assets aggressively (icons, images, fonts)
      {
        source: "/icons/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/og-home-optimized.jpg",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000" },
        ],
      },
      {
        source: "/og-home.png",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
    ];
  },

  // ═══ SEO Redirects — Normalize trailing slashes & common typos ═══
  async redirects() {
    return [
      // Redirect /home to root
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
      // Common Arabic/English mistyped routes
      {
        source: "/الرحلة",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

import { withSentryConfig } from "@sentry/nextjs";

let finalConfig = withBundleAnalyzer(nextConfig);

// Only apply Sentry if we have the auth token, to prevent build failures in CI/Vercel
// when Sentry is not fully configured yet.
if (process.env.SENTRY_AUTH_TOKEN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
  finalConfig = withSentryConfig(finalConfig, {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options
    org: process.env.SENTRY_ORG || "alrehla",
    project: process.env.SENTRY_PROJECT || "alrehla",
    sentryUrl: "https://sentry.io/",
    
    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,
    
    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,
    
    // Hides source maps from generated client bundles
    hideSourceMaps: true,
    
    // Automatically tree-shake Sentry logger statements to reduce bundle size
    webpack: {
      treeshake: {
        removeDebugLogging: true,
      },
    },
  });
}

export default finalConfig;
