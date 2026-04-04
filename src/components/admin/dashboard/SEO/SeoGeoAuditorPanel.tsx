import { useMemo, useState } from "react";
import { applySeoAutofix, runSeoAudit, type SeoAuditFinding, type SeoAuditReport, type SeoAutofixResult } from "../../../../services/adminApi";

type LoadingState = "idle" | "loading";

function severityClass(severity: SeoAuditFinding["severity"]): string {
  if (severity === "critical") return "text-rose-300 bg-rose-500/15 border-rose-500/30";
  if (severity === "warning") return "text-amber-300 bg-amber-500/15 border-amber-500/30";
  return "text-emerald-300 bg-emerald-500/15 border-emerald-500/30";
}

function scoreClass(value: number): string {
  if (value >= 80) return "text-emerald-300";
  if (value >= 60) return "text-amber-300";
  return "text-rose-300";
}

function CheckPill({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={`rounded-xl border px-3 py-2 text-xs ${ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-rose-500/30 bg-rose-500/10 text-rose-300"}`}>
      <span className="font-semibold">{label}</span>
      <span className="ml-2">{ok ? "OK" : "Missing"}</span>
    </div>
  );
}

export function SeoGeoAuditorPanel() {
  const [url, setUrl] = useState("https://www.alrehla.app/");
  const [status, setStatus] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<SeoAuditReport | null>(null);
  const [autofixResult, setAutofixResult] = useState<SeoAutofixResult | null>(null);

  const findings = useMemo(() => {
    if (!report) return [];
    return [...report.findings].sort((a, b) => {
      const order = { critical: 0, warning: 1, passed: 2 } as const;
      return order[a.severity] - order[b.severity];
    });
  }, [report]);

  const runAudit = async () => {
    setStatus("loading");
    setError(null);
    const next = await runSeoAudit(url.trim());
    if (!next) {
      setError("Failed to run audit. Check admin access and target URL.");
      setStatus("idle");
      return;
    }
    setReport(next);
    setStatus("idle");
  };

  const runAutofix = async () => {
    setStatus("loading");
    setError(null);
    const result = await applySeoAutofix(["robots", "index", "sitemap"]);
    if (!result) {
      setError("Auto-fix failed. Ensure server can write project files.");
      setStatus("idle");
      return;
    }
    setAutofixResult(result);
    const next = await runSeoAudit(url.trim());
    if (next) setReport(next);
    setStatus("idle");
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-5">
        <h3 className="text-lg font-black text-white">SEO + GEO Auditor</h3>
        <p className="mt-1 text-sm text-slate-300">أداة متقدمة لفحص وتحليل جودة SEO والروابط والبيانات المهيكلة لضمان جودة الأرشفة.</p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.alrehla.app/"
            className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-200"
          />
          <button
            type="button"
            onClick={() => { void runAudit(); }}
            disabled={status === "loading"}
            className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-60"
          >
            {status === "loading" ? "Running..." : "Run Audit"}
          </button>
          <button
            type="button"
            onClick={() => { void runAutofix(); }}
            disabled={status === "loading"}
            className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-60"
          >
            {status === "loading" ? "Applying..." : "Auto Fix"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        {autofixResult && (
          <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
            <p className="font-semibold">Auto-fix applied: {autofixResult.appliedCount}</p>
            <ul className="mt-1 space-y-1">
              {autofixResult.fixes.map((fix) => (
                <li key={fix.key}>{fix.key}: {fix.message}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {report && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-4">
              <p className="text-xs text-slate-400">Overall</p>
              <p className={`text-3xl font-black ${scoreClass(report.scores.overall)}`}>{report.scores.overall}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-4">
              <p className="text-xs text-slate-400">SEO</p>
              <p className={`text-3xl font-black ${scoreClass(report.scores.seo)}`}>{report.scores.seo}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-4">
              <p className="text-xs text-slate-400">GEO</p>
              <p className={`text-3xl font-black ${scoreClass(report.scores.geo)}`}>{report.scores.geo}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-4">
              <p className="text-xs text-slate-400">Health</p>
              <p className={`text-3xl font-black ${scoreClass(report.scores.health)}`}>{report.scores.health}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
              <p className="text-xs text-rose-200">Critical</p>
              <p className="text-2xl font-black text-rose-300">{report.counters.critical}</p>
            </div>
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-xs text-amber-200">Warnings</p>
              <p className="text-2xl font-black text-amber-300">{report.counters.warning}</p>
            </div>
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="text-xs text-emerald-200">Passed</p>
              <p className="text-2xl font-black text-emerald-300">{report.counters.passed}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-5">
            <p className="text-sm text-slate-300">Target: <span className="font-semibold text-slate-100">{report.targetUrl}</span></p>
            <p className="mt-1 text-sm text-slate-400">Final URL: {report.finalUrl}</p>
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              <CheckPill label="Title" ok={report.checks.title.exists} />
              <CheckPill label="Description" ok={report.checks.description.exists} />
              <CheckPill label="Viewport" ok={report.checks.viewport} />
              <CheckPill label="Canonical" ok={report.checks.canonical} />
              <CheckPill label="robots.txt" ok={report.checks.robotsTxt} />
              <CheckPill label="sitemap.xml" ok={report.checks.sitemapXml} />
              <CheckPill label="Schema JSON-LD" ok={report.checks.schemaJsonLd} />
              <CheckPill label="Organization" ok={report.checks.organizationSchema} />
              <CheckPill label="SoftwareApplication" ok={report.checks.softwareApplicationSchema} />
              <CheckPill label="FAQPage" ok={report.checks.faqSchema} />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-5">
            <h4 className="text-sm font-bold text-slate-200">Content Summary</h4>
            <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
              <p className="text-slate-300">Words: <span className="font-semibold text-slate-100">{report.summary.wordCount}</span></p>
              <p className="text-slate-300">H1: <span className="font-semibold text-slate-100">{report.summary.h1Count}</span></p>
              <p className="text-slate-300">Images alt: <span className="font-semibold text-slate-100">{report.summary.imagesWithAlt}/{report.summary.images}</span></p>
              <p className="text-slate-300">Internal links: <span className="font-semibold text-slate-100">{report.summary.internalLinks}</span></p>
              <p className="text-slate-300">External links: <span className="font-semibold text-slate-100">{report.summary.externalLinks}</span></p>
              <p className="text-slate-300">Schema types: <span className="font-semibold text-slate-100">{report.summary.schemaTypes.join(", ") || "None"}</span></p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-5">
            <h4 className="text-sm font-bold text-slate-200">Findings</h4>
            <div className="mt-3 space-y-2">
              {findings.map((item) => (
                <div key={item.id} className={`rounded-xl border p-3 ${severityClass(item.severity)}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <span className="text-[11px] uppercase tracking-wide">{item.severity}</span>
                  </div>
                  <p className="mt-1 text-xs opacity-90">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
