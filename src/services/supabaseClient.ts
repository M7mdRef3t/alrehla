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
