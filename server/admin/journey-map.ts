import { getAdminSupabase, verifyAdmin } from "./_shared";
import type { AdminRequest, AdminResponse } from "./_shared";

export async function handleJourneyMap(req: AdminRequest, res: AdminResponse) {
  if (!(await verifyAdmin(req, res))) return;
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const sessionId = String(req.query?.sessionId ?? "");
  if (!sessionId) {
    res.status(400).json({ error: "Missing sessionId" });
    return;
  }
  const client = getAdminSupabase();
  if (!client) {
    res.status(503).json({ error: "Supabase not configured" });
    return;
  }
  const { data, error } = await client
    .from("journey_maps")
    .select("session_id,nodes,updated_at")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (error || !data) {
    res.status(200).json({
      sessionId: sessionId,
      nodes: [],
      updatedAt: null
    });
    return;
  }
  res.status(200).json({
    sessionId: data.session_id,
    nodes: data.nodes ?? [],
    updatedAt: data.updated_at
  });
}



