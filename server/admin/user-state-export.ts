import { getAdminSupabase, verifyAdmin } from "./_shared";

export async function handleUserStateExportStandalone(req: any, res: any) {
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

  const limit = Number(req.query?.limit ?? 200);
  const { data, error } = await client
    .from("user_state")
    .select("device_token, owner_id, data, updated_at")
    .order("updated_at", { ascending: false })
    .limit(Number.isNaN(limit) ? 200 : limit);

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
