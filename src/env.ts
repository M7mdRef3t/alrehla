/**
 * Direct environment access for Next.js
 * These values are inlined by Next.js at build time
 */

// Direct access to Next.js environment variables
export const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
} as const;

export const supabaseConfig = {
  url: env.SUPABASE_URL,
  anonKey: env.SUPABASE_ANON_KEY,
};

export const isSupabaseConfigured = Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
