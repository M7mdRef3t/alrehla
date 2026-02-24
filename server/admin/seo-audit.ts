import { verifyAdmin } from "./_shared";

type Severity = "critical" | "warning" | "passed";

type AuditFinding = {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  category: "technical" | "content" | "geo" | "links";
};

type AuditResponse = {
  scannedAt: string;
  targetUrl: string;
  finalUrl: string;
  scores: {
    overall: number;
    seo: number;
    geo: number;
    health: number;
  };
  counters: {
    critical: number;
    warning: number;
    passed: number;
  };
  summary: {
    wordCount: number;
    h1Count: number;
    images: number;
    imagesWithAlt: number;
    internalLinks: number;
    externalLinks: number;
    schemaTypes: string[];
  };
  checks: {
    title: { exists: boolean; length: number };
    description: { exists: boolean; length: number };
    viewport: boolean;
    canonical: boolean;
    robotsTxt: boolean;
    sitemapXml: boolean;
    schemaJsonLd: boolean;
    faqSchema: boolean;
    organizationSchema: boolean;
    softwareApplicationSchema: boolean;
  };
  findings: AuditFinding[];
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeUrl(input: string): URL | null {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

function extractJsonLdBlocks(html: string): string[] {
  const blocks: string[] = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null = null;
  while ((match = re.exec(html)) !== null) {
    blocks.push(match[1].trim());
  }
  return blocks;
}

function collectSchemaTypes(blocks: string[]): string[] {
  const out = new Set<string>();
  const visit = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const value = node as Record<string, unknown>;
    const t = value["@type"];
    if (typeof t === "string") out.add(t);
    if (Array.isArray(t)) {
      for (const item of t) if (typeof item === "string") out.add(item);
    }
    for (const key of Object.keys(value)) {
      visit(value[key]);
    }
  };

  for (const raw of blocks) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) visit(item);
      } else {
        visit(parsed);
      }
    } catch {
      // ignore invalid JSON-LD block
    }
  }

  return Array.from(out);
}

async function fetchText(url: string): Promise<{ ok: boolean; text: string; finalUrl: string }> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "Alrehla-SEO-Auditor/1.0"
      }
    });
    const text = await res.text();
    return { ok: res.ok, text, finalUrl: res.url || url };
  } catch {
    return { ok: false, text: "", finalUrl: url };
  }
}

