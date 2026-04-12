/**
 * Infrastructure — Database
 * Public API barrel export.
 */

export {
  supabase,
  supabaseAdmin,
  isSupabaseReady,
  isSupabaseAbortError,
  safeGetSession,
} from "./client";

export type { SupabaseClient, Session } from "./client";
