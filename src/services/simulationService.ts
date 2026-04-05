import { AIOrchestrator } from './aiOrchestrator';
import { supabase } from './supabaseClient';
import { geminiClient } from './geminiClient';
import { Dream } from '../types/dreams';

export interface SimulationResult {
    scenarioName: string;
    outcomePrediction: {
        successProbability: number;
        estimatedDays: number;
        energyDrain: number;
    };
    impactAnalysis: {
        onRelationships: string;
        onMentalHealth: string;
        onKafaa: string;
    };
    coPilotRecommendation: string;
    criticalWarnings: string[];
}

export class SimulationService {
    /**
     * Runs a Digital Twin simulation for a specific dream.
     */
    static async runDreamSimulation(dream: Dream, userId: string): Promise<SimulationResult | null> {
        if (!supabase) return null;

        try {
            // 1. Get Current Consciousness Snapshot (Supabase Source of Truth)
            const { count: nodesCount } = await supabase
                .from('map_nodes')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            // Fetch recent telemetry for energetic states
            const { data: latestEvents } = await supabase
                .from('telemetry_events')
                .select('payload')
                .eq('user_id', userId)
                .in('event_type', ['first_pulse_submitted', 'shadow_pulse_snapshot', 'baseline_completed'])
                .order('occurred_at', { ascending: false })
                .limit(5);

            let energyLevel = 70; // Honest Zero-State fallback
            let pulseRating = 85; 

            if (latestEvents && latestEvents.length > 0) {
                for (const ev of latestEvents) {
                    if (ev.payload && typeof ev.payload === 'object') {
                        const dict = ev.payload as Record<string, any>;
                        if (dict.teiScore !== undefined) energyLevel = 100 - Number(dict.teiScore);
                        if (dict.shadowScore !== undefined) pulseRating = Number(dict.shadowScore);
                    }
                }
            }

            const stateSnapshot = {
                energy_level: energyLevel,
                pulse_rating: pulseRating,
                nodes_count: nodesCount || 0
            };

            // 2. Resolve AI Route
            const modelId = await AIOrchestrator.getRouteForFeature('predictive_oracle');

            // 3. Construct Simulation Prompt (First Principles Logic)
            const prompt = `
        بصفتك System Architect لـ "الرحلة"، قم بمحاكاة تحقيق الحلم التالي:
        الحلم: ${dream.title}
        الوصف: ${dream.description}
        العقد الحالية (Knots): ${JSON.stringify(dream.knots)}
        حالة المستخدم الحالية: ${JSON.stringify(stateSnapshot)}

        المطلوب تحليل السيناريو الأمثل للكفاءة القصوى وتوقع النتائج بناءً على حالة الوعي (Energy & Pulse & Nodes).
        الرد يجب أن يكون بتنسيق JSON ويحتوي بوضوح على المفاتيح التالية (بدون أي نصوص إضافية):
        - "scenarioName"
        - "outcomePrediction" (يحتوي على key: "successProbability", "estimatedDays", "energyDrain")
        - "impactAnalysis" (يحتوي على key: "onRelationships", "onMentalHealth", "onKafaa")
        - "coPilotRecommendation"
        - "criticalWarnings" (مصفوفة نصوص)
      `;

            // 4. Call AI via Gemini JSON interface
            console.log(`[Simulation] Routing to ${modelId} for dream: ${dream.title}`);
            const result = await geminiClient.generateJSON<SimulationResult>(prompt);

            if (!result) {
                console.error("[Simulation] Initial generation failed completely.");
                return null;
            }

            // 5. Save Simulation to Supabase
            // Since alrehla_simulations is not built, we adhere to the existing Bounded Context via journey_events
            const { error } = await supabase.from('journey_events').insert({
                session_id: userId,
                event_type: 'simulation_run',
                payload: {
                    dream_id: dream.id,
                    scenario_name: result.scenarioName,
                    state_snapshot: stateSnapshot,
                    outcome_prediction: result.outcomePrediction,
                    impact_analysis: result.impactAnalysis,
                    co_pilot_recommendation: result.coPilotRecommendation,
                    critical_warnings: result.criticalWarnings
                }
            });

            if (error) {
                console.warn("[Simulation] Failed to log journey event:", error);
            }

            return result;

        } catch (e) {
            console.error('[Simulation Service] Error:', e);
            return null;
        }
    }
}
