/**
 * Infrastructure — Database Client
 *
 * Re-exports the canonical Supabase client from @/services/supabaseClient.
 * This file exists so that domain modules can import from the infrastructure
 * layer without directly depending on the services layer.
 *
 * Previously this was a full copy of supabaseClient.ts. Now it's a thin
 * re-export to eliminate code duplication while preserving import paths.
 */

export {
  supabase,
  supabaseAdmin,
  isSupabaseReady,
  isSupabaseAbortError,
  safeGetSession,
} from "@/services/supabaseClient";

export type { SupabaseClient, Session } from "@supabase/supabase-js";