function buildFindings(input: {
  checks: AuditResponse["checks"];
  summary: AuditResponse["summary"];
}): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const { checks, summary } = input;

  if (!checks.title.exists) {
    findings.push({ id: "title", title: "Meta title missing", description: "Add a unique <title> tag.", severity: "critical", category: "content" });
  } else if (checks.title.length < 30 || checks.title.length > 65) {
    findings.push({ id: "title-length", title: "Meta title length", description: "Keep title between 30-65 characters.", severity: "warning", category: "content" });
  } else {
    findings.push({ id: "title-pass", title: "Meta title", description: "Title exists with recommended length.", severity: "passed", category: "content" });
  }

  if (!checks.description.exists) {
    findings.push({ id: "description", title: "Meta description missing", description: "Add meta description for snippets.", severity: "critical", category: "content" });
  } else if (checks.description.length < 70 || checks.description.length > 170) {
    findings.push({ id: "description-length", title: "Meta description length", description: "Keep description around 70-170 characters.", severity: "warning", category: "content" });
  } else {
    findings.push({ id: "description-pass", title: "Meta description", description: "Description length is healthy.", severity: "passed", category: "content" });
  }

  if (!checks.viewport) {
    findings.push({ id: "viewport", title: "Viewport meta missing", description: "Add viewport meta for mobile rendering.", severity: "critical", category: "technical" });
  } else {
    findings.push({ id: "viewport-pass", title: "Viewport meta", description: "Viewport meta found.", severity: "passed", category: "technical" });
  }

  if (summary.h1Count === 0) {
    findings.push({ id: "h1", title: "H1 missing", description: "At least one H1 should be present in HTML response.", severity: "critical", category: "content" });
  } else {
    findings.push({ id: "h1-pass", title: "H1 tags", description: `Found ${summary.h1Count} H1 tags.`, severity: "passed", category: "content" });
  }

  if (!checks.robotsTxt) {
    findings.push({ id: "robots", title: "robots.txt missing", description: "Publish robots.txt at domain root.", severity: "critical", category: "technical" });
  } else {
    findings.push({ id: "robots-pass", title: "robots.txt", description: "robots.txt is reachable.", severity: "passed", category: "technical" });
  }

  if (!checks.sitemapXml) {
    findings.push({ id: "sitemap", title: "sitemap.xml missing", description: "Publish sitemap.xml and submit to search engines.", severity: "critical", category: "technical" });
  } else {
    findings.push({ id: "sitemap-pass", title: "sitemap.xml", description: "Sitemap is reachable.", severity: "passed", category: "technical" });
  }

  if (!checks.schemaJsonLd) {
    findings.push({ id: "schema", title: "Schema JSON-LD missing", description: "Add structured data markup for AI visibility.", severity: "critical", category: "geo" });
  } else {
    findings.push({ id: "schema-pass", title: "Schema JSON-LD", description: "Structured data scripts were detected.", severity: "passed", category: "geo" });
  }

  if (!checks.organizationSchema) {
    findings.push({ id: "org-schema", title: "Organization schema missing", description: "Add Organization schema to establish brand entity.", severity: "warning", category: "geo" });
  } else {
    findings.push({ id: "org-schema-pass", title: "Organization schema", description: "Organization schema detected.", severity: "passed", category: "geo" });
  }

  if (!checks.softwareApplicationSchema) {
    findings.push({ id: "app-schema", title: "SoftwareApplication schema missing", description: "Add SoftwareApplication schema for app entity context.", severity: "warning", category: "geo" });
  } else {
    findings.push({ id: "app-schema-pass", title: "SoftwareApplication schema", description: "SoftwareApplication schema detected.", severity: "passed", category: "geo" });
  }

  if (!checks.faqSchema) {
    findings.push({ id: "faq-schema", title: "FAQ schema missing", description: "Add FAQPage schema for AI answer extraction.", severity: "warning", category: "geo" });
  } else {
    findings.push({ id: "faq-schema-pass", title: "FAQ schema", description: "FAQPage schema detected.", severity: "passed", category: "geo" });
  }

  if (summary.wordCount < 120) {
    findings.push({ id: "word-count", title: "Low visible word count", description: "Add crawlable, text-rich HTML content for bots without JS execution.", severity: "warning", category: "content" });
  } else {
    findings.push({ id: "word-count-pass", title: "Word count", description: `Visible content includes ${summary.wordCount} words.`, severity: "passed", category: "content" });
  }

  if (summary.images > 0 && summary.imagesWithAlt < summary.images) {
    findings.push({ id: "image-alt", title: "Missing image alt text", description: "Ensure all images include meaningful alt text.", severity: "warning", category: "content" });
  } else {
    findings.push({ id: "image-alt-pass", title: "Image alt text", description: "Image alt coverage looks healthy.", severity: "passed", category: "content" });
  }

  if (summary.internalLinks === 0) {
    findings.push({ id: "internal-links", title: "No internal links detected", description: "Add crawlable internal links to improve discoverability.", severity: "warning", category: "links" });
  } else {
    findings.push({ id: "internal-links-pass", title: "Internal links", description: `Detected ${summary.internalLinks} internal links.`, severity: "passed", category: "links" });
  }

  return findings;
}

