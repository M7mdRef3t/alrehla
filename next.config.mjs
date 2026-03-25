/** @type {import('next').NextConfig} */
const isVercel = process.env.VERCEL === '1';
const nextConfig = {
  ...(isVercel ? { output: 'standalone' } : {}),
  reactStrictMode: true,

  // ── تسريع الـ compile ──
  // SWC minifier (أسرع من Terser بـ 7x)
  swcMinify: true,

  // تخفيف العمليات أثناء التطوير
  compiler: {
    // إزالة console.log تلقائياً في الإنتاج
    removeConsole: isVercel ? { exclude: ['error', 'warn'] } : false,
  },

  // تعطيل X-Powered-By header (أمان + أداء بسيط)
  poweredByHeader: false,

  experimental: {
    serverComponentsExternalPackages: ["@sentry/node"],
    typedRoutes: false,
    // تسريع التجميع بـ Turbopack (Next.js 14+)
    // ملاحظة: قيد تجريبي — يمكن تفعيله مع `next dev --turbo`
    optimizePackageImports: [
      "framer-motion",
      "lucide-react",
      "@supabase/supabase-js",
      "recharts",
      "@google/generative-ai",
    ],
  },

  // We removed publicRuntimeConfig to prevent unintentional leaking of env vars.
  // Use NEXT_PUBLIC_ prefixes for client-side variables.
};

export default nextConfig;
