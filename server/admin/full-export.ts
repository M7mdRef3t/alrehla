import { getAdminSupabase, verifyAdmin } from "./_shared";

export async function handleFullExportStandalone(req: any, res: any) {
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

  const limit = Number(req.query?.limit ?? 2000);
  const limitSafe = Number.isNaN(limit) ? 2000 : limit;

  const [
    { data: profiles },
    { data: userStates },
    { data: maps },
    { data: events },
    { data: pulseLogs }
  ] = await Promise.all([
    client.from("profiles").select("id, full_name, email, role, created_at, last_seen").limit(1000),
    client.from("user_state").select("device_token, owner_id, updated_at, data").limit(1000),
    client.from("journey_maps").select("session_id, updated_at, nodes").limit(1000),
    client.from("journey_events").select("id, session_id, type, payload, created_at").limit(limitSafe),
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
