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
    stressLevel: number; // 0-100 scale from wearable or derived
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
        if (!session?.user?.id || !supabase) return;
        userId = session.user.id;

        // Fetch the latest reading first
        const { data: latest } = await supabase
            .from('user_biometrics')
            .select('heart_rate, hrv, stress_level, timestamp')
            .eq('user_id', userId)
            .order('timestamp', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (latest) {
            callback({
                heartRate: latest.heart_rate,
                hrv: latest.hrv,
                stressLevel: latest.stress_level ?? deriveStressFromHRV(latest.hrv),
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
                    const newPulse = payload.new as { heart_rate: number, hrv: number, stress_level?: number, timestamp: string };
                    callback({
                        heartRate: newPulse.heart_rate,
                        hrv: newPulse.hrv,
                        stressLevel: newPulse.stress_level ?? deriveStressFromHRV(newPulse.hrv),
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
/**
 * يشتق مستوى توتر تقريبي من الـ HRV عندما لا يتوفر stress_level مباشرة.
 * HRV منخفض = توتر عالي. المعادلة مبنية على أبحاث الـ Autonomic Nervous System.
 */
export function deriveStressFromHRV(hrv: number): number {
    if (hrv >= 80) return 15;  // Very relaxed
    if (hrv >= 60) return 30;  // Calm
    if (hrv >= 40) return 55;  // Moderate stress
    if (hrv >= 25) return 75;  // High stress
    return 90;                  // Acute stress
}

export function analyzeStressLevels(pulse: BiometricPulse): {
    isCrisis: boolean;
    stressCategory: 'calm' | 'moderate' | 'high' | 'acute';
    reason?: string;
    action?: string;
} {
    const stress = pulse.stressLevel;

    // Acute: stress > 80 OR (HR > 105 AND HRV < 30)
    if (stress > 80 || (pulse.heartRate > 105 && pulse.hrv < 30)) {
        return {
            isCrisis: true,
            stressCategory: 'acute',
            reason: "قلق حاد مستشعر فيزيولوجياً",
            action: "تفعيل وضع الاحتواء فوراً",
        };
    }

    // High: 60-80
    if (stress > 60) {
        return {
            isCrisis: false,
            stressCategory: 'high',
            reason: "توتر مرتفع — الجهاز العصبي في حالة تأهب",
        };
    }

    // Moderate: 35-60
    if (stress > 35) {
        return {
            isCrisis: false,
            stressCategory: 'moderate',
        };
    }

    // Calm: < 35
    return { isCrisis: false, stressCategory: 'calm' };
}

/** 
 * تسجيل نبضة فسيولوجية جديدة في السحابة (يتم استدعاؤها من الـ Web Bluetooth API لاحقاً)
 */
export async function pushBiometricReading(heartRate: number, hrv: number, stressLevel?: number) {
    if (!supabase) return;
    
    const session = await safeGetSession();
    if (!session?.user?.id || !supabase) return;

    const { error } = await supabase.from('user_biometrics').insert({
        user_id: session.user.id,
        heart_rate: heartRate,
        hrv: hrv,
        stress_level: stressLevel ?? deriveStressFromHRV(hrv),
        source: 'web_client'
    });

    if (error) {
        logger.error('Failed to push biometric reading:', error);
    }
}

