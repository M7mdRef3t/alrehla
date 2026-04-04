import { supabase } from './supabaseClient';
import { calculateEntropy } from './predictiveEngine';
import { DispatcherEngine } from './dispatcherEngine';

/**
 * Shadow Memory Service — ذاكرة الظل 🌘
 * ==========================================
 * يقوم بتسجيل "لقطات" (Snapshots) لحظية لحالة المستخدم النفسية والخريطة.
 * يُستخدم لتحليل المسار الزمني (Trajectory) وتنبؤ الـ Burnout.
 */
export class ShadowMemory {
    /**
     * تسجيل لقطة إنتروبيا (Snap a psychological state)
     */
    static async recordSnapshot(userId: string): Promise<void> {
        if (!supabase) return;

        const insight = calculateEntropy();

        try {
            const { error } = await supabase
                .from('shadow_snapshots')
                .insert({
                    user_id: userId,
                    entropy_score: insight.entropyScore,
                    state: insight.state,
                    primary_factor: insight.primaryFactor,
                    metadata: {
                        unstable_nodes: insight.unstableNodesData || [],
                        pulse_volatility: insight.pulseVolatility
                    },
                    timestamp: new Date().toISOString()
                });

            if (error) throw error;
            console.warn("🌘 Shadow Snapshot recorded for user:", userId);

            // Trigger Automated Dispatcher
            await DispatcherEngine.checkAndDispatch(userId, insight);
        } catch (e) {
            console.error("Failed to record Shadow Memory:", e);
        }
    }

    /**
     * استرجاع السجل التاريخي (History Retrieval)
     */
    static async getHistory(userId: string, limit: number = 30) {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('shadow_snapshots')
            .select('*')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })
            .limit(limit);

        if (error) return [];
        return data;
    }
}

