import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseConfig, isSupabaseConfigured } from "../env";

const supabaseUrl = supabaseConfig.url;
const supabaseAnonKey = supabaseConfig.anonKey;

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
  console.error('isSupabaseConfigured:', isSupabaseConfigured);
  console.error('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'UNDEFINED');
  console.error('====================');
}
