import { getAdminSupabase, verifyAdmin, parseJsonBody } from "./_shared";
import type { AdminRequest, AdminResponse } from "./_shared";

export async function handleAiLogs(req: AdminRequest, res: AdminResponse) {
  if (!(await verifyAdmin(req, res))) return;
  const client = getAdminSupabase();
  if (!client) {
    res.status(503).json({ error: "Supabase not configured" });
    return;
  }

  if (req.method === "GET") {
    const { data, error } = await client
      .from("admin_ai_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error || !data) {
      res.status(500).json({ error: "Failed to fetch AI logs" });
      return;
    }
    res.status(200).json({ logs: data });
    return;
  }

  if (req.method === "POST") {
    const body = await parseJsonBody(req);
    const bodyRecord = body as Record<string, unknown>;
    if (bodyRecord?.action === "rate" || (bodyRecord?.id && bodyRecord?.rating)) {
      const { error } = await client
        .from("admin_ai_logs")
        .update({ rating: bodyRecord.rating })
        .eq("id", bodyRecord.id);
      if (error) {
        res.status(500).json({ error: "Failed to update rating" });
        return;
      }
      res.status(200).json({ ok: true });
      return;
    }

    const entry = ((bodyRecord?.entry as Record<string, unknown> | undefined) ?? bodyRecord) as Record<string, unknown>;
    const { error } = await client.from("admin_ai_logs").insert({
      id: entry["id"],
      prompt: entry["prompt"],
      response: entry["response"],
      source: entry["source"],
      rating: entry["rating"],
      created_at: entry["created_at"] || entry["createdAt"] || new Date().toISOString()
    });
    if (error) {
      res.status(500).json({ error: "Failed to save AI log" });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}




