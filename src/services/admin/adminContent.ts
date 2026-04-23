/**
 * adminContent.ts — App content entries CRUD via Supabase.
 */

import { supabase, isSupabaseReady } from "../supabaseClient";
import type { AdminContentEntry } from "./adminTypes";

export async function fetchAppContentEntries(query?: {
  page?: string;
  search?: string;
  limit?: number;
}): Promise<AdminContentEntry[]> {
  if (!isSupabaseReady || !supabase) return [];
  let req = supabase
    .from("app_content")
    .select("key, content, page, updated_at")
    .order("updated_at", { ascending: false });

  if (query?.page) req = req.eq("page", query.page);
  if (query?.search) req = req.ilike("key", `%${query.search}%`);

  const { data, error } = await req;
  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((row) => ({
    key: String(row.key ?? ""),
    content: String(row.content ?? ""),
    page: row.page ? String(row.page) : null,
    updatedAt: row.updated_at ? String(row.updated_at) : null,
    source: "remote"
  }));
}

export async function saveAppContentEntry(entry: {
  key: string;
  content: string;
  page?: string | null;
}): Promise<boolean> {
  if (!isSupabaseReady || !supabase) return false;
  const { error } = await supabase.from("app_content").upsert(
    {
      key: entry.key,
      content: entry.content,
      page: entry.page ?? null,
      updated_at: new Date().toISOString()
    },
    { onConflict: "key" }
  );
  return !error;
}

export async function deleteAppContentEntry(key: string): Promise<boolean> {
  if (!isSupabaseReady || !supabase) return false;
  const { error } = await supabase.from("app_content").delete().eq("key", key);
  return !error;
}
