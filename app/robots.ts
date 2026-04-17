import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://www.alrehla.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/api/",
          "/admin/",
          "/admin",
          "/analytics/",
          "/_next/",
          "/auth/",
          "/activation",
          "/checkout/",
          "/debug-*",
          "/editor/",
          "/plasmic-host/",
        ],
      },
      // AI Crawlers — explicitly welcome for AI discovery
      {
        userAgent: "GPTBot",
        allow: ["/"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: ["/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/"],
      },
      {
        userAgent: "anthropic-ai",
        allow: ["/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/"],
      },
      {
        userAgent: "Googlebot",
        allow: ["/"],
      },
      {
        userAgent: "Bingbot",
        allow: ["/"],
      },
      // Yandex — covers Russian-speaking audiences
      {
        userAgent: "YandexBot",
        allow: ["/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
