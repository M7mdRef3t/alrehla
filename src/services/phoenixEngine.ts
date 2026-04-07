import { logger } from "../services/logger";
import { supabase } from './supabaseClient';
import { AwarenessVector } from './trajectoryEngine';

export interface PioneerReportCard {
    user_id: string;
    email: string;
    sovereignty_score: number;
    event_id: string;
    event_name: string;
    is_insulated: boolean;
    reaction_speed: number;
    cb_resilience: number;
    post_event_growth: number;
    current_se: number;
    current_bi: number;
    current_av: number;
    phoenix_score: number;
    is_aegis_prime: boolean;
}

export interface ResonancePair {
    id: string;
    user_a_id: string;
    user_b_id: string;
    user_a_avatar?: string;
    user_b_avatar?: string;
    user_a_email?: string;
    user_b_email?: string;
    user_a_vector?: Partial<AwarenessVector>;
    user_b_vector?: Partial<AwarenessVector>;
    complementary_axis: string;
    dominant_complementary_axis: string; // Pre-computed for UI
    similarity_score: number;
    status: 'active' | 'completed' | 'expired';
    expires_at: string;
    mission_context: any;
}

export interface PhoenixEventSummary {
    event_id: string;
    event_name: string;
    start_time?: string;
    end_time?: string;
    aegis_prime_timestamp?: string;
    total_pioneers: number;
    insulated_count: number;
    aegis_prime: PioneerReportCard | null;
    mean_phoenix_score: number;
    top_performers: PioneerReportCard[];
    struggling_pioneers: PioneerReportCard[];
    dda_recommendations: DDARecalibration[];
    swarm_vector_shift: {
        before: Partial<AwarenessVector>;
        after: Partial<AwarenessVector>;
    };
    impact_timeline: Array<{
        timestamp: string;
        avg_se: number;
        insulated_percentage: number;
    }>;
    entanglement_links: ResonancePair[];
}

export interface DDARecalibration {
    user_id: string;
    current_dda: number;
    recommended_dda: number;
    reason: string;
}

