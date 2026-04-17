/**
 * Stub: createSupabaseServerClient
 * Placeholder for server-side Supabase client used in API routes.
 * Replace with actual implementation when Supabase is fully configured.
 */

import { getSupabaseAdminClient } from "../../../app/api/_lib/supabaseAdmin";

export function createSupabaseServerClient() {
  const client = getSupabaseAdminClient();
  if (!client) {
    throw new Error("Supabase admin client not configured");
  }
  return client;
}
