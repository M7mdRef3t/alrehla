import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient | null {
  const supabaseUrl =
    (process.env.SUPABASE_URL ||
     process.env.NEXT_PUBLIC_SUPABASE_URL ||
     process.env.VITE_SUPABASE_URL ||
     "").trim();

  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!supabaseUrl || !serviceRoleKey) {
    if (process.env.NODE_ENV === "development") {
       console.error("[SupabaseAdmin] Missing config:", { hasUrl: !!supabaseUrl, hasKey: !!serviceRoleKey });
    }
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }

  return cachedClient;
}
