import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function processActionImpacts(userId: string, currentMood: number, currentEnergy: number) {
    try {
        // Find micro_actions created in the last 48 hours that don't have a followup yet
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

        const { data: pendingActions } = await supabaseAdmin
            .from('micro_actions')
            .select('*')
            .eq('user_id', userId)
            .is('followup_mood', null)
            .gte('executed_at', fortyEightHoursAgo);

        if (!pendingActions || pendingActions.length === 0) return;

        for (const action of pendingActions) {
            // Calculate Impact Score
            // Formula: (Delta Mood * 0.7) + (Delta Energy * 0.3)
            // mood is typically 1-5
            const moodDelta = currentMood - (action.baseline_mood || 3);
            const energyDelta = currentEnergy - (action.baseline_energy || 3);

            const impactScore = (moodDelta * 0.7) + (energyDelta * 0.3);

            await supabaseAdmin
                .from('micro_actions')
                .update({
                    followup_mood: currentMood,
                    followup_energy: currentEnergy,
                    impact_score: impactScore.toFixed(2)
                })
                .eq('id', action.id);
        }
    } catch (err) {
        console.error("Impact Engine Error:", err);
    }
}
