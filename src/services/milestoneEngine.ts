import { logger } from "@/services/logger";
import { supabaseAdmin } from "./supabaseClient";

function getSupabaseAdmin() {
    return supabaseAdmin;
}

export type MilestoneType = 'shadow_breakthrough' | 'behavioral_diversity' | 'stability_recovery';

export async function processMilestones(userId: string) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        if (!supabaseAdmin) return;
        // 1. Fetch unacknowledged shadow signals
        const { data: shadowSignals } = await supabaseAdmin
            .from('shadow_signals')
            .select('*')
            .eq('user_id', userId)
            .eq('acknowledged', true); // Only work on what was acknowledged

        // 2. Fetch last 30 days of actions
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data: recentActions } = await supabaseAdmin
            .from('micro_actions')
            .select('*')
            .eq('user_id', userId)
            .gte('executed_at', thirtyDaysAgo);

        // 3. Check for SHADOW BREAKTHROUGH
        if (shadowSignals) {
            for (const s of shadowSignals) {
                // Check if user has executed at least 2 positive impact actions in this circle
                const breakthroughActions = (recentActions || []).filter(a =>
                    a.metadata?.nodeLabel === s.target_id &&
                    Number(a.impact_score || 0) > 0
                );

                if (breakthroughActions.length >= 2) {
                    await unlockMilestone(userId, 'shadow_breakthrough', `تجاوزت ظل "${s.target_id}" بعد فترة إهمال`, {
                        target_id: s.target_id,
                        actionCount: breakthroughActions.length
                    });
                }
            }
        }

        // 4. Check for BEHAVIORAL DIVERSITY
        const actionTypes = new Set((recentActions || []).map(a => a.action_type));
        const avgImpact = (recentActions || []).reduce((acc, a) => acc + Number(a.impact_score || 0), 0) / (recentActions?.length || 1);

        if (actionTypes.size >= 4 && avgImpact > 0.5) {
            await unlockMilestone(userId, 'behavioral_diversity', 'وسّعت جينوم أفعالك.. بدأت تفتح آفاق جديدة لوعيك', {
                diversityCount: actionTypes.size,
                avgImpact: avgImpact.toFixed(2)
            });
        }

        // 5. Check for STABILITY RECOVERY (30-day window)
        // Note: Simplified logic: 7 days of mood > 3 after a period of lower mood
        const { data: pulses } = await supabaseAdmin
            .from('daily_pulse_logs')
            .select('mood')
            .eq('user_id', userId)
            .order('day', { ascending: false })
            .limit(14);

        if (pulses && pulses.length === 14) {
            const recentWeek = pulses.slice(0, 7).every(p => p.mood >= 4);
            const prevWeek = pulses.slice(7, 14).some(p => p.mood <= 2);
            if (recentWeek && prevWeek) {
                await unlockMilestone(userId, 'stability_recovery', 'استعدت التوازن الحقيقي بعد انحدار في استقرارك', {
                    recoveryWindow: '14 days'
                });
            }
        }

    } catch (err) {
        logger.error("Milestone Engine error:", err);
    }
}

async function unlockMilestone(userId: string, type: MilestoneType, label: string, metadata: any) {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return;

    // Check for existence of this milestone type in the last 30 days to avoid repeats
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
        .from('evolution_milestones')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('milestone_type', type)
        // If it's a breakthrough for a specific circle, check that metadata target match as well
        .filter('metadata->>target_id', 'eq', metadata.target_id || '')
        .gte('unlocked_at', thirtyDaysAgo);

    if (count === 0) {
        await supabaseAdmin.from('evolution_milestones').insert({
            user_id: userId,
            milestone_type: type,
            milestone_label: label,
            metadata
        });
    }
}
