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
  transpilePackages: ['@alrehla/atmosfera'],
  poweredByHeader: false
};

export default nextConfig;
