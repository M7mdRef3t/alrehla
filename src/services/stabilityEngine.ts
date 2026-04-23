import { logger } from "@/services/logger";
import { supabaseAdmin } from "./supabaseClient";

function getSupabaseAdmin() {
    return supabaseAdmin;
}

export async function processStabilitySnapshot(userId: string, windowDays: number = 30) {
    try {
        const supabaseAdmin = getSupabaseAdmin();
        if (!supabaseAdmin) return;
        const thresholdDate = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

        // 1. Fetch Influence Maps (The nerves)
        const { data: maps } = await supabaseAdmin
            .from('influence_maps')
            .select('*')
            .eq('user_id', userId)
            .gte('snapshot_date', thresholdDate)
            .order('snapshot_date', { ascending: true });

        // 2. Fetch Pulses (The pulse)
        const { data: pulses } = await supabaseAdmin
            .from('daily_pulse_logs')
            .select('mood, energy, day')
            .eq('user_id', userId)
            .gte('day', thresholdDate)
            .order('day', { ascending: true });

        if (!maps || maps.length < 3) return;

        // 3. Calculate Edge Stability (Volatility of relationships)
        const edgeData = new Map<string, number[]>();
        maps.forEach(m => {
            m.edges.forEach((e: any) => {
                const key = `${e.source}->${e.target}`;
                if (!edgeData.has(key)) edgeData.set(key, []);
                edgeData.get(key)!.push(e.strength);
            });
        });

        const edgeStability = Array.from(edgeData.entries()).map(([key, strengths]) => {
            const [source, target] = key.split('->');
            const variance = calculateVariance(strengths);
            const volatility = Math.min(variance * 10, 1); // Scale for UI
            return {
                source,
                target,
                volatility_score: volatility,
                stability_score: 1 - volatility,
                trend: strengths[strengths.length - 1] > (strengths[0] || 0) ? 'improving' : 'worsening'
            };
        });

        // 4. Calculate Node Stability (Volatility of states/circles)
        // We look at state variance and circle activity variance
        const moodStrengths = (pulses || []).map(p => p.mood);
        const energyStrengths = (pulses || []).map(p => p.energy);

        const nodeStability = [
            { id: 'mood', label: 'الموود', volatility_score: Math.min(calculateVariance(moodStrengths) * 2, 1), stability_score: 1 },
            { id: 'energy', label: 'الطاقة', volatility_score: Math.min(calculateVariance(energyStrengths) * 2, 1), stability_score: 1 }
        ];

        // Add circle activity volatility if we have enough data
        const circleActivity = new Map<string, number[]>();
        // Simplified: using influence map weights as a proxy for activity
        maps.forEach(m => {
            m.nodes.forEach((n: any) => {
                if (n.type === 'circle') {
                    if (!circleActivity.has(n.id)) circleActivity.set(n.id, []);
                    // Here we might use action counts normally, but influence map nodes carry context
                    circleActivity.get(n.id)!.push(n.weight || 0);
                }
            });
        });

        circleActivity.forEach((weights, id) => {
            const vol = Math.min(calculateVariance(weights) * 5, 1);
            nodeStability.push({ id, label: id, volatility_score: vol, stability_score: 1 - vol });
        });

        // 5. Store Snapshot
        await supabaseAdmin.from('stability_snapshots').insert({
            user_id: userId,
            window_days: windowDays,
            node_stability: nodeStability,
            edge_stability: edgeStability,
            metadata: { mapsCount: maps.length, pulsesCount: pulses?.length || 0 }
        });

    } catch (err) {
        logger.error("Stability Engine Error:", err);
    }
}

function calculateVariance(values: number[]) {
    if (values.length < 2) return 0;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const sqDiffs = values.map(v => Math.pow(v - mean, 2));
    return sqDiffs.reduce((s, v) => s + v, 0) / values.length;
}
