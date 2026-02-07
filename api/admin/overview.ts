import { getAdminSupabase, parseJsonBody, verifyAdmin } from "./_shared";

type UserStateImportRow = {
  device_token?: string;
  owner_id?: string | null;
  data?: Record<string, unknown>;
  updated_at?: string;
};

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function safeLimit(raw: unknown, fallback: number, max = 5000): number {
  const value = Number(raw);
  if (Number.isNaN(value) || value <= 0) return fallback;
  return Math.min(value, max);
}

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

async function handleOverview(client: any, res: any) {
  const now = new Date();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count: usersCount }, { count: activeCount }, { data: events }, { count: aiLogsCount }] =
    await Promise.all([
      client.from("profiles").select("id", { count: "exact", head: true }),
      client.from("journey_events").select("id", { count: "exact", head: true }).gte("created_at", fiveMinAgo),
      client
        .from("journey_events")
        .select("type,payload,created_at")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: true })
        .limit(1000),
      client.from("admin_ai_logs").select("id", { count: "exact", head: true })
    ]);

  if (!events) {
    res.status(200).json({
      totalUsers: usersCount ?? null,
      activeNow: activeCount ?? null,
      avgMood: null,
      aiTokensUsed: aiLogsCount ?? null,
      growthData: [],
      zones: []
    });
    return;
  }

  const growthMap = new Map<string, { paths: number; nodes: number }>();
  const zoneMap = new Map<string, number>();
  let moodSum = 0;
  let moodCount = 0;

  for (const row of events as Array<Record<string, unknown>>) {
    const createdAt = String(row.created_at ?? "");
    const date = createdAt ? createdAt.slice(5, 10) : "--";
    if (!growthMap.has(date)) growthMap.set(date, { paths: 0, nodes: 0 });
    const bucket = growthMap.get(date)!;
    const type = String(row.type ?? "");
    const payload = row.payload as Record<string, unknown> | null;
    if (type === "path_started") bucket.paths += 1;
    if (type === "node_added") bucket.nodes += 1;
    if (payload?.moodScore != null) {
      moodSum += Number(payload.moodScore);
      moodCount += 1;
    }
    if (payload?.zone) {
      const zone = String(payload.zone);
      zoneMap.set(zone, (zoneMap.get(zone) ?? 0) + 1);
    }
  }

  const growthData = Array.from(growthMap.entries()).map(([date, value]) => ({
    date,
    paths: value.paths,
    nodes: value.nodes
  }));
  const zones = Array.from(zoneMap.entries()).map(([label, count]) => ({ label, count }));

  res.status(200).json({
    totalUsers: usersCount ?? null,
    activeNow: activeCount ?? null,
    avgMood: moodCount ? Math.round((moodSum / moodCount) * 10) / 10 : null,
    aiTokensUsed: aiLogsCount ?? null,
    growthData,
    zones
  });
}