export class PhoenixEngine {
    /**
     * Post-Impact Analysis: Generates a complete event summary from the Pioneer Report Card view.
     * This is the "Black Box" reader — it turns raw event data into actionable intelligence.
     */
    static async analyzeImpact(eventId?: string): Promise<PhoenixEventSummary | null> {
        if (!supabase) return null;

        // 1. Fetch all pioneer report cards for the latest (or specified) event
        const query = supabase.from('pioneer_report_card').select('*');
        if (eventId) query.eq('event_id', eventId);

        const { data: cards, error } = await query;
        if (error || !cards || cards.length === 0) {
            logger.error("❌ [PhoenixEngine] No report card data found:", error);
            return null;
        }

        const typedCards = cards as PioneerReportCard[];

        // 2. Compute summary metrics
        const insulated = typedCards.filter(c => c.is_insulated);
        const aegisPrime = typedCards.find(c => c.is_aegis_prime) || null;
        const meanScore = typedCards.reduce((sum, c) => sum + c.phoenix_score, 0) / typedCards.length;

        // 3. Sort by Phoenix Score
        const sorted = [...typedCards].sort((a, b) => b.phoenix_score - a.phoenix_score);
        const topPerformers = sorted.slice(0, 3);
        const struggling = sorted.slice(-3).reverse();

        // 4. Generate DDA Recalibration recommendations
        const dda_recommendations = typedCards.map(card => {
            let recommendedDelta = 0;
            let reason = '';

            if (card.phoenix_score > 0.8) {
                recommendedDelta = 1;
                reason = 'Thrived under pressure. Increasing challenge to prevent complacency.';
            } else if (card.phoenix_score < 0.3) {
                recommendedDelta = -1;
                reason = 'Struggled significantly. Reducing pressure to prevent spiral.';
            } else if (card.is_insulated) {
                recommendedDelta = 0;
                reason = 'Solved the riddle. Adaptability proven. Maintaining current level.';
            } else {
                recommendedDelta = 0;
                reason = 'Average performance. No change needed.';
            }

            return {
                user_id: card.user_id,
                current_dda: 3, // Default, real value fetched from trajectory
                recommended_dda: Math.max(1, Math.min(5, 3 + recommendedDelta)),
                reason
            } as DDARecalibration;
        });

        // 5. Compute swarm vector shift (aggregate before/after)
        const avgSE = typedCards.reduce((s, c) => s + (c.current_se || 0), 0) / typedCards.length;
        const avgBI = typedCards.reduce((s, c) => s + (c.current_bi || 0), 0) / typedCards.length;
        const avgAV = typedCards.reduce((s, c) => s + (c.current_av || 0), 0) / typedCards.length;

        // 6. Fetch Impact Timeline (Micro-batched SE data)
        const event = typedCards[0];
        const { data: timelineData } = await supabase
            .from('system_telemetry_logs')
            .select('created_at, payload')
            .eq('service_name', 'awareness-worker')
            .gte('created_at', new Date(Date.now() - 3600000 * 6).toISOString()); // Last 6h for now

        const impactTimeline = (timelineData || []).map(log => ({
            timestamp: log.created_at,
            avg_se: log.payload?.avg_se || 0.5,
            insulated_percentage: log.payload?.insulated_ratio || 0
        })).sort((a, b) => a.timestamp.localeCompare(b.timestamp));

        // 7. Fetch Entanglement Links for the event
        const { data: rawPairs } = await supabase
            .from('resonance_pairs')
            .select(`
                *,
                user_a:profiles!user_a_id(email, awareness_vector, avatar_url),
                user_b:profiles!user_b_id(email, awareness_vector, avatar_url)
            `)
            .eq('event_id', event.event_id);

        const entanglementLinks = (rawPairs || []).map(p => ({
            ...p,
            user_a_email: (p.user_a as any)?.email,
            user_b_email: (p.user_b as any)?.email,
            user_a_vector: (p.user_a as any)?.awareness_vector,
            user_b_vector: (p.user_b as any)?.awareness_vector,
            dominant_complementary_axis: `${p.complementary_axis}_COMPLEMENT`
        })) as ResonancePair[];

        // 8. Batch Update Ascension Metrics + DDA recalibration inside DB
        const recalibrationPayload = typedCards.map((card) => {
            let swarmImpact = 0;
            const pair = entanglementLinks.find(p => p.user_a_id === card.user_id || p.user_b_id === card.user_id);
            if (pair) {
                const partnerId = pair.user_a_id === card.user_id ? pair.user_b_id : pair.user_a_id;
                const partnerCard = typedCards.find(c => c.user_id === partnerId);
                if (partnerCard) {
                    swarmImpact = partnerCard.post_event_growth;
                }
            }
            const recommendation = dda_recommendations.find((rec) => rec.user_id === card.user_id);
            return {
                user_id: card.user_id,
                phoenix_score: card.phoenix_score,
                swarm_impact: swarmImpact,
                recommended_dda: recommendation?.recommended_dda ?? null,
                reason: recommendation?.reason ?? null
            };
        });

        const { error: batchError } = await supabase.rpc('apply_phoenix_recalibration_batch', {
            p_event_id: event.event_id,
            p_entries: recalibrationPayload
        });
        if (batchError) {
            logger.error("❌ [PhoenixEngine] Batch recalibration failed:", batchError);
        }

        return {
            event_id: event.event_id,
            event_name: event.event_name,
            total_pioneers: typedCards.length,
            insulated_count: insulated.length,
            aegis_prime: aegisPrime,
            mean_phoenix_score: Math.round(meanScore * 1000) / 1000,
            top_performers: topPerformers,
            struggling_pioneers: struggling,
            dda_recommendations,
            swarm_vector_shift: {
                before: { se: 0.5, bi: 0.5, av: 0.5 },
                after: { se: avgSE, bi: avgBI, av: avgAV }
            },
            impact_timeline: impactTimeline,
            entanglement_links: entanglementLinks
        };
    }

