import { createClient } from "@supabase/supabase-js";
import { getAdminSupabase, verifyAdmin } from "./_shared";
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

export async function handleRadar(req: AdminRequest, res: AdminResponse) {
  if (!(await verifyAdmin(req, res))) return;

  const adminClient = getAdminSupabase();
  if (!adminClient) {
    res.status(503).json({ error: "Admin API not configured" });
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const bearer = getBearerToken(req);
  if (!bearer) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const rpcClient = getRpcClientWithUserJwt(bearer);
  if (!rpcClient) {
    res.status(503).json({ error: "Supabase RPC client not configured" });
    return;
  }

  const { data, error } = await rpcClient.rpc("get_global_awareness_pulse");
  if (error) {
    res.status(500).json({
      error: "Failed to fetch awareness pulse",
      source: "query_failed",
      is_live: false
    });
    return;
  }

  if (!data) {
    res.status(200).json({
      pulse: null,
      source: "no_data",
      is_live: false
    });
    return;
  }

  res.status(200).json({
    pulse: data,
    source: "supabase",
    is_live: true
  });
}



