import { getAdminSupabase, verifyAdmin, parseJsonBody } from "./_shared";

export async function handleContent(req: any, res: any) {
  if (!(await verifyAdmin(req, res))) return;
  const client = getAdminSupabase();
  if (!client) {
    res.status(503).json({ error: "Supabase not configured" });
    return;
  }

  if (req.method === "GET") {
    const page = typeof req.query?.page === "string" ? req.query.page.trim() : "";
    const key = typeof req.query?.key === "string" ? req.query.key.trim() : "";
    const limitRaw = Number(req.query?.limit);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.floor(limitRaw), 500) : 300;

    let query = client
      .from("app_content")
      .select("key,content,page,updated_at")
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (page) {
      query = query.eq("page", page);
    }
    if (key) {
      query = query.ilike("key", `%${key}%`);
    }

    const { data, error } = await query;
    if (error || !data) {
      res.status(500).json({ error: "Failed to fetch app content" });
      return;
    }
    res.status(200).json({ entries: data });
    return;
  }

  if (req.method === "POST") {
    const body = await parseJsonBody(req);
    const entry = body?.entry ?? body;
    const normalizedKey = String(entry?.key ?? "").trim();
    if (!normalizedKey) {
      res.status(400).json({ error: "Missing key" });
      return;
    }

    const payload = {
      key: normalizedKey,
      content: String(entry?.content ?? ""),
      page: entry?.page ? String(entry.page) : null
    };

    const { error } = await client.from("app_content").upsert(payload, { onConflict: "key" });
    if (error) {
      res.status(500).json({ error: "Failed to save app content" });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method === "DELETE") {
    const id = req.query?.key || (await parseJsonBody(req))?.key;
    const normalizedKey = String(id ?? "").trim();
    if (!normalizedKey) {
      res.status(400).json({ error: "Missing key" });
      return;
    }
    const { error } = await client.from("app_content").delete().eq("key", normalizedKey);
    if (error) {
      res.status(500).json({ error: "Failed to delete app content" });
      return;
    }
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
