import { logger } from "@/services/logger";
import { supabase } from "./supabaseClient";

export interface OrbitalFeedParams {
    orbitName: string;
    action: string;
    value: string;
    icon?: string;
    colorClass?: string;
}

export interface OrbitalFeedResponse extends OrbitalFeedParams {
    id: string;
    user_id: string;
    likes: number;
    created_at: string;
}

/**
 * جلب آخر أحداث المجتمع المداري (Social Galaxy)
 */
export async function getOrbitalFeed(limit: number = 20): Promise<OrbitalFeedResponse[]> {
    if (!supabase) return [];

    try {
        const { data, error } = await supabase
            .from("orbital_feed")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(limit);

        if (error) {
            logger.error("Failed to fetch orbital feed:", error);
            return [];
        }

        return data as OrbitalFeedResponse[];
    } catch (err) {
        logger.error("Exception fetching orbital feed:", err);
        return [];
    }
}

/**
 * نشر حدث جديد (مجهول) إلى المجتمع المداري
 */
export async function pushToOrbitalFeed(params: OrbitalFeedParams): Promise<boolean> {
    if (!supabase) return false;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return false;

        const { error } = await supabase
            .from("orbital_feed")
            .insert({
                user_id: session.user.id,
                orbit_name: params.orbitName,
                action: params.action,
                value: params.value,
                icon: params.icon || 'star',
                color_class: params.colorClass || 'text-amber-400 bg-amber-400/10 border-amber-500/20'
            });

        if (error) {
            logger.error("Failed to push to orbital feed:", error);
            return false;
        }

        return true;
    } catch (err) {
        logger.error("Exception pushing to orbital feed:", err);
        return false;
    }
}
