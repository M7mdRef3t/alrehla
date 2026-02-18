/**
 * Quick Path Service — المسار السريع
 * ====================================
 * يتيح للمستخدم الحصول على جملة خروج فورية بدون الحاجة لرسم خريطة كاملة.
 * مثالي لمن في أزمة ويحتاج إجراء فوري.
 */

import { geminiClient } from "./geminiClient";

const getFromLocalStorage = (key: string): string | null => {
    try { return localStorage.getItem(key); } catch { return null; }
};
const setInLocalStorage = (key: string, value: string): void => {
    try { localStorage.setItem(key, value); } catch { /* noop */ }
};

const QUICK_PATH_HISTORY_KEY = "dawayir-quick-path-history";
const MAX_HISTORY = 10;

export type QuickPathSituation =
    | "pressure"    // ضغط من شخص
    | "guilt"       // إحساس بالذنب
    | "anger"       // غضب
    | "overwhelmed" // إرهاق
    | "boundary"    // محتاج أقول لأ
    | "escape";     // محتاج أخرج من موقف

export interface QuickPathResult {
    exitPhrase: string;        // جملة الخروج الرئيسية
    breathingCue: string;      // تذكير التنفس
    followUpAction: string;    // خطوة تالية اختيارية
    situation: QuickPathSituation;
    timestamp: number;
}

export interface QuickPathHistoryEntry {
    situation: QuickPathSituation;
    exitPhrase: string;
    timestamp: number;
}

/* ── Static fallback phrases (no AI needed) ── */
const STATIC_PHRASES: Record<QuickPathSituation, QuickPathResult> = {
    pressure: {
        exitPhrase: "\"محتاج وقت أفكر — هرد عليك بعدين\"",
        breathingCue: "خد نفس عميق من البطن. 4 ثواني دخول، 6 ثواني خروج.",
        followUpAction: "ابعد عن الموقف جسدياً لو ممكن — حتى خطوتين كافيين.",
        situation: "pressure",
        timestamp: Date.now(),
    },
    guilt: {
        exitPhrase: "\"أنا بحاول أعمل اللي أقدر عليه — ده مش أنانية\"",
        breathingCue: "ضع يدك على صدرك. حس بدقات قلبك. أنت هنا.",
        followUpAction: "اكتب جملة واحدة: \"أنا مش مسؤول عن...\"",
        situation: "guilt",
        timestamp: Date.now(),
    },
    anger: {
        exitPhrase: "\"مش هقدر أكمل الكلام دلوقتي — محتاج أهدى\"",
        breathingCue: "عد من 10 لـ 1 ببطء. كل رقم = نفس.",
        followUpAction: "اشرب ماية. الجسم بيحتاج يبرد قبل العقل.",
        situation: "anger",
        timestamp: Date.now(),
    },
    overwhelmed: {
        exitPhrase: "\"أنا مش في الوضع المناسب دلوقتي — نتكلم بعدين\"",
        breathingCue: "5-4-3-2-1: شوف 5 حاجات، اسمع 4، حس بـ 3، اشم 2، دوق 1.",
        followUpAction: "قلل الضوضاء — صامت التليفون، أغلق تاب واحد.",
        situation: "overwhelmed",
        timestamp: Date.now(),
    },
    boundary: {
        exitPhrase: "\"لأ، مش هقدر — شكراً لفهمك\"",
        breathingCue: "الـ \"لأ\" مش محتاج تبرير. نفس واحد كافي.",
        followUpAction: "لو حسيت بالذنب — طبيعي. الإحساس ده مش دليل إنك غلطان.",
        situation: "boundary",
        timestamp: Date.now(),
    },
    escape: {
        exitPhrase: "\"معذرة، محتاج أمشي دلوقتي\"",
        breathingCue: "امشي بخطوات واضحة. الجسم بيعرف الطريق.",
        followUpAction: "لما تبعد — اكتب كلمة واحدة بتوصف إحساسك.",
        situation: "escape",
        timestamp: Date.now(),
    },
};

/* ── AI-enhanced phrase generation ── */
export async function generateQuickPath(
    situation: QuickPathSituation,
    context?: string
): Promise<QuickPathResult> {
    const staticResult = { ...STATIC_PHRASES[situation], timestamp: Date.now() };

    // If no context or AI unavailable, return static
    if (!context || !geminiClient.isAvailable()) {
        saveToHistory(staticResult);
        return staticResult;
    }

    const situationLabels: Record<QuickPathSituation, string> = {
        pressure: "ضغط من شخص",
        guilt: "إحساس بالذنب",
        anger: "غضب",
        overwhelmed: "إرهاق وضغط",
        boundary: "محتاج أقول لأ",
        escape: "محتاج أخرج من موقف",
    };

    const prompt = `
أنت جارفيس (Jarvis)، المستشار التكتيكي. المستخدم في موقف صعب الآن ويحتاج مساعدة فورية.

الموقف: ${situationLabels[situation]}
السياق: "${context}"

اكتب جملة خروج واحدة فقط (بالعامية المصرية) تناسب هذا الموقف بالضبط.
الجملة يجب أن:
- تكون قصيرة (أقل من 15 كلمة)
- تحفظ كرامة المستخدم
- لا تحتاج تبرير
- تفتح باب للخروج بدون صراع

رد بـ JSON فقط:
{
  "exitPhrase": "الجملة بين علامات تنصيص",
  "breathingCue": "تذكير تنفس قصير (جملة واحدة)",
  "followUpAction": "خطوة تالية اختيارية (جملة واحدة)"
}
`;

    try {
        const result = await geminiClient.generateJSON<{
            exitPhrase: string;
            breathingCue: string;
            followUpAction: string;
        }>(prompt);

        if (result?.exitPhrase) {
            const enhanced: QuickPathResult = {
                ...result,
                situation,
                timestamp: Date.now(),
            };
            saveToHistory(enhanced);
            return enhanced;
        }
    } catch {
        // Fallback to static
    }

    saveToHistory(staticResult);
    return staticResult;
}

/* ── History management ── */
function saveToHistory(result: QuickPathResult): void {
    const entry: QuickPathHistoryEntry = {
        situation: result.situation,
        exitPhrase: result.exitPhrase,
        timestamp: result.timestamp,
    };

    const raw = getFromLocalStorage(QUICK_PATH_HISTORY_KEY);
    const history: QuickPathHistoryEntry[] = raw ? JSON.parse(raw) : [];
    const updated = [entry, ...history].slice(0, MAX_HISTORY);
    setInLocalStorage(QUICK_PATH_HISTORY_KEY, JSON.stringify(updated));
}

export function getQuickPathHistory(): QuickPathHistoryEntry[] {
    const raw = getFromLocalStorage(QUICK_PATH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
}

export const SITUATION_LABELS: Record<QuickPathSituation, string> = {
    pressure: "ضغط من شخص",
    guilt: "إحساس بالذنب",
    anger: "غضب",
    overwhelmed: "إرهاق",
    boundary: "محتاج أقول لأ",
    escape: "محتاج أخرج",
};

export const SITUATION_ICONS: Record<QuickPathSituation, string> = {
    pressure: "⚡",
    guilt: "💭",
    anger: "🔥",
    overwhelmed: "🌊",
    boundary: "🛡️",
    escape: "🚪",
};
