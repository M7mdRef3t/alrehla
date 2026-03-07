import fs from "node:fs";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parseJsonBody, verifyAdminWithRoles } from "./_shared";
import type { AdminRequest, AdminResponse } from "./_shared";

const execFileAsync = promisify(execFile);

type FixItem = { key: string; applied: boolean; message: string };

const ROBOTS_TEMPLATE = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /analytics
Disallow: /api/

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: https://www.alrehla.app/sitemap.xml
`;

const ROOT_FALLBACK = `<div id="root">
      <main>
        <h1>Alrehla - Relationship Clarity Platform</h1>
        <p>
          Alrehla helps you understand your relationships and boundaries with clarity through Dawayir.
        </p>
        <p>
          ???? ????? ???? ???????? ???? ???? ???? ?????? ????? ?????.
        </p>
        <nav aria-label="Quick links">
          <a href="/">Home</a>
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </nav>
      </main>
    </div>
    <noscript>
      <p>JavaScript is disabled. You can still access key pages from the links above.</p>
    </noscript>`;

const SCHEMA_BLOCKS = `    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Alrehla",
        "url": "https://www.alrehla.app/",
        "logo": "https://www.alrehla.app/icons/icon-512x512.png",
        "sameAs": [],
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "EG"
        }
      }
    </script>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Alrehla - ????? ?????",
        "operatingSystem": "iOS, Android",
        "applicationCategory": "TravelApplication",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      }
    </script>
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "inLanguage": "ar",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "??? ??????? Alrehla ?? ??????? ??????",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "?????? Alrehla ??? ????? ????? ?????? ??????? ????????? ???????? ??? ???????."
            }
          },
          {
            "@type": "Question",
            "name": "?? ??????? Alrehla ??????",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "???? ????? ????? ?????? ???????? ??????? ???????? ???? ?????."
            }
          },
          {
            "@type": "Question",
            "name": "?? ??????? ???? ??? iOS ?Android?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "???? Alrehla ????? iOS ?Android ?????? ??????? ???? ??? ??????."
            }
          }
        ]
      }
    </script>`;

function projectRoot(): string {
  return path.resolve(process.cwd());
}

function writeIfChanged(filePath: string, next: string): boolean {
  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  if (current === next) return false;
  fs.writeFileSync(filePath, next, "utf8");
  return true;
}

async function fixRobots(root: string): Promise<FixItem> {
  const filePath = path.join(root, "public", "robots.txt");
  const applied = writeIfChanged(filePath, ROBOTS_TEMPLATE);
  return { key: "robots", applied, message: applied ? "robots.txt updated" : "robots.txt already compliant" };
}

async function fixIndex(root: string): Promise<FixItem> {
  const filePath = path.join(root, "index.html");
  if (!fs.existsSync(filePath)) return { key: "index", applied: false, message: "index.html not found" };
  let html = fs.readFileSync(filePath, "utf8");
  let changed = false;

  const hasOrg = html.includes('"@type": "Organization"');
  const hasApp = html.includes('"@type": "SoftwareApplication"');
  const hasFaq = html.includes('"@type": "FAQPage"');
  if (!hasOrg || !hasApp || !hasFaq) {
    const marker = '<meta name="theme-color"';
    if (html.includes(marker)) {
      html = html.replace(marker, `${SCHEMA_BLOCKS}\n\n    ${marker}`);
      changed = true;
    }
  }

  const hasFallbackH1 = html.includes("Alrehla - Relationship Clarity Platform") && html.includes("<h1>");
  if (!hasFallbackH1 && html.includes('<div id="root"></div>')) {
    html = html.replace('<div id="root"></div>', ROOT_FALLBACK);
    changed = true;
  }

  if (changed) fs.writeFileSync(filePath, html, "utf8");
  return { key: "index", applied: changed, message: changed ? "index.html SEO fallback/schema applied" : "index.html already compliant" };
}

async function fixSitemap(root: string): Promise<FixItem> {
  const scriptPath = path.join(root, "scripts", "generate-sitemap.mjs");
  if (!fs.existsSync(scriptPath)) return { key: "sitemap", applied: false, message: "generate-sitemap script not found" };
  try {
    await execFileAsync(process.execPath, [scriptPath], { cwd: root });
    return { key: "sitemap", applied: true, message: "sitemap regenerated" };
  } catch {
    return { key: "sitemap", applied: false, message: "failed to regenerate sitemap" };
  }
}

export async function handleSeoAutofix(req: AdminRequest, res: AdminResponse) {
  if (!(await verifyAdminWithRoles(req, res, ["owner", "superadmin", "developer", "admin"]))) return;
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const body = await parseJsonBody(req);
  const actions = Array.isArray(body?.actions) ? body.actions.map((v: unknown) => String(v)) : ["robots", "index", "sitemap"];
  const root = projectRoot();
  const fixes: FixItem[] = [];

  if (actions.includes("robots")) fixes.push(await fixRobots(root));
  if (actions.includes("index")) fixes.push(await fixIndex(root));
  if (actions.includes("sitemap")) fixes.push(await fixSitemap(root));

  res.status(200).json({
    ok: true,
    appliedCount: fixes.filter((f) => f.applied).length,
    fixes
  });
}



