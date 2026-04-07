import { logger } from "../services/logger";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!supabaseUrl || !serviceRoleKey) return null;
    return createClient(supabaseUrl, serviceRoleKey);
}

export async function processShadowSignals(userId: string) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        if (!supabaseAdmin) return;
        // 1. Context Check (Mood Safety)
        const { data: pulses } = await supabaseAdmin
            .from('daily_pulse_logs')
            .select('mood')
            .eq('user_id', userId)
            .order('day', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!pulses || pulses.mood <= 2) return; // Safety: low mood = no shadow insights

        // 2. Frequency Check: Max 1 shadow insight per week
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count: recentSignals } = await supabaseAdmin
            .from('shadow_signals')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', weekAgo);

        if (recentSignals && recentSignals > 0) return;

        // 3. Detect Neglected Circles (Nodes not tagged for 21 days)
        // Note: Real implementation would join nodes + actions + pulse_tags
        // For V1, we simulate with a simple check on micro_actions
        const twentyOneDaysAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();

        // Fetch all active nodes
        const { data: nodes } = await supabaseAdmin
            .from('map_nodes')
            .select('label, id, ring')
            .eq('user_id', userId)
            .eq('is_archived', false)
            .not('ring', 'is', null); // Only check nodes that have been assigned a ring/place in life

        if (!nodes || nodes.length < 3) return; // Need a healthy map to detect shadows

        for (const node of nodes) {
            // Check if this node label was used in micro_actions metadata OR pulse notes
            const { count: actionCount } = await supabaseAdmin
                .from('micro_actions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .gte('executed_at', twentyOneDaysAgo)
                .contains('metadata', { nodeLabel: node.label });

            if (actionCount === 0) {
                // Potential Shadow Detected
                const shadowScore = 50; // Simple V1 score
                const insightText = `في دائرة موجودة في خريطتك بقالها فترة وهي "${node.label}"... بس مش واخدة أي فعل واعي بقالها ٢١ يوم. هل ده اختيار متعمد؟ ولا تأجيل مستمر؟`;

                await supabaseAdmin.from('shadow_signals').insert({
                    user_id: userId,
                    target_type: 'circle',
                    target_id: node.label,
                    shadow_score: shadowScore,
                    insight_text: insightText
                });
                break; // One per week
            }
        }

    } catch (err) {
        logger.error("Shadow Engine Error:", err);
    }
}
