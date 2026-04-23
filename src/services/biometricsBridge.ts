/**
 * Biometrics Bridge — جسر المؤشرات الحيوية 🩺
 * =========================================
 * يتصل بقاعدة البيانات (Supabase) للاستماع لأي قراءات فسيولوجية جديدة يتم إرسالها من جهاز المستخدم.
 * يفعّل بروتوكول الطوارئ تلقائياً عند استشعار خطر فيزيولوجي.
 */

import { supabase, safeGetSession } from "@/services/supabaseClient";
import { logger } from "@/services/logger";

export interface BiometricPulse {
    heartRate: number; // BPM
    hrv: number;       // Heart Rate Variability (Stress indicator)
    timestamp: number;
}

/** 
 * يتصل بـ Supabase للاستماع لأي قراءات فسيولوجية جديدة، ويسحب أحدث قراءة عند البدء.
 */
export function startBiometricStream(callback: (data: BiometricPulse) => void) {
    if (!supabase) return () => {};

    let subscription: ReturnType<typeof supabase.channel> | null = null;
    let userId: string | null = null;

    const init = async () => {
        const session = await safeGetSession();
        if (!session?.user?.id) return;
        userId = session.user.id;

        // Fetch the latest reading first
        const { data: latest } = await supabase
            .from('user_biometrics')
            .select('heart_rate, hrv, timestamp')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

        if (latest) {
            callback({
                heartRate: latest.heart_rate,
                hrv: latest.hrv,
                timestamp: new Date(latest.timestamp).getTime(),
            });
        }

        // Subscribe to real-time updates
        subscription = supabase
            .channel('public:user_biometrics')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'user_biometrics', filter: `user_id=eq.${userId}` },
                (payload) => {
                    const newPulse = payload.new as { heart_rate: number, hrv: number, timestamp: string };
                    callback({
                        heartRate: newPulse.heart_rate,
                        hrv: newPulse.hrv,
                        timestamp: new Date(newPulse.timestamp).getTime(),
                    });
                }
            )
            .subscribe();
    };

    init();

    return () => {
        if (subscription && supabase) {
            supabase.removeChannel(subscription);
        }
    };
}

/** 
 * منطق اتخاذ القرار التلقائي: هل المستخدم في خطر جسدي؟
 */
export function analyzeStressLevels(pulse: BiometricPulse): {
    isCrisis: boolean;
    reason?: string;
    action?: string;
} {
    // إذا كان النبض عالياً جداً (> 100) والتحايد (HRV) منخفض جداً (< 30)
    // فهذا مؤشر فيزيولوجي قوي على نوبة قلق أو غضب.
    if (pulse.heartRate > 105 && pulse.hrv < 30) {
        return {
            isCrisis: true,
            reason: "قلق حاد مستشعر فيزيولوجياً",
            action: "تفعيل وضع الاحتواء فوراً",
        };
    }

    return { isCrisis: false };
}

/** 
 * تسجيل نبضة فسيولوجية جديدة في السحابة (يتم استدعاؤها من الـ Web Bluetooth API لاحقاً)
 */
export async function pushBiometricReading(heartRate: number, hrv: number) {
    if (!supabase) return;
    
    const session = await safeGetSession();
    if (!session?.user?.id) return;

    const { error } = await supabase.from('user_biometrics').insert({
        user_id: session.user.id,
        heart_rate: heartRate,
        hrv: hrv,
        source: 'web_client'
    });

    if (error) {
        logger.error('Failed to push biometric reading:', error);
    }
}

