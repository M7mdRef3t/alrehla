import { getAdminSupabase, verifyAdmin } from "./_shared.js";

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function handleWeeklyReportStandalone(req: any, res: any) {
  if (!(await verifyAdmin(req, res))) return;
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const client = getAdminSupabase();
  if (!client) {
    res.status(503).json({ error: "Supabase not configured" });
    return;
  }

  const now = new Date();
  const end = new Date(now);
  const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const { data: events, error } = await client
    .from("journey_events")
    .select("session_id,type,created_at,payload")
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString())
    .limit(5000);

  if (error) {
    res.status(500).json({ error: "Failed to fetch events" });
    return;
  }

  const byDay = new Map<string, number>();
  const bySession = new Map<string, number>();
  const typeCounts: Record<string, number> = {};
  let totalEvents = 0;

  for (const row of events ?? []) {
    const createdAt = new Date(String(row.created_at ?? now));
    const day = toDateOnly(createdAt);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
    const sessionId = String(row.session_id ?? "anonymous");
    bySession.set(sessionId, (bySession.get(sessionId) ?? 0) + 1);
    const type = String(row.type ?? "");
    typeCounts[type] = (typeCounts[type] ?? 0) + 1;
    totalEvents += 1;
  }

  const topSessions = Array.from(bySession.entries())
    .map(([sessionId, total]) => ({ sessionId, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const dailySeries = Array.from(byDay.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const report = {
    from: toDateOnly(start),
    to: toDateOnly(end),
    totalEvents,
    uniqueSessions: bySession.size,
    typeCounts,
    dailySeries,
    topSessions
  };

  const store = String(req.query?.store ?? "");
  if (store === "1") {
    await client.from("admin_reports").insert({
      kind: "weekly",
      payload: report
    });
  }

  res.status(200).json(report);
}
