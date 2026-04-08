import { logger } from "@/services/logger";
import { isUserMode } from "@/config/appEnv";
import { safeGetSession, supabase } from "./supabaseClient";
import { useGamificationState, type Badge } from "@/state/gamificationState";

// User mode stays local-first until the cloud schema for gamification is provisioned.
// Once we detect the schema is missing, remember it for the session to avoid repeat 400/404 errors.
const SESSION_PROFILE_KEY = "gam-profile-sync-disabled";
const SESSION_BADGE_KEY = "gam-badge-sync-disabled";

function sessionFlag(key: string): boolean {
    try { return typeof sessionStorage !== "undefined" && sessionStorage.getItem(key) === "1"; } catch { return false; }
}
function setSessionFlag(key: string): void {
    try { if (typeof sessionStorage !== "undefined") sessionStorage.setItem(key, "1"); } catch { /* ignore */ }
}

let profileGamificationSyncEnabled = !isUserMode && !sessionFlag(SESSION_PROFILE_KEY);
let badgeGamificationSyncEnabled = !isUserMode && !sessionFlag(SESSION_BADGE_KEY);

function isSchemaMismatchError(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;

    const maybeError = error as {
        code?: string;
        message?: string;
        details?: string;
        hint?: string;
    };

    const code = typeof maybeError.code === "string" ? maybeError.code.toUpperCase() : "";
    if (code === "42703" || code === "42P01" || code === "PGRST205") {
        return true;
    }

    const combined = [maybeError.message, maybeError.details, maybeError.hint]
        .filter((value): value is string => typeof value === "string" && value.length > 0)
        .join(" ")
        .toLowerCase();

    return (
        combined.includes("column") ||
        combined.includes("relation") ||
        combined.includes("table") ||
        combined.includes("does not exist") ||
        combined.includes("could not find")
    );
}

function disableProfileGamificationSync(error: unknown): void {
    if (!profileGamificationSyncEnabled) return;
    profileGamificationSyncEnabled = false;
    setSessionFlag(SESSION_PROFILE_KEY);
    console.warn("Gamification profile sync disabled: Supabase schema is not available for xp/level.", error);
}

function disableBadgeGamificationSync(error: unknown): void {
    if (!badgeGamificationSyncEnabled) return;
    badgeGamificationSyncEnabled = false;
    setSessionFlag(SESSION_BADGE_KEY);
    console.warn("Gamification badge sync disabled: Supabase schema is not available for user_badges.", error);
}

/**
 * دمج نظام النقاط (Gamification) مع قاعدة بيانات Supabase عندما تكون الجداول متاحة.
 * إذا كانت بيئة المستخدم لا تحتوي على schema الخاص بالـ gamification، نرجع بهدوء للـ local state.
 */
export async function syncGamificationOnLoad(): Promise<void> {
    if (!supabase) return;

    try {
        const session = await safeGetSession();
        if (!session?.user) return;

        if (profileGamificationSyncEnabled) {
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("xp, level")
                .eq("id", session.user.id)
                .maybeSingle();

            if (profileError) {
                if (isSchemaMismatchError(profileError)) {
                    disableProfileGamificationSync(profileError);
                } else {
                    logger.error("Failed to fetch gamification profile:", profileError);
                }
            } else if (profile) {
                useGamificationState.setState((state) => ({
                    ...state,
                    xp: Math.max(state.xp, profile.xp || 0),
                    level: Math.max(state.level, profile.level || 1)
                }));
            }
        }

        if (badgeGamificationSyncEnabled) {
            const { data: badges, error: badgesError } = await supabase
                .from("user_badges")
                .select("badge_id, name, description, icon, earned_at")
                .eq("user_id", session.user.id);

            if (badgesError) {
                if (isSchemaMismatchError(badgesError)) {
                    disableBadgeGamificationSync(badgesError);
                } else {
                    logger.error("Failed to fetch gamification badges:", badgesError);
                }
            } else if (badges && badges.length > 0) {
                useGamificationState.setState((state) => {
                    const localBadges = [...state.badges];

                    badges.forEach((serverBadge) => {
                        if (!localBadges.some((badge) => badge.id === serverBadge.badge_id)) {
                            localBadges.push({
                                id: serverBadge.badge_id,
                                name: serverBadge.name,
                                description: serverBadge.description,
                                icon: serverBadge.icon,
                                earnedAt: new Date(serverBadge.earned_at).getTime()
                            });
                        }
                    });

                    return { ...state, badges: localBadges };
                });
            }
        }

        if (profileGamificationSyncEnabled) {
            await pushGamificationStats();
        }
    } catch (err) {
        logger.error("Failed to sync gamification on load:", err);
    }
}

export async function pushGamificationStats(): Promise<void> {
    if (!supabase || !profileGamificationSyncEnabled) return;

    try {
        const session = await safeGetSession();
        if (!session?.user) return;

        const state = useGamificationState.getState();
        const { error } = await supabase
            .from("profiles")
            .update({
                xp: state.xp,
                level: state.level
            })
            .eq("id", session.user.id);

        if (error) {
            if (isSchemaMismatchError(error)) {
                disableProfileGamificationSync(error);
                return;
            }
            logger.error("Failed to push gamification stats:", error);
        }
    } catch (err) {
        logger.error("Failed to push gamification stats:", err);
    }
}

export async function pushGamificationBadge(badge: Badge): Promise<void> {
    if (!supabase || !badgeGamificationSyncEnabled) return;

    try {
        const session = await safeGetSession();
        if (!session?.user) return;

        const { error } = await supabase
            .from("user_badges")
            .insert({
                user_id: session.user.id,
                badge_id: badge.id,
                name: badge.name,
                description: badge.description,
                icon: badge.icon,
                earned_at: new Date(badge.earnedAt).toISOString()
            });

        if (error) {
            if (isSchemaMismatchError(error)) {
                disableBadgeGamificationSync(error);
                return;
            }
            logger.error("Failed to push gamification badge:", error);
        }
    } catch (err) {
        logger.error("Failed to push gamification badge:", err);
    }
}
