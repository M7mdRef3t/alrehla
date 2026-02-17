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
  console.error('Supabase not ready:', {
    supabaseUrl: !!supabaseUrl,
    supabaseAnonKey: !!supabaseAnonKey,
    envVars: {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: !!process.env.VITE_SUPABASE_ANON_KEY,
    }
  });
}
