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

  const limit = Number(req.query?.limit ?? 200);
  const { data, error } = await client
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .order("created_at", { ascending: false })
    .limit(Number.isNaN(limit) ? 200 : limit);

  if (error || !data) {
    res.status(500).json({ error: "Failed to fetch users" });
    return;
  }

  res.status(200).json({ users: data });
}
