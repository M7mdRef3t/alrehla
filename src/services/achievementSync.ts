/**
 * achievementSync.ts
 * Syncs achievements & points to Supabase.
 * Falls back gracefully if the user is not authenticated or offline.
 */
import { supabase, safeGetSession } from "./supabaseClient";
import { ACHIEVEMENTS } from "../data/achievements";

/** Upload an unlocked achievement to Supabase */
export async function syncAchievementUnlock(achievementId: string): Promise<void> {
  if (!supabase) return;
  const session = await safeGetSession();
  if (!session) return;

  const { error } = await supabase.from("user_achievements").upsert(
    { user_id: session.user.id, achievement_id: achievementId },
    { onConflict: "user_id,achievement_id", ignoreDuplicates: true }
  );
  if (error) console.error("[achievementSync] unlock:", error.message);
}

/** Add points for a user action */
export async function syncAddPoints(amount: number): Promise<void> {
  if (!supabase || amount <= 0) return;
  const session = await safeGetSession();
  if (!session) return;

  const { error } = await supabase.rpc("add_user_points", {
    p_user_id: session.user.id,
    p_amount: amount,
  });
  if (error) console.error("[achievementSync] addPoints:", error.message);
}

/**
 * Load achievements from Supabase and merge with current localStorage state.
 * Returns the list of remotely-unlocked achievement IDs.
 */
export async function loadRemoteAchievements(): Promise<string[]> {
  if (!supabase) return [];
  const session = await safeGetSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", session.user.id);

  if (error) { console.error("[achievementSync] load:", error.message); return []; }
  return (data ?? []).map((r) => r.achievement_id as string);
}

/** Load total points from Supabase */
export async function loadRemotePoints(): Promise<number> {
  if (!supabase) return 0;
  const session = await safeGetSession();
  if (!session) return 0;

  const { data, error } = await supabase
    .from("user_points")
    .select("total_points")
    .eq("user_id", session.user.id)
    .single();

  if (error) return 0;
  return (data as { total_points: number })?.total_points ?? 0;
}

/** Upload all locally-stored achievements in bulk (called on first login) */
export async function bulkSyncAchievements(unlockedIds: string[]): Promise<void> {
  if (!supabase || unlockedIds.length === 0) return;
  const session = await safeGetSession();
  if (!session) return;

  const rows = unlockedIds
    .filter((id) => ACHIEVEMENTS.some((a) => a.id === id))
    .map((id) => ({ user_id: session.user.id, achievement_id: id }));

  if (rows.length === 0) return;
  const { error } = await supabase
    .from("user_achievements")
    .upsert(rows, { onConflict: "user_id,achievement_id", ignoreDuplicates: true });
  if (error) console.error("[achievementSync] bulkSync:", error.message);
}
