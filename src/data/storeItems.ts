/**
 * Sovereign Store Items — Registry of spendable evolutions
 */

export type StoreCategory = "evolutions" | "sanctuaries" | "identity";

export interface StoreItem {
    id: string;
    name: string;
    description: string;
    price: number;
    category: StoreCategory;
    icon: string;
    color: string;
    // For Themes
    config?: {
        primary?: string;
        background?: string;
        accent?: string;
    };
    /** Resonance Sync: How the app 'feels' when this is active */
    resonance?: {
        pulseDuration: string;
        voiceTone: 'calm' | 'neon' | 'royal' | 'default';
    }
}

export const STORE_ITEMS: StoreItem[] = [
    // 🧬 Evolutions (AI Personas)
    {
        id: "ai_sage",
        name: "الحكيم (The Sage)",
        description: "ذكاء اصطناعي بنبرة هادئة وفلسفية، يركز على الوعي العميق.",
        price: 1000,
        category: "evolutions",
        icon: "🧠",
        color: "#10b981", // emerald
    },
    {
        id: "ai_commander",
        name: "القائد (The Commander)",
        description: "ذكاء اصطناعي حازم ومحفز، يركز على الإنجاز والصلابة.",
        price: 1500,
        category: "evolutions",
        icon: "🎖️",
        color: "#ef4444", // red
    },

    // 🏰 Sanctuaries (Themes)
    {
        id: "theme_emerald",
        name: "واحة الزمرد",
        description: "ثيم هادئ مريح للعين بألوان الخضرة والسكينة.",
        price: 500,
        category: "sanctuaries",
        icon: "🌿",
        color: "#059669",
        config: {
            primary: "#10b981",
            background: "#064e3b"
        },
        resonance: {
            pulseDuration: "4s", // Slow, meditative pulse
            voiceTone: "calm"
        }
    },
    {
        id: "theme_cyber",
        name: "الترسانة الرقمية",
        description: "ثيم النيون والقوة التقنية، للمستخدمين المتقدمين.",
        price: 800,
        category: "sanctuaries",
        icon: "🛰️",
        color: "#8b5cf6",
        config: {
            primary: "#a78bfa",
            background: "#1e1b4b"
        },
        resonance: {
            pulseDuration: "1.5s", // Fast, reactive pulse
            voiceTone: "neon"
        }
    },
    {
        id: "theme_gold",
        name: "الساعة الذهبية",
        description: "ثيم دافئ ومشرق يعبر عن الازدهار والوفرة.",
        price: 600,
        category: "sanctuaries",
        icon: "🌅",
        color: "#d97706",
        config: {
            primary: "#fbbf24",
            background: "#451a03"
        },
        resonance: {
            pulseDuration: "2.5s", // Balanced pulse
            voiceTone: "royal"
        }
    },

    // 🛡️ Identity (Map / Icon Upgrades)
    {
        id: "ring_royal",
        name: "المدار الملكي",
        description: "هالة ذهبية تحيط بأيقونة بروفايلك على الخريطة.",
        price: 300,
        category: "identity",
        icon: "💍",
        color: "#fbbf24",
    },
    {
        id: "glow_neon",
        name: "التوهج النووي",
        description: "تأثير ضوئي مستمر لبروفايلك يعبر عن طاقتك العالية.",
        price: 400,
        category: "identity",
        icon: "☢️",
        color: "#22c55e",
    }
];

export function getStoreItem(id: string): StoreItem | undefined {
    return STORE_ITEMS.find(item => item.id === id);
}
