/**
 * adminSeo.ts — SEO audit + autofix via Admin API.
 */

import { callAdminApi } from "./adminCore";
import type { SeoAuditReport, SeoAutofixResult } from "./adminTypes";

export async function runSeoAudit(url: string): Promise<SeoAuditReport | null> {
  const apiData = await callAdminApi<SeoAuditReport>("seo/audit", {
    method: "POST",
    body: JSON.stringify({ url })
  });

  if (apiData) return apiData;

  return {
    url,
    score: 0,
    findings: [],
    checks: {
      title: { exists: false },
      description: { exists: false },
      viewport: false,
      canonical: false,
      robotsTxt: false,
      sitemapXml: false,
      schemaJsonLd: false,
      organizationSchema: false,
      softwareApplicationSchema: false,
      faqSchema: false
    },
    scores: { overall: 0, seo: 0, geo: 0, health: 0 },
    counters: { critical: 0, warning: 0, passed: 0 },
    targetUrl: url,
    finalUrl: url,
    summary: {
      wordCount: 0,
      h1Count: 0,
      imagesWithAlt: 0,
      images: 0,
      internalLinks: 0,
      externalLinks: 0,
      schemaTypes: []
    }
  };
}

export async function applySeoAutofix(checks: string[]): Promise<SeoAutofixResult | null> {
  const apiData = await callAdminApi<SeoAutofixResult>("seo/autofix", {
    method: "POST",
    body: JSON.stringify({ checks })
  });

  if (apiData) return apiData;

  return {
    ok: false,
    touched: [],
    message: "seo_autofix_unavailable",
    appliedCount: 0,
    fixes: []
  };
}
