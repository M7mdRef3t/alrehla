import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminSecret = process.env.ADMIN_API_SECRET || "";

let cachedClient: SupabaseClient | null = null;

export function getAdminSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !serviceRoleKey) return null;
  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return cachedClient;
}

export function getAdminSecret(): string | null {
  return adminSecret ? adminSecret : null;
}

function getAllowedRoles(): string[] {
  const raw = process.env.ADMIN_ALLOWED_ROLES || "admin,owner,superadmin,developer";
  return raw.split(",").map((r) => r.trim()).filter(Boolean);
}

export function getRequestAdminCode(req: any): string | null {
  const headerCode = req.headers?.["x-admin-code"] || req.headers?.["X-Admin-Code"];
  if (typeof headerCode === "string" && headerCode.trim()) return headerCode.trim();
  return null;
}

function getBearerToken(req: any): string | null {
  const auth = req.headers?.authorization || req.headers?.Authorization;
  if (typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return null;
}

export async function verifyAdmin(req: any, res: any): Promise<boolean> {
  const secret = getAdminSecret();
  const code = getRequestAdminCode(req);
  if (secret && code && code === secret) return true;

  const client = getAdminSupabase();
  if (!client) {
    res.status(503).json({ error: "Admin API not configured" });
    return false;
  }

  const bearer = getBearerToken(req);
  if (!bearer) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }

  const { data, error } = await client.auth.getUser(bearer);
  if (error || !data?.user?.id) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || !profile?.role) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }

  const allowed = getAllowedRoles();
  if (!allowed.includes(String(profile.role))) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }

  return true;
}

export async function parseJsonBody(req: any): Promise<any> {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}
