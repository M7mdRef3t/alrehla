import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminSecret = process.env.ADMIN_API_SECRET || "alrehla-admin";

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

function getAllowedRolesSet(raw?: string): Set<string> {
  const value = raw || process.env.ADMIN_ALLOWED_ROLES || "admin,owner,superadmin,developer";
  return new Set(
    value
      .split(",")
      .map((r) => r.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function verifyAdminWithRoles(req: any, res: any, allowedRoles: string[]): Promise<boolean> {
  if (!(await verifyAdmin(req, res))) return false;
  const code = getRequestAdminCode(req);
  const secret = getAdminSecret();
  // Secret-based access remains privileged for automation.
  if (secret && code && code === secret) return true;

  const client = getAdminSupabase();
  const bearer = getBearerToken(req);
  if (!client || !bearer) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  const { data, error } = await client.auth.getUser(bearer);
  if (error || !data?.user?.id) {
    res.status(403).json({ error: "Forbidden" });
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
  const allowed = getAllowedRolesSet(allowedRoles.join(","));
  if (!allowed.has(String(profile.role).trim().toLowerCase())) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

export async function recordAdminAudit(
  req: any,
  action: string,
  payload?: Record<string, unknown>
): Promise<void> {
  try {
    const client = getAdminSupabase();
    if (!client) return;
    const code = getRequestAdminCode(req);
    const secret = getAdminSecret();
    let actorId: string | null = null;
    let actorRole: string | null = null;
    if (!(secret && code && code === secret)) {
      const bearer = getBearerToken(req);
      if (bearer) {
        const { data } = await client.auth.getUser(bearer);
        actorId = data?.user?.id ?? null;
        if (actorId) {
          const { data: profile } = await client.from("profiles").select("role").eq("id", actorId).maybeSingle();
          actorRole = typeof profile?.role === "string" ? profile.role : null;
        }
      }
    }
    await client.from("admin_audit_logs").insert({
      action,
      actor_id: actorId,
      actor_role: actorRole,
      payload: payload ?? {},
      created_at: new Date().toISOString()
    });
  } catch {
    // best-effort audit logging only
  }
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
