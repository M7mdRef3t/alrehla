/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@sentry/node"],
    typedRoutes: false
  }
};

export default nextConfig;
