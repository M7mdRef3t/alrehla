import { getAdminSupabase, verifyAdmin, parseJsonBody } from "./_shared";
import type { AdminRequest, AdminResponse } from "./_shared";

export async function handleMissions(req: AdminRequest, res: AdminResponse) {
  if (!(await verifyAdmin(req, res))) return;
  const client = getAdminSupabase();
  if (!client) {
    res.status(503).json({ error: "Supabase not configured" });
    return;
  }

  if (req.method === "GET") {
    const { data, error } = await client
      .from("admin_missions")
      .select("*")
      .order("created_at", { ascending: false });
    if (error || !data) {
      res.status(500).json({ error: "Failed to fetch missions" });
      return;
    }
    res.status(200).json({ missions: data });
    return;
  }

  if (req.method === "POST") {
    const body = await parseJsonBody(req);
    const bodyRecord = body as Record<string, unknown>;
    const mission = ((bodyRecord?.mission as Record<string, unknown> | undefined) ?? bodyRecord) as Record<string, unknown>;
    const { error } = await client.from("admin_missions").insert({
      id: mission["id"],
      title: mission["title"],
      track: mission["track"],
      difficulty: mission["difficulty"],
      created_at: mission["created_at"] || mission["createdAt"] || new Date().toISOString()
    });
    if (error) {
      res.status(500).json({ error: "Failed to save mission" });
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
    const { error } = await client.from("admin_missions").delete().eq("id", id);
    if (error) {
      res.status(500).json({ error: "Failed to delete mission" });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}



