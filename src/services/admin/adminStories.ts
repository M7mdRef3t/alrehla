import { supabase, isSupabaseReady } from "../supabaseClient";
import { logger } from "../logger";

export interface SuccessStory {
  id?: string;
  name: string;
  age: number;
  city: string;
  category: string;
  quote: string;
  outcome: string;
  stars: number;
  /** Single character shown as avatar fallback (first letter of name). */
  avatar: string;
  /** Tailwind gradient pair, e.g. "from-teal-500 to-emerald-600". */
  color: string;
  is_published: boolean;
  created_at?: string;
}

/* ── Read ──────────────────────────────────────────────────────────────── */

/**
 * Fetch ALL stories (published + drafts) for the admin panel.
 * The public StoriesScreen uses its own query filtered to is_published = true.
 */
export async function fetchAdminStories(): Promise<SuccessStory[]> {
  if (!isSupabaseReady || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from("success_stories")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as SuccessStory[];
  } catch (err) {
    logger.error("Error fetching admin stories:", err);
    return [];
  }
}

/* ── Write ─────────────────────────────────────────────────────────────── */

/**
 * Create a new story or update an existing one.
 * If story.id is present → UPDATE (upsert), otherwise → INSERT.
 */
export async function saveStory(
  story: SuccessStory
): Promise<{ data: SuccessStory | null; error: unknown }> {
  if (!isSupabaseReady || !supabase) {
    return { data: null, error: new Error("Supabase is not configured.") };
  }
  try {
    // Auto-generate avatar from first char if empty
    const payload = {
      ...story,
      avatar: story.avatar?.trim() || story.name.trim()[0] || "؟",
    };

    const { data, error } = await supabase
      .from("success_stories")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    if (error) throw error;
    return { data: data as SuccessStory, error: null };
  } catch (err) {
    logger.error("Error saving story:", err);
    return { data: null, error: err };
  }
}

/* ── Delete ─────────────────────────────────────────────────────────────── */

/**
 * Permanently delete a story by its UUID.
 */
export async function deleteStory(
  id: string
): Promise<{ success: boolean; error: unknown }> {
  if (!isSupabaseReady || !supabase) return { success: false, error: null };
  try {
    const { error } = await supabase
      .from("success_stories")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    logger.error("Error deleting story:", err);
    return { success: false, error: err };
  }
}

/* ── Toggle publish ─────────────────────────────────────────────────────── */

/**
 * Quickly flip the is_published flag without loading the full story object.
 */
export async function toggleStoryPublished(
  id: string,
  isPublished: boolean
): Promise<{ success: boolean }> {
  if (!isSupabaseReady || !supabase) return { success: false };
  try {
    const { error } = await supabase
      .from("success_stories")
      .update({ is_published: isPublished })
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    logger.error("Error toggling story published:", err);
    return { success: false };
  }
}