async function handleDailyReport(client: any, req: any, res: any) {
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

  for (const row of (events ?? []) as Array<Record<string, unknown>>) {
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

  if (String(req.query?.store ?? "") === "1") {
    await client.from("admin_reports").insert({
      kind: "daily",
      payload: report
    });
  }

  res.status(200).json(report);
}

async function handleWeeklyReport(client: any, req: any, res: any) {
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

  if (String(req.query?.store ?? "") === "1") {
    await client.from("admin_reports").insert({
      kind: "weekly",
      payload: report
    });
  }

  res.status(200).json(report);
}

async function handleFullExport(client: any, req: any, res: any) {
  const limit = safeLimit(req.query?.limit, 2000, 10000);
  const [{ data: profiles }, { data: userStates }, { data: maps }, { data: events }, { data: pulseLogs }] =
    await Promise.all([
      client.from("profiles").select("id, full_name, email, role, created_at, last_seen").limit(1000),
      client.from("user_state").select("device_token, owner_id, updated_at, data").limit(1000),
      client.from("journey_maps").select("session_id, updated_at, nodes").limit(1000),
      client.from("journey_events").select("id, session_id, type, payload, created_at").limit(limit),
      client.from("daily_pulse_logs").select("id, session_id, energy, mood, focus, auto, created_at").limit(1000)
    ]);

  res.status(200).json({
    exportedAt: new Date().toISOString(),
    profiles: profiles ?? [],
    user_state: userStates ?? [],
    journey_maps: maps ?? [],
    journey_events: events ?? [],
    daily_pulse_logs: pulseLogs ?? []
  });
}

async function handleUserState(client: any, req: any, res: any) {
  const deviceToken = String(req.query?.deviceToken ?? "");
  const ownerId = String(req.query?.ownerId ?? "");
  const limit = safeLimit(req.query?.limit, 50, 500);

  if (deviceToken || ownerId) {
    const query = client
      .from("user_state")
      .select("device_token, owner_id, data, updated_at")
      .limit(1);
    const { data, error } = deviceToken
      ? await query.eq("device_token", deviceToken).maybeSingle()
      : await query.eq("owner_id", ownerId).maybeSingle();
    if (error || !data) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.status(200).json({
      deviceToken: data.device_token,
      ownerId: data.owner_id,
      updatedAt: data.updated_at,
      data: data.data ?? {}
    });
    return;
  }

  const { data, error } = await client
    .from("user_state")
    .select("device_token, owner_id, updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    res.status(500).json({ error: "Failed to fetch user state" });
    return;
  }

  res.status(200).json({ rows: data });
}

async function handleUserStateExport(client: any, req: any, res: any) {
  const limit = safeLimit(req.query?.limit, 200, 2000);
  const { data, error } = await client
    .from("user_state")
    .select("device_token, owner_id, data, updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    res.status(500).json({ error: "Failed to export user state" });
    return;
  }

  res.status(200).json({
    exportedAt: new Date().toISOString(),
    count: data.length,
    rows: data
  });
}

async function handleUserStateImport(client: any, req: any, res: any) {
  const body = await parseJsonBody(req);
  const rows: UserStateImportRow[] = Array.isArray(body?.rows)
    ? (body.rows as UserStateImportRow[])
    : Array.isArray(body)
      ? (body as UserStateImportRow[])
      : [];
  if (rows.length === 0) {
    res.status(400).json({ error: "No rows provided" });
    return;
  }

  const payload = rows
    .filter((row) => row && typeof row === "object" && row.device_token && row.data)
    .map((row) => ({
      device_token: row.device_token,
      owner_id: row.owner_id ?? null,
      data: row.data,
      updated_at: row.updated_at ?? new Date().toISOString()
    }));

  if (payload.length === 0) {
    res.status(400).json({ error: "Invalid rows" });
    return;
  }

  const { error } = await client.from("user_state").upsert(payload, { onConflict: "device_token" });
  if (error) {
    res.status(500).json({ error: "Failed to import user state" });
    return;
  }

  res.status(200).json({ ok: true, count: payload.length });
}

async function handleCronReport(req: any, res: any) {
  if (!verifyCron(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const period = String(req.query?.period ?? "daily");
  const reportKind = period === "weekly" ? "weekly-report" : "daily-report";
  const endpoint = `/api/admin/overview?kind=${reportKind}&store=1`;

  const baseUrl = process.env.PUBLIC_APP_URL || process.env.VERCEL_URL || "";
  const host = req.headers?.host;
  const proto = req.headers?.["x-forwarded-proto"] || "https";
  const derived = host ? `${proto}://${host}` : "";
  const normalized = baseUrl
    ? (baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`)
    : derived;

  if (!normalized) {
    res.status(500).json({ error: "PUBLIC_APP_URL not set" });
    return;
  }
  if (!process.env.ADMIN_API_SECRET) {
    res.status(500).json({ error: "ADMIN_API_SECRET not set" });
    return;
  }

  const reportRes = await fetch(`${normalized}${endpoint}`, {
    headers: {
      "x-admin-code": process.env.ADMIN_API_SECRET
    }
  });
  if (!reportRes.ok) {
    res.status(500).json({ error: "Failed to generate report" });
    return;
  }
  const report = await reportRes.json();

  const title = period === "weekly" ? "Weekly Report - Al-Rehla" : "Daily Report - Al-Rehla";
  const summary = period === "weekly"
    ? `From ${report.from} to ${report.to}\nTotal events: ${report.totalEvents}\nUnique sessions: ${report.uniqueSessions}`
    : `Date: ${report.date}\nTotal events: ${report.totalEvents}\nUnique sessions: ${report.uniqueSessions}`;

  await sendSlack(`${title}\n${summary}`);
  await sendResend(title, `<pre style="font-family: monospace">${summary}</pre>`);

  res.status(200).json({ ok: true, period });
}

export default async function handler(req: any, res: any) {
  const method = String(req.method ?? "GET").toUpperCase();
  const kind = String(req.query?.kind ?? "overview");

  if (kind === "cron-report") {
    if (method !== "GET") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    await handleCronReport(req, res);
    return;
  }

  if (!(await verifyAdmin(req, res))) return;

  const client = getAdminSupabase();
  if (!client) {
    res.status(503).json({ error: "Supabase not configured" });
    return;
  }

  if (method === "GET") {
    if (kind === "overview") return handleOverview(client, res);
    if (kind === "daily-report") return handleDailyReport(client, req, res);
    if (kind === "weekly-report") return handleWeeklyReport(client, req, res);
    if (kind === "full-export") return handleFullExport(client, req, res);
    if (kind === "user-state") return handleUserState(client, req, res);
    if (kind === "user-state-export") return handleUserStateExport(client, req, res);
    res.status(400).json({ error: `Unsupported kind for GET: ${kind}` });
    return;
  }

  if (method === "POST") {
    if (kind === "user-state-import") return handleUserStateImport(client, req, res);
    res.status(400).json({ error: `Unsupported kind for POST: ${kind}` });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
