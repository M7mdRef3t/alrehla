import type { SupabaseClient } from "@supabase/supabase-js";

export interface MarayaProfile {
  id: string;
  anon_id: string;
  auth_user_id: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export async function getOrCreateMarayaProfile(
  client: SupabaseClient,
  anonId: string,
  displayName?: string | null,
) {
  const normalizedAnonId = String(anonId || "").trim();
  if (!normalizedAnonId) {
    throw new Error("anonId is required");
  }

  const normalizedDisplayName = String(displayName || "").trim() || null;

  const existing = await client
    .from("maraya_profiles")
    .select("*")
    .eq("anon_id", normalizedAnonId)
    .maybeSingle<MarayaProfile>();

  if (existing.error) {
    throw new Error(existing.error.message);
  }

  if (existing.data) {
    if (normalizedDisplayName && normalizedDisplayName !== existing.data.display_name) {
      const updated = await client
        .from("maraya_profiles")
        .update({
          display_name: normalizedDisplayName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.data.id)
        .select("*")
        .single<MarayaProfile>();

      if (updated.error) {
        throw new Error(updated.error.message);
      }
      return updated.data;
    }

    return existing.data;
  }

  const inserted = await client
    .from("maraya_profiles")
    .insert({
      anon_id: normalizedAnonId,
      display_name: normalizedDisplayName,
    })
    .select("*")
    .single<MarayaProfile>();

  if (inserted.error) {
    throw new Error(inserted.error.message);
  }

  return inserted.data;
}
