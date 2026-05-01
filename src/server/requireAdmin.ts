import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isDevMode } from '../config/appEnv';

export async function requireAdmin(req: Request | any) {
  // 0. Development Bypass (Local Testing)
  const adminSecret = req.headers.get("x-admin-secret");
  if (isDevMode && adminSecret && adminSecret === process.env.ADMIN_API_SECRET) {
    return null;
  }

  // 0b. Full dev bypass when no service role key is configured (local dev only)
  if (isDevMode && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("[requireAdmin] Dev bypass active — no SUPABASE_SERVICE_ROLE_KEY set. Add it to .env.local for production-parity auth.");
    return null; // Allow all requests in dev when service key is missing
  }
  const authHeader = req.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
     return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
  }

  // Verify the JWT and get the user identity
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: { user }, error } = await supabaseAnon.auth.getUser(token);

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 });
  }

  const allowedRolesStr = process.env.ADMIN_ALLOWED_ROLES;
  
  // Fallback: if not defined, use sensible defaults (never block legitimate admins)
  const effectiveRoles = allowedRolesStr || "owner,superadmin,admin";
  const allowedRoles = effectiveRoles.split(",").map(r => r.trim());

  // 1. Check JWT metadata first (fast path, no extra DB call)
  const jwtRole =
    user.app_metadata?.role ??
    user.user_metadata?.role ??
    user.app_metadata?.user_role ??
    user.user_metadata?.user_role;

  if (jwtRole && allowedRoles.includes(jwtRole)) {
    return null; // authorized via JWT claims
  }

  // 2. Fallback: query public.profiles for the role (handles cases where JWT
  //    metadata was never updated but the profile has the correct role)
  if (!supabaseServiceKey) {
    // No service key — can't do profile lookup. If JWT role wasn't enough, deny.
    return NextResponse.json({ error: `Forbidden - Admin role required (got: ${jwtRole || 'none'})` }, { status: 403 });
  }

  const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: profile, error: profileError } = await supabaseService
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[requireAdmin] profile lookup error:", profileError);
  }

  const profileRole = profile?.role as string | undefined;

  if (profileRole && allowedRoles.includes(profileRole)) {
    return null; // authorized via profile role
  }

  return NextResponse.json(
    { error: `Forbidden - Admin role required (got: ${profileRole || jwtRole || 'none'})` },
    { status: 403 }
  );
}
