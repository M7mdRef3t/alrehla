/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@sentry/node"],
    typedRoutes: false
  },
  // We removed publicRuntimeConfig to prevent unintentional leaking of env vars.
  // Use NEXT_PUBLIC_ prefixes for client-side variables.
};

export default nextConfig;
