import { getAdminSupabase } from "./_shared.js";

function verifyCron(req: any): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const token = req.query?.secret || req.headers?.["x-cron-secret"];
  return token === secret;
}

async function sendSlack(message: string): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message })
  });
}

async function sendResend(subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.REPORT_EMAIL_TO;
  const from = process.env.REPORT_EMAIL_FROM;
  if (!apiKey || !to || !from) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html
    })
  });
}

export async function handleCronReportStandalone(req: any, res: any) {
  if (!verifyCron(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const client = getAdminSupabase();
  if (!client) {
    res.status(503).json({ error: "Supabase not configured" });
    return;
  }

  const period = String(req.query?.period ?? "daily");
  const endpoint = period === "weekly" ? "/api/admin/weekly-report?store=1" : "/api/admin/daily-report?store=1";

  const baseUrl = process.env.PUBLIC_APP_URL || process.env.VERCEL_URL || "";
  const host = req.headers?.host;
  const proto = req.headers?.["x-forwarded-proto"] || "https";
  const derived = host ? `${proto}://${host}` : "";
  const normalized = baseUrl
    ? (baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`)
    : derived;
  const url = normalized ? `${normalized}${endpoint}` : endpoint;

  if (!normalized) {
    res.status(500).json({ error: "PUBLIC_APP_URL not set" });
    return;
  }

  if (!process.env.ADMIN_API_SECRET) {
    res.status(500).json({ error: "ADMIN_API_SECRET not set" });
    return;
  }

  const reportRes = await fetch(url, {
    headers: {
      "x-admin-code": process.env.ADMIN_API_SECRET || ""
    }
  });
  if (!reportRes.ok) {
    res.status(500).json({ error: "Failed to generate report" });
    return;
  }
  const report = await reportRes.json();

  const title = period === "weekly" ? "تقرير الأسبوع - الرحلة" : "تقرير اليوم - الرحلة";
  const summary = period === "weekly"
    ? `من ${report.from} إلى ${report.to}\nإجمالي الأحداث: ${report.totalEvents}\nجلسات فريدة: ${report.uniqueSessions}`
    : `تاريخ: ${report.date}\nإجمالي الأحداث: ${report.totalEvents}\nجلسات فريدة: ${report.uniqueSessions}`;

  await sendSlack(`${title}\n${summary}`);
  await sendResend(title, `<pre style="font-family: monospace">${summary}</pre>`);

  res.status(200).json({ ok: true, period });
}
