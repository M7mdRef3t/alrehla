/**
 * Cultural Adapter — المكيّف الثقافي
 * ======================================
 * يكيّف المحتوى والمصطلحات حسب الثقافة.
 * أنماط الحدود تختلف: عائلة عربية ≠ أوروبية.
 */

import { getLanguage, type Language } from "./i18n";

export type CulturalContext = "arabic_family" | "western" | "gulf" | "universal";

export interface CulturalProfile {
    context: CulturalContext;
    /** مصطلحات بديلة للحدود */
    boundaryTerms: {
        boundary: string;
        limit: string;
        space: string;
        no: string;
    };
    /** أمثلة مواقف شائعة */
    commonScenarios: string[];
    /** نبرة مقترحة */
    suggestedTone: string;
}

export const PROFILES: Record<CulturalContext, CulturalProfile> = {
    arabic_family: {
        context: "arabic_family",
        boundaryTerms: {
            boundary: "مساحتي الشخصية",
            limit: "طاقتي",
            space: "وقتي",
            no: "مش قادر دلوقتي",
        },
        commonScenarios: [
            "ضغط الأهل على قرارات شخصية",
            "توقعات العيلة الكبيرة",
            "الشعور بالذنب عند الرفض",
            "الحدود مع الزوج/الزوجة",
            "الضغط الاجتماعي للزواج",
        ],
        suggestedTone: "دافئ ومتفهم للسياق العائلي",
    },
    gulf: {
        context: "gulf",
        boundaryTerms: {
            boundary: "حدودي",
            limit: "طاقتي",
            space: "وقتي الخاص",
            no: "ما أقدر الحين",
        },
        commonScenarios: [
            "ضغط العمل والمدير",
            "توقعات القبيلة والعائلة",
            "الحدود في بيئة العمل",
            "الضغط الاجتماعي",
        ],
        suggestedTone: "محترم وواضح مع مراعاة الهرمية",
    },
    western: {
        context: "western",
        boundaryTerms: {
            boundary: "my boundary",
            limit: "my limit",
            space: "my space",
            no: "No, thank you",
        },
        commonScenarios: [
            "Workplace boundaries",
            "Family expectations",
            "Romantic relationship limits",
            "Friend group dynamics",
        ],
        suggestedTone: "Direct and assertive",
    },
    universal: {
        context: "universal",
        boundaryTerms: {
            boundary: "حدودي / my boundary",
            limit: "طاقتي / my limit",
            space: "مساحتي / my space",
            no: "لأ / No",
        },
        commonScenarios: [
            "Relationship dynamics",
            "Work-life balance",
            "Family pressure",
            "Personal space",
        ],
        suggestedTone: "Adaptive and empathetic",
    },
};

const CULTURAL_KEY = "dawayir-cultural-context";

export function saveCulturalContext(context: CulturalContext): void {
    try {
        localStorage.setItem(CULTURAL_KEY, context);
    } catch { /* noop */ }
}

export function getCulturalContext(): CulturalContext {
    try {
        const saved = localStorage.getItem(CULTURAL_KEY) as CulturalContext | null;
        if (saved && PROFILES[saved]) return saved;
    } catch { /* noop */ }
    // Default based on language
    const lang = getLanguage();
    return lang === "ar" ? "arabic_family" : "western";
}

export function getCulturalProfile(): CulturalProfile {
    return PROFILES[getCulturalContext()];
}

/** يُنتج سياق ثقافي لحقنه في System Instruction */
export function buildCulturalContext(): string {
    const profile = getCulturalProfile();
    const lang = getLanguage();

    return `
السياق الثقافي: ${profile.context}
اللغة: ${lang === "ar" ? "العربية" : "English"}
مصطلح "الحدود" في هذا السياق: "${profile.boundaryTerms.boundary}"
النبرة المقترحة: ${profile.suggestedTone}
مواقف شائعة في هذا السياق: ${profile.commonScenarios.slice(0, 3).join("، ")}
`.trim();
}
