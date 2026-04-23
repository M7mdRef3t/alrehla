/**
 * adminDreams.ts — Dreams fetch/save via Supabase.
 */

import { supabase, isSupabaseReady } from "../supabaseClient";

export async function fetchDreams(): Promise<any[]> {
  if (!isSupabaseReady || !supabase) return [];
  const { data, error } = await supabase.from('alrehla_dreams').select('*').order('created_at', { ascending: false });
  if (error || !data) return [];
  return data;
}

export async function saveDream(dream: any): Promise<boolean> {
  if (!isSupabaseReady || !supabase) return false;
  const { error } = await supabase.from('alrehla_dreams').upsert({ ...dream, updated_at: new Date().toISOString() });
  return !error;
}