function scoreFromFindings(findings: AuditFinding[]): AuditResponse["scores"] {
  let seo = 100;
  let geo = 100;
  let health = 100;

  for (const item of findings) {
    const penalty = item.severity === "critical" ? 20 : item.severity === "warning" ? 8 : 0;
    if (penalty === 0) continue;
    if (item.category === "geo") geo -= penalty;
    else if (item.category === "technical") health -= penalty;
    else seo -= penalty;
  }

  seo = clamp(seo);
  geo = clamp(geo);
  health = clamp(health);
  const overall = clamp((seo * 0.45) + (geo * 0.35) + (health * 0.20));
  return { overall, seo, geo, health };
}

export async function handleSeoAudit(req: any, res: any) {
  if (!(await verifyAdmin(req, res))) return;
  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const fallbackUrl = process.env.PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://www.alrehla.app/";
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const candidateUrl = String(req.query?.url ?? body?.url ?? fallbackUrl).trim();
  const urlObject = safeUrl(candidateUrl);
  if (!urlObject) {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  const page = await fetchText(urlObject.toString());
  if (!page.ok || !page.text) {
    res.status(502).json({ error: "Failed to fetch target URL" });
    return;
  }

  const html = page.text;
  const finalUrl = safeUrl(page.finalUrl) || urlObject;
  const origin = finalUrl.origin;

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const viewportMatch = /<meta[^>]*name=["']viewport["'][^>]*>/i.test(html);
  const canonicalMatch = /<link[^>]*rel=["']canonical["'][^>]*>/i.test(html);
  const h1Count = (html.match(/<h1\b/gi) ?? []).length;

  const imageTags = html.match(/<img\b[^>]*>/gi) ?? [];
  const imagesWithAlt = imageTags.filter((tag) => /\balt\s*=\s*["'][^"']*["']/i.test(tag)).length;

  const linkMatches = Array.from(html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi));
  let internalLinks = 0;
  let externalLinks = 0;
  for (const match of linkMatches) {
    const href = String(match[1] ?? "").trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    if (href.startsWith("/")) {
      internalLinks += 1;
      continue;
    }
    const linkUrl = safeUrl(href);
    if (!linkUrl) continue;
    if (linkUrl.origin === origin) internalLinks += 1;
    else externalLinks += 1;
  }

  const words = stripTags(html);
  const wordCount = words ? words.split(/\s+/).filter(Boolean).length : 0;

  const jsonLdBlocks = extractJsonLdBlocks(html);
  const schemaTypes = collectSchemaTypes(jsonLdBlocks);

  const robotsProbe = await fetchText(`${origin}/robots.txt`);
  const sitemapProbe = await fetchText(`${origin}/sitemap.xml`);

  const checks: AuditResponse["checks"] = {
    title: { exists: Boolean(titleMatch?.[1]?.trim()), length: (titleMatch?.[1]?.trim() ?? "").length },
    description: { exists: Boolean(descriptionMatch?.[1]?.trim()), length: (descriptionMatch?.[1]?.trim() ?? "").length },
    viewport: viewportMatch,
    canonical: canonicalMatch,
    robotsTxt: robotsProbe.ok,
    sitemapXml: sitemapProbe.ok,
    schemaJsonLd: jsonLdBlocks.length > 0,
    faqSchema: schemaTypes.includes("FAQPage"),
    organizationSchema: schemaTypes.includes("Organization"),
    softwareApplicationSchema: schemaTypes.includes("SoftwareApplication")
  };

  const summary: AuditResponse["summary"] = {
    wordCount,
    h1Count,
    images: imageTags.length,
    imagesWithAlt,
    internalLinks,
    externalLinks,
    schemaTypes
  };

  const findings = buildFindings({ checks, summary });
  const scores = scoreFromFindings(findings);

  const counters = findings.reduce(
    (acc, item) => {
      acc[item.severity] += 1;
      return acc;
    },
    { critical: 0, warning: 0, passed: 0 }
  );

  const payload: AuditResponse = {
    scannedAt: new Date().toISOString(),
    targetUrl: urlObject.toString(),
    finalUrl: finalUrl.toString(),
    scores,
    counters,
    summary,
    checks,
    findings
  };

  res.status(200).json(payload);
}
