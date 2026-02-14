import { getAdminSupabase, verifyAdminWithRoles, parseJsonBody, recordAdminAudit } from "./_shared.js";

export async function handleRoles(req: any, res: any) {
  if (!(await verifyAdminWithRoles(req, res, ["owner", "superadmin"]))) return;
  const client = getAdminSupabase();
  if (!client) {
    res.status(503).json({ error: "Supabase not configured" });
    return;
  }

  if (req.method === "POST") {
    const body = await parseJsonBody(req);
    const id = String(body?.id ?? "");
    const role = String(body?.role ?? "");
    if (!id || !role) {
      res.status(400).json({ error: "Missing id or role" });
      return;
    }
    const { error } = await client.from("profiles").update({ role }).eq("id", id);
    if (error) {
      res.status(500).json({ error: "Failed to update role" });
      return;
    }
    await recordAdminAudit(req, "role_updated", { targetUserId: id, role });
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