    /**
     * Synchronicity Pairing: Finds and creates an Ephemeral Entanglement between
     * two pioneers with complementary weakness vectors.
     * TTL: 24 hours from creation (one mission cycle).
     */
    static async createResonancePair(userId: string, eventId?: string): Promise<ResonancePair | null> {
        if (!supabase) return null;

        // 1. Check if user is already in an active pair
        const { data: existingPair } = await supabase
            .from('resonance_pairs')
            .select('*')
            .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
            .eq('status', 'active')
            .single();

        if (existingPair) {
            console.log(`🔗 [PhoenixEngine] User ${userId} already in active Resonance Pair.`);
            return existingPair as ResonancePair;
        }

        // 2. Find the most complementary partner via RPC
        const { data: partner, error: rpcError } = await supabase
            .rpc('find_resonance_partner', { p_user_id: userId });

        if (rpcError || !partner || partner.length === 0) {
            console.warn("⚠️ [PhoenixEngine] No complementary partner found:", rpcError);
            return null;
        }

        const match = partner[0];

        // 3. Create the Ephemeral Entanglement (TTL: 24 hours)
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        const { data: pair, error: insertError } = await supabase
            .from('resonance_pairs')
            .insert({
                user_a_id: userId,
                user_b_id: match.partner_id,
                event_id: eventId || null,
                complementary_axis: match.weakness_axis,
                similarity_score: match.complementary_score,
                expires_at: expiresAt,
                mission_context: {
                    axis: match.weakness_axis,
                    type: 'synchronicity_mission',
                    description: `Dual-vector mission targeting ${match.weakness_axis} complementarity.`
                }
            })
            .select()
            .single();

        if (insertError) {
            logger.error("❌ [PhoenixEngine] Failed to create Resonance Pair:", insertError);
            return null;
        }

        console.log(`✨ [PhoenixEngine] Resonance Pair created: ${userId} ↔ ${match.partner_id} (Axis: ${match.weakness_axis}, Score: ${match.complementary_score.toFixed(3)})`);
        return pair as ResonancePair;
    }

    /**
     * TTL Enforcer: Expires any pairings that have exceeded their time limit.
     * Should be called periodically (e.g., every hour via cron or before pairing logic).
     */
    static async expireStaleEntanglements(): Promise<number> {
        if (!supabase) return 0;

        const { data, error } = await supabase
            .from('resonance_pairs')
            .update({ status: 'expired' })
            .eq('status', 'active')
            .lt('expires_at', new Date().toISOString())
            .select('id');

        if (error) {
            logger.error("❌ [PhoenixEngine] Failed to expire entanglements:", error);
            return 0;
        }

        const count = data?.length || 0;
        if (count > 0) {
            console.log(`🕊️ [PhoenixEngine] Expired ${count} stale Resonance Pairs (Ephemeral Entanglement TTL).`);
        }
        return count;
    }

    /**
     * DDA Recalibrator: Applies the Phoenix Score-based recommendations
     * to the user's next journey baseline.
     */
    static async applyDDARecalibration(recommendations: DDARecalibration[]): Promise<void> {
        if (!supabase) return;

        for (const rec of recommendations) {
            if (rec.current_dda === rec.recommended_dda) continue;

            // Log the recalibration decision
            await supabase.from('system_telemetry_logs').insert({
                service_name: 'phoenix-engine',
                action: 'dda_recalibration',
                payload: {
                    user_id: rec.user_id,
                    from_dda: rec.current_dda,
                    to_dda: rec.recommended_dda,
                    reason: rec.reason
                }
            });

            console.log(`⚙️ [PhoenixEngine] DDA Recalibrated for ${rec.user_id}: ${rec.current_dda} → ${rec.recommended_dda} (${rec.reason})`);
        }
    }
}
