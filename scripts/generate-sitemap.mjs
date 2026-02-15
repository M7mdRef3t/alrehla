#!/usr/bin/env node

/**
 * Dynamic Sitemap Generator
 * Generates a sitemap.xml file from a predefined list of routes
 * Run: node scripts/generate-sitemap.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");
const outputPath = path.join(projectRoot, "public", "sitemap.xml");

// Define all indexable routes with metadata
const routes = [
  {
    path: "/",
    lastmod: new Date().toISOString().split("T")[0],
    changefreq: "daily",
    priority: 1.0,
  },
  {
    path: "/app",
    lastmod: new Date().toISOString().split("T")[0],
    changefreq: "daily",
    priority: 0.9,
  },
  {
    path: "/map",
    lastmod: new Date().toISOString().split("T")[0],
    changefreq: "weekly",
    priority: 0.8,
  },
  {
    path: "/journey",
    lastmod: new Date().toISOString().split("T")[0],
    changefreq: "weekly",
    priority: 0.8,
  },
  {
    path: "/recovery-plan",
    lastmod: new Date().toISOString().split("T")[0],
    changefreq: "weekly",
    priority: 0.7,
  },
  {
    path: "/privacy",
    lastmod: new Date().toISOString().split("T")[0],
    changefreq: "monthly",
    priority: 0.5,
  },
  {
    path: "/terms",
    lastmod: new Date().toISOString().split("T")[0],
    changefreq: "monthly",
    priority: 0.5,
  },
  {
    path: "/about",
    lastmod: new Date().toISOString().split("T")[0],
    changefreq: "monthly",
    priority: 0.6,
  },
  {
    path: "/contact",
    lastmod: new Date().toISOString().split("T")[0],
    changefreq: "monthly",
    priority: 0.4,
  },
  {
    path: "/login",
    lastmod: new Date().toISOString().split("T")[0],
    changefreq: "monthly",
    priority: 0.3,
  },
  {
    path: "/signup",
    lastmod: new Date().toISOString().split("T")[0],
    changefreq: "monthly",
    priority: 0.3,
  },
];

const domain = process.env.DOMAIN || "https://www.alrehla.app";

// Generate XML
function generateSitemap(routes) {
  const baseUrl = `${domain}`;
  const urlEntries = routes
    .map(
      (route) => `  <url>
    <loc>${baseUrl}${route.path}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;
}

// Write to file
const sitemapContent = generateSitemap(routes);
fs.writeFileSync(outputPath, sitemapContent, "utf-8");
console.log(`✓ Sitemap generated: ${outputPath}`);
console.log(`  Routes: ${routes.length}`);
console.log(`  Domain: ${domain}`);
