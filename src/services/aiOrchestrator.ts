import { supabase } from './supabaseClient';

export interface AIModel {
    model_id: string;
    provider: string;
    cost_per_1m_input: number;
    cost_per_1m_output: number;
    capabilities: string[];
}

export interface RoutingRule {
    feature_name: string;
    primary_model_id: string;
    fallback_model_id: string;
    ai_models_primary?: AIModel;  // Joined data
    ai_models_fallback?: AIModel; // Joined data
}

/**
 * AI Meta-Orchestrator: The Dynamic Router
 * This class decides which model to use based on the real-time configuration in Supabase.
 */
export class AIOrchestrator {
    private static normalizeModelId(modelId: string): string {
        switch (modelId) {
            case 'gemini-1.5-pro':
                return 'gemini-2.5-pro';
            case 'gemini-1.5-flash':
            case 'gemini-2.0-flash':
                return 'gemini-2.5-flash';
            default:
                return modelId;
        }
    }

    /**
     * Resolves the best model to use for a specific feature.
     * Keeps the codebase decoupled from specific model names.
     */
    static async getRouteForFeature(featureName: string): Promise<string> {
        if (!supabase) return 'gemini-2.5-pro'; // Fallback if DB is unreachable

        try {
            const { data, error } = await supabase
                .from('ai_routing_rules')
                .select(`
                    feature_name,
                    primary_model_id,
                    fallback_model_id,
                    ai_models!primary_model_id (is_active)
                `)
                .eq('feature_name', featureName)
                .single();

            if (error || !data) {
                console.warn(`[AI Router] Rule not found for ${featureName}. Defaulting to gemini-2.5-pro`);
                return 'gemini-2.5-pro';
            }

            // Type assertion for Supabase relation result
            const primaryModel = data.ai_models as unknown as { is_active: boolean };

            // Check if the primary model is marked as active and healthy
            if (primaryModel && primaryModel.is_active) {
                return AIOrchestrator.normalizeModelId(data.primary_model_id);
            } else {
                console.warn(`[AI Router] Primary model ${data.primary_model_id} is inactive. Routing to fallback: ${data.fallback_model_id}`);
                return AIOrchestrator.normalizeModelId(data.fallback_model_id);
            }

        } catch (e) {
            console.error('[AI Router] Resolution error:', e);
            return 'gemini-2.5-pro';
        }
    }

    /**
     * Optional: Helper to get the cheapest model available for a certain capability.
     */
    static async getCheapestModelByCapability(capability: string): Promise<string> {
        if (!supabase) return 'gemini-2.5-flash';

        const { data, error } = await supabase
            .from('ai_models')
            .select('*')
            .eq('is_active', true)
            .contains('capabilities', [capability])
            .order('cost_per_1m_output', { ascending: true })
            .limit(1)
            .single();

        if (error || !data) return 'gemini-2.5-flash';
        return AIOrchestrator.normalizeModelId(data.model_id);
    }
}
