import { getAdminSupabase, verifyAdmin, parseJsonBody } from "./_shared";
import type { AdminRequest, AdminResponse } from "./_shared";

export async function handleBroadcasts(req: AdminRequest, res: AdminResponse) {
  if (!(await verifyAdmin(req, res))) return;
  const client = getAdminSupabase();
  if (!client) {
    res.status(503).json({ error: "Supabase not configured" });
    return;
  }

  if (req.method === "GET") {
    const { data, error } = await client
      .from("admin_broadcasts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data) {
      res.status(500).json({ error: "Failed to fetch broadcasts" });
      return;
    }
    res.status(200).json({ broadcasts: data });
    return;
  }

  if (req.method === "POST") {
    const body = await parseJsonBody(req);
    const bodyRecord = body as Record<string, unknown>;
    const broadcast = ((bodyRecord?.broadcast as Record<string, unknown> | undefined) ?? bodyRecord) as Record<string, unknown>;
    const { error } = await client.from("admin_broadcasts").insert({
      id: broadcast["id"],
      title: broadcast["title"],
      body: broadcast["body"],
      created_at: broadcast["created_at"] || broadcast["createdAt"] || new Date().toISOString()
    });
    if (error) {
      res.status(500).json({ error: "Failed to save broadcast" });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method === "DELETE") {
    const id = req.query?.id || (await parseJsonBody(req))?.id;
    if (!id) {
      res.status(400).json({ error: "Missing id" });
      return;
    }
    const { error } = await client.from("admin_broadcasts").delete().eq("id", id);
    if (error) {
      res.status(500).json({ error: "Failed to delete broadcast" });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}




