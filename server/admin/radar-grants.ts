import { createClient } from "@supabase/supabase-js";
import { verifyAdminWithRoles, parseJsonBody, getAdminSupabase } from "./_shared";
import type { AdminRequest, AdminResponse } from "./_shared";

function getBearerToken(req: AdminRequest): string | null {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (typeof authHeader !== "string") return null;
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null;
  return authHeader.slice(7).trim() || null;
}

function getRpcClientWithUserJwt(jwt: string) {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";

  if (!supabaseUrl || !anonKey) return null;

  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } }
  });
}

export async function handleRadarGrants(req: AdminRequest, res: AdminResponse) {
  if (!(await verifyAdminWithRoles(req, res, ["admin", "owner", "superadmin", "super_admin"]))) return;

  const adminClient = getAdminSupabase();
  if (!adminClient) {
    res.status(503).json({ error: "Admin API not configured" });
    return;
  }

  const body = await parseJsonBody(req);
  const userId = String(body?.userId || "").trim();
  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  const { data, error } = await adminClient.rpc("grant_premium_access", {
    user_id_input: userId
  });

  if (error) {
    res.status(500).json({ error: "Failed to grant premium access", details: error.message });
    return;
  }

  res.status(200).json({ success: Boolean(data), userId });
}




