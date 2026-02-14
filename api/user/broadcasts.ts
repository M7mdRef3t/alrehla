import { getServiceSupabase } from "./_shared.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const client = getServiceSupabase();
  if (!client) {
    res.status(503).json({ error: "Supabase not configured" });
    return;
  }

  const { data, error } = await client
    .from("admin_broadcasts")
    .select("id,title,body,created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error || !data) {
    res.status(500).json({ error: "Failed to fetch broadcasts" });
    return;
  }

  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ broadcasts: data });
}

