import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../app/api/_lib/supabaseAdmin";

/**
 * requireAdmin — guards admin-only API routes.
 *
 * Checks for authorization in:
 *   1. System Secret: Authorization: Bearer <ADMIN_CODE>
 *   2. User Session: Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
 *
 * Returns null if authorized, or a 401/403/500 NextResponse if not.
 */
export async function requireAdmin(req: NextRequest | Request): Promise<NextResponse | null> {
  const adminCode = process.env.ADMIN_CODE;
  const authHeader = req.headers.get("authorization") ?? req.headers.get("x-admin-code") ?? "";
  const providedToken = authHeader.startsWith("Bearer ") 
    ? authHeader.slice(7).trim() 
    : authHeader.trim();

  if (!providedToken) {
    return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
  }

  // 1. Check against System Secret (Server-only fallthrough)
  if (adminCode && providedToken === adminCode) {
    return null; // system-to-system authorized
  }

  // 2. Role-Based Check via Supabase Session
  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    return NextResponse.json({ error: "Server misconfiguration: DB client unavailable" }, { status: 500 });
  }

  const { data: { user }, error: authError } = await adminClient.auth.getUser(providedToken);
  
  if (authError || !user) {
    console.warn("[requireAdmin] Invalid session token attempt");
    return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
  }

  // Check profile role
  const { data: profile, error: dbError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (dbError || !profile) {
    console.warn(`[requireAdmin] User ${user.email} has no profile or DB error`);
    return NextResponse.json({ error: "Forbidden: No profile found" }, { status: 403 });
  }

  const allowedRoles = ["owner", "superadmin", "admin"];
  if (!allowedRoles.includes(profile.role)) {
    console.warn(`[requireAdmin] User ${user.email} with role '${profile.role}' attempted admin access`);
    return NextResponse.json({ error: "Forbidden: Insufficient privileges" }, { status: 403 });
  }

  return null; // authorized as admin user
}
