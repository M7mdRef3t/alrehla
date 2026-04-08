import { logger } from "../services/logger";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!supabaseUrl || !serviceRoleKey) return null;
    return createClient(supabaseUrl, serviceRoleKey);
}

export interface ActionStats {
    action_type: string;
    effectiveness_score: number;
    exploration_score: number;
    final_score: number;
    avg_impact: number;
    success_rate: number;
    count: number;
    is_blacklisted: boolean;
}

export async function getRankedActions(userId: string, currentMood: number = 3): Promise<Record<string, ActionStats>> {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        if (!supabaseAdmin) return {};
        // Fetch action history for this user
        const { data: actions, error } = await supabaseAdmin
            .from('micro_actions')
            .select('action_type, impact_score')
            .eq('user_id', userId)
            .order('executed_at', { ascending: false });

        if (error) throw error;

        const stats: Record<string, { totalImpact: number; successCount: number; totalCount: number; lastThreeImpacts: number[] }> = {};

        (actions || []).forEach(a => {
            if (!stats[a.action_type]) {
                stats[a.action_type] = { totalImpact: 0, successCount: 0, totalCount: 0, lastThreeImpacts: [] };
            }
            const impact = Number(a.impact_score || 0);

            // For effectiveness stats, only count completed ones (impact exists)
            if (a.impact_score !== null) {
                stats[a.action_type].totalImpact += impact;
                stats[a.action_type].successCount += (impact > 0 ? 1 : 0);
                if (stats[a.action_type].lastThreeImpacts.length < 3) {
                    stats[a.action_type].lastThreeImpacts.push(impact);
                }
            }
            stats[a.action_type].totalCount += 1;
        });

        const ranked: Record<string, ActionStats> = {};
        const totalUserActions = actions?.length || 0;

        // Base action types (should be defined centrally ideally, but for now we look at what's in history + defaults)
        const allPossibleActions = ['red_orbit_analysis', 'quick_journal', 'rebalance_circles', 'map_focus'];

        allPossibleActions.forEach(type => {
            const s = stats[type] || { totalImpact: 0, successCount: 0, totalCount: 0, lastThreeImpacts: [] };

            // 1. Effectiveness Score
            const avgImpact = s.totalCount > 0 ? s.totalImpact / s.totalCount : 0;
            const successRate = s.totalCount > 0 ? s.successCount / s.totalCount : 0;
            const consistencyFactor = totalUserActions > 0 ? s.totalCount / totalUserActions : 0;
            const normalizedAvg = Math.min(Math.max(avgImpact / 3, 0), 1);
            const effectiveness = (normalizedAvg * 0.6) + (successRate * 0.3) + (consistencyFactor * 0.1);

            // 2. Exploration Score: 1 / (usage_count + 1)
            const exploration = 1 / (s.totalCount + 1);

            // 3. Safety Guard: Blacklist if last 3 impacts were negative
            const isBlacklisted = s.lastThreeImpacts.length === 3 && s.lastThreeImpacts.every(v => v < 0);

            // 4. Blended Final Score (70% Effectiveness / 30% Exploration)
            // Context-Aware: If Mood is very low, weight effectiveness higher (safety first)
            const effectivenessWeight = currentMood <= 2 ? 0.9 : 0.7;
            const explorationWeight = 1 - effectivenessWeight;

            const finalScore = (effectiveness * effectivenessWeight) + (exploration * explorationWeight);

            ranked[type] = {
                action_type: type,
                effectiveness_score: Number(effectiveness.toFixed(2)),
                exploration_score: Number(exploration.toFixed(2)),
                final_score: isBlacklisted ? -1 : Number(finalScore.toFixed(2)),
                avg_impact: Number(avgImpact.toFixed(2)),
                success_rate: Number(successRate.toFixed(2)),
                count: s.totalCount,
                is_blacklisted: isBlacklisted
            };
        });

        return ranked;
    } catch (err) {
        logger.error("Ranking Engine Error:", err);
        return {};
    }
}
