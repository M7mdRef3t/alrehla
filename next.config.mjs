/** @type {import('next').NextConfig} */
const isVercel = process.env.VERCEL === "1";
const isNetlify = process.env.NETLIFY === "true";
const isDev = process.env.NODE_ENV !== "production";

const nextConfig = {
  ...((isVercel || isNetlify) ? { output: "standalone" } : {}),
  ...(isDev && !isVercel ? { distDir: ".next-dev" } : {}),
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: isVercel ? { exclude: ["error", "warn"] } : false
  },
  poweredByHeader: false
};

export default nextConfig;
