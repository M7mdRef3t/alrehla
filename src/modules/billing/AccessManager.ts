import { logger } from "../../services/logger";
import { supabase } from '../../services/supabaseClient';
import { TIER_LIMITS, type PricingTier } from '../../config/pricing';

interface FeatureFlags {
    maxMapNodes: number;
    hasPredictiveEngine: boolean;
    hasAiOracle: boolean;
    hasShadowMemory: boolean;
    hasFacilitatorAssistance: boolean;
}

export interface SubscriptionInfo {
    planId: string;
    status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'none';
    currentPeriodEnd: number | null;
    isPremium: boolean;
    tier: 'free' | 'premium' | 'coach';
    features: FeatureFlags;
}

function tierToFeatures(tier: PricingTier): FeatureFlags {
    const limits = TIER_LIMITS[tier];
    return {
        maxMapNodes: limits.maxMapNodes === -1 ? 999 : limits.maxMapNodes,
        hasPredictiveEngine: limits.hasPredictiveEngine,
        hasAiOracle: limits.hasAiOracle,
        hasShadowMemory: limits.hasShadowMemory,
        hasFacilitatorAssistance: limits.hasFacilitatorAssistance,
    };
}

const FREE_TIER_LIMITS = tierToFeatures('basic');
const PREMIUM_LIMITS = tierToFeatures('premium');
const COACH_LIMITS = tierToFeatures('coach');

/**
 * Access Manager System
 * =====================
 * This service ensures that the user is gate-kept gracefully based on Stripe / DB subscription status.
 */
export class AccessManager {
    static async getSubscriptionStatus(userId: string): Promise<SubscriptionInfo> {
        if (!supabase) return {
            planId: 'free',
            status: 'none',
            currentPeriodEnd: null,
            isPremium: false,
            tier: 'free',
            features: FREE_TIER_LIMITS
        };

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('subscription_status, subscription_price_id, current_period_end, role')
                .eq('id', userId)
                .single();

            if (error || !data) {
                return {
                    planId: 'free',
                    status: 'none',
                    currentPeriodEnd: null,
                    isPremium: false,
                    tier: 'free',
                    features: FREE_TIER_LIMITS
                };
            }

            const status = data.subscription_status || 'none';
            const isPremium = status === 'active' || status === 'trialing' || data.role === 'coach';

            let tier: 'free' | 'premium' | 'coach' = 'free';
            if (data.role === 'coach') tier = 'coach';
            else if (isPremium) tier = 'premium';

            const features = tier === 'coach' ? COACH_LIMITS : (tier === 'premium' ? PREMIUM_LIMITS : FREE_TIER_LIMITS);

            return {
                planId: data.subscription_price_id || 'free',
                status: status as any,
                currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end).getTime() : null,
                isPremium,
                tier,
                features
            };

        } catch (e) {
            logger.error("Access validation failed:", e);
            return {
                planId: 'free',
                status: 'none',
                currentPeriodEnd: null,
                isPremium: false,
                tier: 'free',
                features: FREE_TIER_LIMITS
            };
        }
    }
}
