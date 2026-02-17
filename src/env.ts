/**
 * Direct environment access — works with both Vite and Next.js.
 * Uses runtimeEnv as the single source of truth.
 */

import { runtimeEnv } from "./config/runtimeEnv";

export const env = {
  SUPABASE_URL: runtimeEnv.supabaseUrl || '',
  SUPABASE_ANON_KEY: runtimeEnv.supabaseAnonKey || '',
} as const;

export const supabaseConfig = {
  url: env.SUPABASE_URL,
  anonKey: env.SUPABASE_ANON_KEY,
};

export const isSupabaseConfigured = Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
