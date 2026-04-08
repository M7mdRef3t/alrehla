import { logger } from "@/services/logger";
import { supabase } from './supabaseClient';
import { PredictiveInsight } from './predictiveEngine';

/**
 * Dispatcher Engine — محرك الإرسال الآلي 🛰️
 * ==========================================
 * يراقب حالة المستخدمين ويقوم بإخطار "الكوتش" عند تجاوز الحدود المسموح بها.
 */
export class DispatcherEngine {
    private static ENTROPY_THRESHOLD = 75;

    /**
     * التحقق من حالة المستخدم وإرسال إشعار للكوتش إذا لزم الأمر
     */
    static async checkAndDispatch(userId: string, insight: PredictiveInsight): Promise<void> {
        if (!supabase) return;

        // 1. Check if entropy exceeds threshold
        if (insight.entropyScore < this.ENTROPY_THRESHOLD) return;

        try {
            // 2. Find the coach linked to this client
            const { data: connection, error: connError } = await supabase
                .from('coach_connections')
                .select('coach_id')
                .eq('client_id', userId)
                .eq('status', 'active')
                .single();

            if (connError || !connection) return;

            // 3. Create the alert
            const alertMessage = this.generateAlertMessage(insight);

            const { error: alertError } = await supabase
                .from('coach_alerts')
                .insert({
                    coach_id: connection.coach_id,
                    client_id: userId,
                    alert_type: insight.state === 'CHAOS' ? 'HIGH_ENTROPY' : 'TRAJECTORY_SHIFT',
                    message: alertMessage,
                    severity: insight.entropyScore >= 90 ? 'critical' : 'high',
                    metadata: {
                        entropy_score: insight.entropyScore,
                        primary_factor: insight.primaryFactor
                    }
                });

            if (alertError) throw alertError;
            console.warn("🛰️ Automated alert dispatched to coach for user:", userId);

        } catch (e) {
            logger.error("Dispatcher failed:", e);
        }
    }

    private static generateAlertMessage(insight: PredictiveInsight): string {
        if (insight.state === 'CHAOS') {
            return `تنبيه: العميل في حالة "فوضى" عالية (${insight.entropyScore}%). العامل الرئيسي: ${insight.primaryFactor}.`;
        }
        return `ملاحظة: هناك ارتفاع ملحوظ في مستوى الإنتروبيا النفسية للعميل.`;
    }

    /**
     * استرجاع التنبيهات الخاصة بالكوتش
     */
    static async getCoachAlerts(coachId: string) {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('coach_alerts')
            .select('*')
            .eq('coach_id', coachId)
            .eq('is_read', false)
            .order('created_at', { ascending: false });

        if (error) return [];
        return data;
    }

    /**
     * تحديد التنبيه كـ "مقروء"
     */
    static async markAsRead(alertId: string) {
        if (!supabase) return;
        await supabase
            .from('coach_alerts')
            .update({ is_read: true })
            .eq('id', alertId);
    }
}

