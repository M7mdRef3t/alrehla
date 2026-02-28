import { sendEmail } from '../lib/email';
import { getAdminSupabase } from "./_shared";

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
  const to = process.env.REPORT_EMAIL_TO;
  if (!to) return;
  await sendEmail(to, subject, html);
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
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
  const now = new Date();
  let report: any = null;

  if (period === "weekly") {
    const end = new Date(now);
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const { data: events, error } = await client
      .from("journey_events")
      .select("session_id,type,created_at")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .limit(5000);
    if (error) {
      res.status(500).json({ error: "Failed to generate report" });
      return;
    }
    const byDay = new Map<string, number>();
    const bySession = new Map<string, number>();
    const typeCounts: Record<string, number> = {};
    let totalEvents = 0;
    for (const row of (events ?? []) as Array<Record<string, unknown>>) {
      const createdAt = new Date(String(row.created_at ?? now));
      const day = toDateOnly(createdAt);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
      const sessionId = String(row.session_id ?? "anonymous");
      bySession.set(sessionId, (bySession.get(sessionId) ?? 0) + 1);
      const type = String(row.type ?? "");
      typeCounts[type] = (typeCounts[type] ?? 0) + 1;
      totalEvents += 1;
    }
    report = {
      from: toDateOnly(start),
      to: toDateOnly(end),
      totalEvents,
      uniqueSessions: bySession.size,
      typeCounts,
      dailySeries: Array.from(byDay.entries()).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date))
    };
    await client.from("admin_reports").insert({ kind: "weekly", payload: report });
  } else {
    const start = new Date(now);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const { data: events, error } = await client
      .from("journey_events")
      .select("session_id,type,created_at")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .limit(2000);
    if (error) {
      res.status(500).json({ error: "Failed to generate report" });
      return;
    }
    const bySession = new Map<string, number>();
    const typeCounts: Record<string, number> = {};
    let totalEvents = 0;
    for (const row of (events ?? []) as Array<Record<string, unknown>>) {
      const sessionId = String(row.session_id ?? "anonymous");
      bySession.set(sessionId, (bySession.get(sessionId) ?? 0) + 1);
      const type = String(row.type ?? "");
      typeCounts[type] = (typeCounts[type] ?? 0) + 1;
      totalEvents += 1;
    }
    report = {
      date: toDateOnly(start),
      totalEvents,
      uniqueSessions: bySession.size,
      typeCounts
    };
    await client.from("admin_reports").insert({ kind: "daily", payload: report });
  }

  const title = period === "weekly" ? "تقرير الأسبوع - الرحلة" : "تقرير اليوم - الرحلة";
  const summary = period === "weekly"
    ? `من ${report.from} إلى ${report.to}\nإجمالي الأحداث: ${report.totalEvents}\nجلسات فريدة: ${report.uniqueSessions}`
    : `تاريخ: ${report.date}\nإجمالي الأحداث: ${report.totalEvents}\nجلسات فريدة: ${report.uniqueSessions}`;

  await sendSlack(`${title}\n${summary}`);
  await sendResend(title, `<pre style="font-family: monospace">${summary}</pre>`);

  res.status(200).json({ ok: true, period });
}
