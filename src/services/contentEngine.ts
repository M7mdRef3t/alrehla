/**
 * Content Engine — محرك المحتوى المتكيف 📜
 * ==========================================
 * يختار النصوص (التحية، المهمة اليومية، النصائح) بناءً على حالة المستخدم النفسية.
 * الحالة تأتي من Predictive Engine (Chaos vs Order).
 */

import { UserState } from "./predictiveEngine";

export interface ContentPacket {
    greeting: string;
    missionTitle: string;
    missionDescription: string;
    script?: {
        situation: string;
        doSay: string;
        dontSay: string;
    };
    themeColor: string; // "rose" | "emerald" | "cyan"
}

const CHAOS_CONTENT: ContentPacket[] = [
    {
        greeting: "خلينا نتنفس الأول..",
        missionTitle: "مهمة الاحتواء 🛡️",
        missionDescription: "مفيش قرارات كبيرة النهاردة. مطلوب منك بس 3 دقايق تنفس بعمق.",
        themeColor: "rose",
        script: {
            situation: "لما تحس إن الدنيا زحمة في دماغك",
            dontSay: "لازم أخلص كل حاجة دلوقتي",
            doSay: "هعمل حاجة واحدة صغيرة، والباقي يستنى",
        }
    },
    {
        greeting: "مش لازم تكون بطل طول الوقت.",
        missionTitle: "هدنة مع النفس 🏳️",
        missionDescription: "افصل شوية عن أي نقاشات. النهاردة يومك أنت.",
        themeColor: "rose"
    },
    {
        greeting: "العاصفة هتهدى.",
        missionTitle: "الأرض الثابتة ⚓",
        missionDescription: "اكتب 3 حاجات ممتنة لوجودها في حياتك دلوقتي.",
        themeColor: "rose"
    }
];

const ORDER_CONTENT: ContentPacket[] = [
    {
        greeting: "جاهز للمستوى اللي بعده؟",
        missionTitle: "تحدي النمو 🚀",
        missionDescription: "فيه دايرة صفراء بقالها كتير ما اتراجعتش. خد قرار فيها النهاردة.",
        themeColor: "emerald",
        script: {
            situation: "لما تكون متردد تاخد قرار",
            dontSay: "هستنى الظروف تتحسن",
            doSay: "هاخد القرار دلوقتي وأتحمل نتايجه",
        }
    },
    {
        greeting: "الانضباط هو الحرية.",
        missionTitle: "قوة الرفض 🛡️",
        missionDescription: "قول 'لا' لحاجة واحدة بتضيع وقتك النهاردة.",
        themeColor: "emerald"
    },
    {
        greeting: "الوضوح قوة.",
        missionTitle: "تنظيف الدوائر 🧹",
        missionDescription: "راجع قائمة 'الدوائر الخارجية' واحذف أي حد وجوده مش حقيقي.",
        themeColor: "emerald"
    }
];

const FLOW_CONTENT: ContentPacket[] = [
    {
        greeting: "أنت في حالة تناغم ✨",
        missionTitle: "الحفاظ على الزخم 🌊",
        missionDescription: "ساعد حد تاني النهاردة يحط حدود صحية.",
        themeColor: "cyan"
    },
    {
        greeting: "الهدوء قوة.",
        missionTitle: "التأمل 🧘",
        missionDescription: "استمتع بـ 10 دقايق صمت كامل.",
        themeColor: "cyan"
    }
];

function getRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function getDailyContent(state: UserState): ContentPacket {
    if (state === "CHAOS") {
        return getRandom(CHAOS_CONTENT);
    }
    if (state === "FLOW") {
        return getRandom(FLOW_CONTENT);
    }
    // Default to ORDER
    return getRandom(ORDER_CONTENT);
}
