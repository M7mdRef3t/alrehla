/**
 * Tactical Playbooks — كتيبات المناورة 📖
 * ==========================================
 * خطط عمل محددة لمواقف معقدة.
 */

export interface PlaybookStep {
    id: string;
    title: string;
    description: string;
    isCritical?: boolean;
}

export interface Playbook {
    id: string;
    title: string;
    category: "defense" | "offense" | "recovery";
    intensity: "low" | "medium" | "high";
    description: string;
    steps: PlaybookStep[];
}

export const TACTICAL_PLAYBOOKS: Playbook[] = [
    {
        id: "toxic_boss_neutralization",
        title: "تحييد المدير السام",
        category: "defense",
        intensity: "high",
        description: "خطة لحماية استقرارك النفسي وإنتاجيتك في بيئة عمل معادية.",
        steps: [
            {
                id: "doc_everything",
                title: "التوثيق الرقمي",
                description: "سجل كل التعليمات في إيميلات رسمية. لا تعتمد على الوعود الشفهية."
            },
            {
                id: "grey_rock",
                title: "مناورة الحجر الرمادي",
                description: "كن مملاً وتجنب مشاركة أي تفاصيل شخصية قد تُستخدم ضدك.",
                isCritical: true
            },
            {
                id: "exit_intent",
                title: "تأمين خطة الهروب",
                description: "حدث ملفك الشخصي وابدأ في البحث عن بديل سراً بينما تحافظ على أداء احترافي."
            }
        ]
    },
    {
        id: "narcissistic_detachment",
        title: "فك الارتباط بالنرجسي",
        category: "offense",
        intensity: "high",
        description: "استعادة السيطرة من شخص يتلاعب بمشاعرك لخدمة نفسه.",
        steps: [
            {
                id: "no_contact",
                title: "قطع الإمداد (No Contact)",
                description: "توقف عن إعطاء أي رد فعل (غضب أو حب). النرجسي يتغذى على الانفعالات.",
                isCritical: true
            },
            {
                id: "rebuild_reality",
                title: "إعادة بناء الواقع",
                description: "ابحث عن شهود عيان أو سجلات لتتأكد من ذاكرتك ضد بروتوكول الـ 'Gaslighting'."
            }
        ]
    }
];
