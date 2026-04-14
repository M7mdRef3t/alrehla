import { getAdminSupabase, verifyAdmin } from "./_shared";
import type { AdminRequest, AdminResponse } from "./_shared";

export async function handleSessionEvents(req: AdminRequest, res: AdminResponse) {
  if (!(await verifyAdmin(req, res))) return;
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const sessionId = String(req.query?.sessionId ?? "").trim();
  if (!sessionId) {
    res.status(400).json({ error: "Missing sessionId" });
    return;
  }
  
  const limit = Number(req.query?.limit);
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 1000) : 200;

  const client = getAdminSupabase();
  if (!client) {
    res.status(503).json({ error: "Supabase not configured" });
    return;
  }

  const { data, error } = await client
    .from("routing_events")
    .select("id,session_id,event_type,payload,occurred_at")
    .eq("session_id", sessionId)
    .order("occurred_at", { ascending: false })
    .limit(safeLimit);

  if (error || !data) {
    // Return empty array instead of 404 to gracefully handle no-events scenarios
    res.status(200).json({ events: [] });
    return;
  }

  res.status(200).json({
    events: data.map((row: any) => ({
      id: String(row.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
      sessionId: String(row.session_id ?? sessionId),
      type: String(row.event_type ?? "unknown"),
      payload: row.payload ?? null,
      createdAt: row.occurred_at ? new Date(String(row.occurred_at)).getTime() : null
    }))
  });
}
