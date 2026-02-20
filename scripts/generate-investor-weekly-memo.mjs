import fs from "node:fs/promises";
import path from "node:path";

function env(name, fallback = "") {
  return process.env[name] || fallback;
}

function required(name) {
  const value = env(name);
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

function pct(numerator, denominator) {
  if (!denominator || denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function isoDate(value) {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toISOString().slice(0, 10);
}

async function fetchAdmin(baseUrl, bearerToken, kind, extraQuery = "") {
  const q = extraQuery ? `&${extraQuery}` : "";
  const url = `${baseUrl.replace(/\/$/, "")}/api/admin?path=overview&kind=${encodeURIComponent(kind)}${q}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      "Content-Type": "application/json"
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Admin API failed for kind=${kind}: ${res.status} ${text.slice(0, 240)}`);
  }
  return res.json();
}

function buildMemo(payload) {
  const now = new Date();
  const weekStart = env("INVESTOR_MEMO_WEEK_START", isoDate(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)));
  const weekEnd = env("INVESTOR_MEMO_WEEK_END", isoDate(now));

  const ownerOps = payload.ownerOps ?? {};
  const ops = payload.opsInsights ?? {};
  const exec = payload.executiveReport ?? {};

  const flow = ops?.funnel ?? {};
  const startClickRate = pct(flow.startClicked ?? 0, flow.landingViewed ?? 0);
  const addPersonCompletionRate = pct(flow.addPersonDone ?? 0, flow.addPersonOpened ?? 0);
  const pulseCompletionRate = pct(ops?.flowStats?.byStep?.pulse_completed ?? 0, flow.startClicked ?? 0);

  const health = ownerOps?.systemHealth ?? {};
  const security = ownerOps?.securitySignals ?? {};
  const reliability = exec?.reliability ?? {};

  const lines = [
    "# Weekly Investor Memo (Auto-generated)",
    "",
    "## Week",
    `- الفترة: \`${weekStart} .. ${weekEnd}\``,
    "",
    "## 1) Executive Summary",
    `- الحالة العامة: **${ownerOps?.status ?? "unknown"}**`,
    `- تشغيليًا: **${health?.status ?? "unknown"}** | أمنيًا: **${security?.status ?? "unknown"}**`,
    `- الأولوية القادمة: رفع Add Person Completion وتحسين D7 retention.`,
    "",
    "## 2) KPI Snapshot",
    `- WAJ: ${ops?.totals?.sessions30d ?? "N/A"} (proxy: sessions30d)`,
    `- Landing Views: ${flow.landingViewed ?? 0}`,
    `- Start Click Rate: ${startClickRate}%`,
    `- Pulse Completion Rate: ${pulseCompletionRate}%`,
    `- Add Person Completion Rate: ${addPersonCompletionRate}%`,
    `- D1: ${ops?.retentionCohorts?.[0]?.d1Pct ?? "N/A"}%`,
    `- D7: ${ops?.retentionCohorts?.[0]?.d7Pct ?? "N/A"}%`,
    `- D30: ${ops?.retentionCohorts?.[0]?.d30Pct ?? "N/A"}%`,
    "- MRR: N/A",
    "- Churn: N/A",
    "",
    "## 3) Reliability & Security",
    `- Uptime: ${health?.api?.uptimeSec ?? "N/A"} sec`,
    `- API Error Rate: ${health?.api?.errorRate ?? "N/A"}%`,
    `- p95 Latency: ${health?.api?.p95LatencyMs ?? "N/A"} ms`,
    `- Security Incidents (recent): ${security?.incidents?.length ?? 0}`,
    `- Auth Failed 15m: ${security?.metrics?.authFailed15m ?? 0}`,
    `- Auth Rate-limited 15m: ${security?.metrics?.authRateLimited15m ?? 0}`,
    "",
    "## 4) Product & Experiments",
    "- Experiment #1: تحسين copy شاشة البداية لرفع Start Click Rate.",
    "- Experiment #2: CTA بعد إضافة الشخص لرفع Path Start.",
    "",
    "## 5) GTM / Growth",
    `- Top Sources: ${(exec?.attribution?.topSources ?? []).map((x) => `${x.key}:${x.count}`).join(", ") || "N/A"}`,
    "- CAC by channel: pending",
    `- Reliability Alerts: ${(reliability?.alerts ?? []).length ? reliability.alerts.join(" | ") : "None"}`,
    "",
    "## 6) Capital & Runway",
    "- Cash in bank: to be filled",
    "- Monthly burn: to be filled",
    "- Runway (months): to be filled",
    "",
    "## 7) Asks",
    "1. Intro مع advisor growth في mobile habit products.",
    "2. مراجعة pricing experiments للمرحلة القادمة.",
    "3. فتح قنوات توزيع منخفضة CAC.",
    "",
    "## 8) Appendix (sources)",
    "- owner-ops",
    "- ops-insights",
    "- executive-report",
    "- security-signals",
    ""
  ];

  return `${lines.join("\n")}\n`;
}

async function main() {
  const baseUrl = required("INVESTOR_MEMO_BASE_URL");
  const bearer = required("INVESTOR_MEMO_BEARER_TOKEN");

  const [ownerOps, opsInsights, executiveReport] = await Promise.all([
    fetchAdmin(baseUrl, bearer, "owner-ops"),
    fetchAdmin(baseUrl, bearer, "ops-insights"),
    fetchAdmin(baseUrl, bearer, "executive-report")
  ]);

  const memo = buildMemo({ ownerOps, opsInsights, executiveReport });
  const outPath = path.resolve(env("INVESTOR_MEMO_OUTPUT", "docs/investor-weekly-memo-latest.md"));
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, memo, "utf8");
  console.log(`Generated ${outPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

