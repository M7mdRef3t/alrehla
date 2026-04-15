import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let cachedClient: SupabaseClient | null = null;

export type AdminRequest = {
  method?: string;
  url?: string;
  query?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  body?: unknown;
};

export type AdminResponse = {
  status: (code: number) => AdminResponse;
  json: (data: unknown) => AdminResponse;
};

export function getAdminSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !serviceRoleKey) return null;
  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return cachedClient;
}

function getAllowedRoles(): string[] {
  const raw = process.env.ADMIN_ALLOWED_ROLES || "admin,owner,superadmin,developer";
  return raw.split(",").map((r) => r.trim()).filter(Boolean);
}

function getBearerToken(req: AdminRequest): string | null {
  const auth = req.headers?.authorization || req.headers?.Authorization;
  if (typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return null;
}

function isAdminSecretToken(token: string | null): boolean {
  if (!token) return false;
  const allowedSecrets = [process.env.CRON_SECRET, process.env.ADMIN_API_SECRET]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => value.trim());
  return allowedSecrets.includes(token);
}

export async function verifyAdmin(req: AdminRequest, res: AdminResponse): Promise<boolean> {
  const client = getAdminSupabase();
  if (!client) {
    console.warn("[verifyAdmin] Admin API not configured (client is null). SUPABASE_SERVICE_ROLE_KEY missing?");
    res.status(503).json({ error: "Admin API not configured" });
    return false;
  }

  const bearer = getBearerToken(req);
  if (!bearer) {
    console.error("[verifyAdmin] No bearer token provided:", req.headers);
    res.status(401).json({ error: "Unauthorized: Missing Token" });
    return false;
  }

  if (isAdminSecretToken(bearer)) {
    return true;
  }

  const { data, error } = await client.auth.getUser(bearer);
  if (error || !data?.user?.id) {
    console.error("[verifyAdmin] Failed to getUser from token:", error?.message || "Missing user ID", "Token start:", bearer.slice(0, 10));
    res.status(401).json({ error: "Unauthorized: Invalid Token" });
    return false;
  }

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || !profile?.role) {
    console.error(`[verifyAdmin] Forbidden: User ${data.user.id} has no valid role or profile error`, profileError);
    res.status(403).json({ error: "Forbidden: No valid role" });
    return false;
  }

  const allowed = getAllowedRoles();
  if (!allowed.includes(String(profile.role))) {
    console.error(`[verifyAdmin] Forbidden: User ${data.user.id} has role '${profile.role}' which is not in allowed types: ${allowed.join(", ")}`);
    res.status(403).json({ error: "Forbidden: Not allowed" });
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

export async function verifyAdminWithRoles(req: AdminRequest, res: AdminResponse, allowedRoles: string[]): Promise<boolean> {
  if (!(await verifyAdmin(req, res))) return false;
  const client = getAdminSupabase();
  const bearer = getBearerToken(req);
  if (!client || !bearer) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  if (isAdminSecretToken(bearer)) return true;
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
  req: AdminRequest,
  action: string,
  payload?: Record<string, unknown>
): Promise<void> {
  try {
    const client = getAdminSupabase();
    if (!client) return;
    let actorId: string | null = null;
    let actorRole: string | null = null;
    const bearer = getBearerToken(req);
    if (bearer) {
      const { data } = await client.auth.getUser(bearer);
      actorId = data?.user?.id ?? null;
      if (actorId) {
        const { data: profile } = await client.from("profiles").select("role").eq("id", actorId).maybeSingle();
        actorRole = typeof profile?.role === "string" ? profile.role : null;
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

export async function parseJsonBody(req: AdminRequest): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === "object") return req.body as Record<string, unknown>;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

