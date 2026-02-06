import { getAdminSupabase, verifyAdmin } from "./_shared";

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

  const deviceToken = String(req.query?.deviceToken ?? "");
  const ownerId = String(req.query?.ownerId ?? "");
  const limit = Number(req.query?.limit ?? 50);

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
    .limit(Number.isNaN(limit) ? 50 : limit);

  if (error || !data) {
    res.status(500).json({ error: "Failed to fetch user state" });
    return;
  }

  res.status(200).json({ rows: data });
}
