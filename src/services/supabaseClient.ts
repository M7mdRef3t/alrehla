import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { runtimeEnv } from "../config/runtimeEnv";

const supabaseUrl = runtimeEnv.supabaseUrl;
const supabaseAnonKey = runtimeEnv.supabaseAnonKey;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true }
    })
    : null;

export const isSupabaseReady = Boolean(supabase);

// Debug logging for production
if (typeof window !== 'undefined' && !isSupabaseReady) {
  console.error('=== Supabase Debug ===');
  console.error('supabaseUrl:', supabaseUrl);
  console.error('supabaseAnonKey:', supabaseAnonKey ? 'SET' : 'UNDEFINED');
  console.error('runtimeEnv check:', {
    hasUrl: !!runtimeEnv.supabaseUrl,
    hasKey: !!runtimeEnv.supabaseAnonKey,
    isDev: runtimeEnv.isDev
  });
  console.error('====================');
}
