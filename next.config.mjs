/** @type {import('next').NextConfig} */
const isVercel = process.env.VERCEL === "1";
const isDev = process.env.NODE_ENV !== "production";

const nextConfig = {
  ...(isVercel ? { output: "standalone" } : {}),
  ...(isDev && !isVercel ? { distDir: ".next-dev" } : {}),
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: isVercel ? { exclude: ["error", "warn"] } : false
  },
  transpilePackages: ["@alrehla/atmosfera", "@alrehla/dawayir", "@alrehla/masarat"],
  poweredByHeader: false,
  experimental: {
    esmExternals: "loose"
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

export default nextConfig;
