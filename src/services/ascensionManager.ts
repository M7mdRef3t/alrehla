import { logger } from "@/services/logger";
import { supabase } from "./supabaseClient";

export type AscensionStatus = 'none' | 'candidate' | 'invited' | 'ascended' | 'fallen_oracle';

export interface AscensionProfile {
    user_id: string;
    status: AscensionStatus;
    points: number;
    swarm_impact: number;
    consistency_streak: number;
}

/**
 * 🦅 THE ASCENSION PROTOCOL
 * Algorithmic recruitment and promotion of Pioneers to Oracle rank.
 * Implements "Swarm Impact" weighting and "The Descent" (Demotion) guardrails.
 */
export class AscensionManager {
    /**
     * Fetches the current user's ascension status and points.
     */
    static async getStatus(): Promise<AscensionProfile | null> {
        if (!supabase) return null;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('ascension_status, ascension_points, swarm_impact_score, consistency_streak')
            .eq('id', user.id)
            .single();

        if (error) {
            logger.error("Error fetching ascension status:", error);
            return null;
        }

        return {
            user_id: user.id,
            status: data.ascension_status as AscensionStatus,
            points: data.ascension_points || 0,
            swarm_impact: data.swarm_impact_score || 0,
            consistency_streak: data.consistency_streak || 0
        };
    }

    /**
     * Accepts "The Oracle Oath" and promotes the user to Oracle (ascended).
     */
    static async acceptOath(): Promise<boolean> {
        if (!supabase) return false;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await supabase
            .from('profiles')
            .update({ ascension_status: 'ascended' })
            .eq('id', user.id)
            .eq('ascension_status', 'invited');

        if (error) {
            logger.error("Oath Acceptance Failed:", error);
            return false;
        }

        return true;
    }

    /**
     * Triggered by cron or admin dashboard to demote Oracles whose BI dropped below threshold.
     * "The Descent" guardrail.
     */
    static async performIntegritySweep(): Promise<number> {
        if (!supabase) return 0;

        const { data, error } = await supabase.rpc('check_oracle_integrity');
        if (error) {
            logger.error("Descent Protocol Failure:", error);
            return 0;
        }
        return data as number;
    }
}
