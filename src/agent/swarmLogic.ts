import { PersonaType } from "./personae";
import { AgentContext } from "./types";

/**
 * محرك اختيار الشخصية التلقائي — Automatic Persona Selector 🧠
 * =========================================================
 * يحلل السياق الحالي للمستخدم ويقترح الشخصية الأنسب من السرب.
 */
export function determineAutoPersona(context: AgentContext): PersonaType {
    const { pulse, screen } = context;

    // 1. إذا كان المستخدم في حالة طوارئ أو توتر حاد جداً (Mood: Angry, Overwhelmed)
    if (pulse?.mood === "angry" || pulse?.mood === "overwhelmed" || screen === "emergency") {
        return "COMFORTER";
    }

    // 2. إذا كان المستخدم يمر بمرحلة فوضى (Chaos) أو طاقة منخفضة جداً
    if (pulse && pulse.energy <= 3) {
        return "COMFORTER";
    }

    // 3. إذا كان المستخدم في شاشة "محكمة الشعور بالذنب" أو "الدبلوماسية" أو يتعامل مع أشخاص في مدارات خطرة
    if (screen === "guilt-court" || screen === "diplomacy") {
        return "TACTICIAN";
    }

    // 4. إذا كان المود العام "رايق" أو "هادي" والطاقة متوسطة إلى عالية، ننتقل للحكيم لتحليل الأنماط
    if (pulse?.mood === "bright" || pulse?.mood === "calm" || (pulse && pulse.energy >= 6)) {
        return "STOIC";
    }

    // القيمة الافتراضية
    return "STOIC";
}
