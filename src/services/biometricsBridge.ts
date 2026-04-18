/**
 * Biometrics Bridge — جسر المؤشرات الحيوية 🩺
 * =========================================
 * يتصل بالأجهزة القابلة للارتداء (أو يحاكيها حالياً) لمراقبة نبض القلب والتوتر.
 * يفعّل بروتوكول الطوارئ تلقائياً عند استشعار خطر فيزيولوجي.
 */

export interface BiometricPulse {
    heartRate: number; // BPM
    hrv: number;       // Heart Rate Variability (Stress indicator)
    timestamp: number;
}

/** 
 * يحاكي استقبال بيانات حقيقية. في المستقبل، سيتم استخدام Web Bluetooth API 
 * للربط مع الساعات الذكية.
 */
/** 
 * مراقبة النبض الحالية (محاكاة)
 */
export function startBiometricStream(callback: (pulse: BiometricPulse) => void) {
    // تم تعطيل المحاكاة العشوائية لمنع التدخلات "الوهمية" المزعجة
    return () => {}; 
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
 * حقن بيانات يدوية (للاختبار)
 */
export function injectMockStressEvent() {
    const stressPulse: BiometricPulse = {
        heartRate: 120, // High
        hrv: 15,       // Low (High stress)
        timestamp: Date.now(),
    };
    return stressPulse;
}

