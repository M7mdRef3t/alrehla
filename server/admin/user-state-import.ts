import { getAdminSupabase, verifyAdmin, parseJsonBody } from "./_shared.js";

type UserStateImportRow = {
  device_token?: string;
  owner_id?: string | null;
  data?: Record<string, unknown>;
  updated_at?: string;
};

export async function handleUserStateImportStandalone(req: any, res: any) {
  if (!(await verifyAdmin(req, res))) return;
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  const client = getAdminSupabase();
  if (!client) {
    res.status(503).json({ error: "Supabase not configured" });
    return;
  }

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
