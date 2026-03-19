/** @type {import('next').NextConfig} */
const isVercel = process.env.VERCEL === '1';
const nextConfig = {
  ...(isVercel ? { output: 'standalone' } : {}),
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@sentry/node"],
    typedRoutes: false
  },
  // We removed publicRuntimeConfig to prevent unintentional leaking of env vars.
  // Use NEXT_PUBLIC_ prefixes for client-side variables.
};

export default nextConfig;
