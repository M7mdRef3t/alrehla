/**
 * 🕊️ Reconnection Messages — رسائل إعادة الربط
 * ================================================
 * رسائل تحوّلية تظهر بعد أحداث الصدق مع النفس.
 * كل رسالة مربوطة بنوع الحدث وبتحقق 3 أبعاد:
 * 1. العقل (إدراك) 2. الروح (آية) 3. الجسم (تنفس)
 */

import type { TruthEventType } from "@/services/truthScoreEngine";

export interface ReconnectionMessage {
    /** الرسالة الأساسية — جملة واحدة قوية */
    primary: string;
    /** الدعم — "X مسافر قبلك عملوا ده" */
    solidarity: string;
    /** الآية المرتبطة */
    ayah: string;
    /** مرجع الآية */
    ayahRef: string;
    /** رسالة التنفس */
    breathPrompt: string;
}

const RECONNECTION_POOL: Record<TruthEventType, ReconnectionMessage[]> = {
    confronted_truth: [
        {
            primary: "واجهت الحقيقة. ده مش ضعف — ده أعلى درجات الشجاعة.",
            solidarity: "٢٧٣ مسافر قبلك واجهوا نفس اللحظة دي — ونجوا.",
            ayah: "﴿وَقُلْ جَاءَ الْحَقُّ وَزَهَقَ الْبَاطِلُ ۚ إِنَّ الْبَاطِلَ كَانَ زَهُوقًا﴾",
            ayahRef: "الإسراء: ٨١",
            breathPrompt: "خذ نفس. الحق وصل. الباطل بيتبخر.",
        },
        {
            primary: "اللي شفته دلوقتي — مش هتقدر تنساه. وده بداية الحرية.",
            solidarity: "١٨٧ مسافر مروا بنفس لحظة الكشف دي — وحياتهم اتغيرت.",
            ayah: "﴿فَكَشَفْنَا عَنكَ غِطَاءَكَ فَبَصَرُكَ الْيَوْمَ حَدِيدٌ﴾",
            ayahRef: "ق: ٢٢",
            breathPrompt: "الغطاء اترفع. بصرك دلوقتي أحد. تنفس ده.",
        },
    ],

    hard_decision: [
        {
            primary: "القرار الصعب ده — هو أقوى فعل ممكن تعمله لنفسك.",
            solidarity: "٩٤ مسافر اتخذوا قرار صعب زي ده الأسبوع ده.",
            ayah: "﴿وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ﴾",
            ayahRef: "ق: ١٦",
            breathPrompt: "مش لوحدك. القرب أقرب مما تتخيل. تنفس.",
        },
        {
            primary: "قررت. ومجرد إنك قررت — يعني إنك أقوى مما كنت فاكر.",
            solidarity: "١٢١ مسافر مروا بنفس الألم — واختاروا نفسهم.",
            ayah: "﴿إِنَّ اللَّهَ مَعَ الصَّابِرِينَ﴾",
            ayahRef: "البقرة: ١٥٣",
            breathPrompt: "الصبر مش استسلام. الصبر قوة. خذ نفس عميق.",
        },
    ],

    reciprocity_recorded: [
        {
            primary: "سجلت الحقيقة كما هي. ده صدق مع نفسك.",
            solidarity: "الصدق بيجمّع. في اللحظة دي ناس كتير بتعمل نفس الحاجة.",
            ayah: "﴿يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَكُونُوا مَعَ الصَّادِقِينَ﴾",
            ayahRef: "التوبة: ١١٩",
            breathPrompt: "الصدق طريق. تنفس وكمّل.",
        },
    ],

    bias_acknowledged: [
        {
            primary: "اعترفت بالانحياز. ده وعي حقيقي — مش كلام.",
            solidarity: "٦٧ مسافر اعترفوا بانحيازاتهم الأسبوع ده.",
            ayah: "﴿بَلِ الْإِنسَانُ عَلَىٰ نَفْسِهِ بَصِيرَةٌ﴾",
            ayahRef: "القيامة: ١٤",
            breathPrompt: "البصيرة اشتغلت. دي قوة. تنفس ده.",
        },
    ],

    pulse_consistency: [
        {
            primary: "نبضك منتظم. ده معناه إنك حاضر — مش تايه.",
            solidarity: "النبض المنتظم بيربطك بالكل. إنت جزء من موجة.",
            ayah: "﴿أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ﴾",
            ayahRef: "الرعد: ٢٨",
            breathPrompt: "قلبك مطمئن. ده مش صدفة. ده وعي.",
        },
    ],

    // These are negative events — no reconnection ritual for them
    ignored_truth: [],
    ring_instability: [],
    pulse_gap: [],
};

/**
 * Get a random reconnection message for a given truth event type.
 * Returns null for negative events (no ritual for those).
 */
export function getReconnectionMessage(type: TruthEventType): ReconnectionMessage | null {
    const pool = RECONNECTION_POOL[type];
    if (!pool || pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Check if a truth event type should trigger a reconnection ritual
 */
export function shouldTriggerRitual(type: TruthEventType): boolean {
    return (RECONNECTION_POOL[type]?.length ?? 0) > 0;
}
