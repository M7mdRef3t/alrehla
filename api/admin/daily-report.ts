import { getAdminSupabase, verifyAdmin } from "./_shared";

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default async function handler(req: any, res: any) {
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

  const dateParam = String(req.query?.date ?? "");
  const baseDate = dateParam ? new Date(`${dateParam}T00:00:00Z`) : new Date();
  const start = new Date(baseDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  const { data: events, error } = await client
    .from("journey_events")
    .select("session_id,type,created_at,payload")
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString())
    .limit(2000);

  if (error) {
    res.status(500).json({ error: "Failed to fetch events" });
    return;
  }

  const bySession = new Map<string, { total: number; paths: number; tasks: number; nodes: number; moods: number }>();
  const typeCounts: Record<string, number> = {};
  let totalEvents = 0;

  for (const row of events ?? []) {
    const sessionId = String(row.session_id ?? "anonymous");
    const entry = bySession.get(sessionId) ?? { total: 0, paths: 0, tasks: 0, nodes: 0, moods: 0 };
    entry.total += 1;
    totalEvents += 1;
    const type = String(row.type ?? "");
    typeCounts[type] = (typeCounts[type] ?? 0) + 1;
    if (type === "path_started") entry.paths += 1;
    if (type === "task_completed") entry.tasks += 1;
    if (type === "node_added") entry.nodes += 1;
    if (type === "mood_logged") entry.moods += 1;
    bySession.set(sessionId, entry);
  }

  const topSessions = Array.from(bySession.entries())
    .map(([sessionId, stats]) => ({ sessionId, ...stats }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const report = {
    date: toDateOnly(start),
    totalEvents,
    uniqueSessions: bySession.size,
    typeCounts,
    topSessions
  };

  const store = String(req.query?.store ?? "");
  if (store === "1") {
    await client.from("admin_reports").insert({
      kind: "daily",
      payload: report
    });
  }

  res.status(200).json(report);
}
