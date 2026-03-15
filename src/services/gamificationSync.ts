import { supabase } from "./supabaseClient";
import { useGamificationState, type Badge } from "../state/gamificationState";

/**
 * دمج نظام النِقاط (Gamification) مع قاعدة بيانات السحابة (Supabase)
 * لجعل البيانات حقيقية ومستمرة عبر الأجهزة.
 */

/**
 * جلب بيانات الـ Gamification من السيرفر وتحديث الـ Local State.
 * يُستدعى عند تسجيل الدخول أو فتح التطبيق.
 */
export async function syncGamificationOnLoad(): Promise<void> {
    if (!supabase) return;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        // 1. Fetch XP & Level from profiles
        const { data: profile } = await supabase
            .from("profiles")
            .select("xp, level")
            .eq("id", session.user.id)
            .single();

        if (profile) {
            useGamificationState.setState((s) => ({
                ...s,
                xp: Math.max(s.xp, profile.xp || 0), // Use whichever is higher to prevent data loss if offline
                level: Math.max(s.level, profile.level || 1)
            }));
        }

        // 2. Fetch Badges
        const { data: badges } = await supabase
            .from("user_badges")
            .select("badge_id, name, description, icon, earned_at")
            .eq("user_id", session.user.id);

        if (badges && badges.length > 0) {
            useGamificationState.setState((s) => {
                const localBadges = [...s.badges];

                // Merge badges, avoiding duplicates
                badges.forEach((serverBadge) => {
                    if (!localBadges.some((b) => b.id === serverBadge.badge_id)) {
                        localBadges.push({
                            id: serverBadge.badge_id,
                            name: serverBadge.name,
                            description: serverBadge.description,
                            icon: serverBadge.icon,
                            earnedAt: new Date(serverBadge.earned_at).getTime()
                        });
                    }
                });

                return { ...s, badges: localBadges };
            });
        }

        // After merging, push the potentially higher local stats back to the server
        await pushGamificationStats();

    } catch (err) {
        console.error("Failed to sync gamification on load:", err);
    }
}

/**
 * دفع النقاط والمستويات الحالية إلى السيرفر
 */
export async function pushGamificationStats(): Promise<void> {
    if (!supabase) return;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const state = useGamificationState.getState();

        await supabase
            .from("profiles")
            .update({
                xp: state.xp,
                level: state.level
            })
            .eq("id", session.user.id);

    } catch (err) {
        console.error("Failed to push gamification stats:", err);
    }
}

/**
 * تسجيل شارة جديدة في السيرفر
 */
export async function pushGamificationBadge(badge: Badge): Promise<void> {
    if (!supabase) return;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        await supabase
            .from("user_badges")
            .insert({
                user_id: session.user.id,
                badge_id: badge.id,
                name: badge.name,
                description: badge.description,
                icon: badge.icon,
                earned_at: new Date(badge.earnedAt).toISOString()
            });

    } catch (err) {
        console.error("Failed to push gamification badge:", err);
    }
}
