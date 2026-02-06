import { getAdminSupabase, verifyAdmin, parseJsonBody } from "./_shared";

const SETTINGS_TABLE = "system_settings";
const ALLOWED_KEYS = new Set([
  "feature_flags",
  "system_prompt",
  "scoring_weights",
  "scoring_thresholds",
  "pulse_check_mode"
]);

function toSettingMap(rows: Array<{ key: string; value: unknown }>) {
  const map: Record<string, unknown> = {};
  rows.forEach((row) => { map[row.key] = row.value; });
  return map;
}

export default async function handler(req: any, res: any) {
  if (!(await verifyAdmin(req, res))) return;
  const client = getAdminSupabase();
  if (!client) {
    res.status(503).json({ error: "Supabase not configured" });
    return;
  }

  if (req.method === "GET") {
    const keysParam = req.query?.keys;
    const keys = typeof keysParam === "string" && keysParam.trim()
      ? keysParam.split(",").map((k) => k.trim()).filter(Boolean)
      : Array.from(ALLOWED_KEYS);
    const { data, error } = await client
      .from(SETTINGS_TABLE)
      .select("key,value")
      .in("key", keys);
    if (error || !data) {
      res.status(500).json({ error: "Failed to fetch settings" });
      return;
    }
    res.status(200).json({ settings: toSettingMap(data as Array<{ key: string; value: unknown }>) });
    return;
  }

  if (req.method === "POST") {
    const body = await parseJsonBody(req);
    const settings = body?.settings && typeof body.settings === "object"
      ? body.settings
      : body;
    const rows = Object.entries(settings ?? {})
      .filter(([key]) => ALLOWED_KEYS.has(key))
      .map(([key, value]) => ({ key, value }));
    if (rows.length === 0) {
      res.status(400).json({ error: "No valid settings provided" });
      return;
    }
    const { error } = await client.from(SETTINGS_TABLE).upsert(rows, { onConflict: "key" });
    if (error) {
      res.status(500).json({ error: "Failed to save settings" });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
