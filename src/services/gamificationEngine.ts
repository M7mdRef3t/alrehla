import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Gamification Engine — محرك التلعيب 🎮
 * ==========================================
 * يحول السلوكيات الإيجابية (الصدق، الانضباط) إلى نقاط خبرة (XP) ورتب عسكرية.
 */

export type Rank =
    | "مستطلع جَدِيد"      // Scout
    | "كشاف ميداني"       // Vanguard
    | "ملازم تعافي"       // Lieutenant
    | "نقيب حدود"         // Captain
    | "رائد استقرار"       // Major
    | "عقيد حكمة"         // Colonel
    | "عميد سلام"         // Brigadier
    | "مارشال الدواير";     // Marshal

export interface GamificationState {
    xp: number;
    level: number;
    rank: Rank;
    badges: string[];
    addXP: (amount: number, reason: string) => void;
    getLevelProgress: () => { progress: number; nextLevelXP: number; xpInCurrent: number };
}

const XP_PER_LEVEL = 200;

export const XP_ACTIONS = {
    MIRROR_CONFRONT: 50,
    DAILY_VISIT: 20,
    MAP_SHARED: 50,
    WISDOM_SHARED: 40,
    PULSE_COMPLETED: 30
} as const;

const RANKS: Rank[] = [
    "مستطلع جَدِيد",
    "كشاف ميداني",
    "ملازم تعافي",
    "نقيب حدود",
    "رائد استقرار",
    "عقيد حكمة",
    "عميد سلام",
    "مارشال الدواير"
];

const getRankByLevel = (level: number): Rank => {
    const rankIndex = Math.min(Math.floor((level - 1) / 2), RANKS.length - 1);
    return RANKS[rankIndex];
};

export const useGamificationState = create<GamificationState>()(
    persist(
        (set, get) => ({
            xp: 0,
            level: 1,
            rank: "مستطلع جَدِيد",
            badges: [],

            addXP: (amount, reason) => {
                set((state) => {
                    const newXP = state.xp + amount;
                    const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
                    const newRank = getRankByLevel(newLevel);

                    // Check for automatic badges
                    const newBadges = [...state.badges];
                    if (reason === "mirror_confront" && !newBadges.includes("درع الحقيقة")) {
                        newBadges.push("درع الحقيقة");
                    }
                    if (reason === "map_shared" && !newBadges.includes("القناص")) {
                        newBadges.push("القناص");
                    }
                    if (reason === "pulse_completed" && !newBadges.includes("الكاتم")) {
                        newBadges.push("الكاتم");
                    }

                    return {
                        xp: newXP,
                        level: newLevel,
                        rank: newRank,
                        badges: newBadges
                    };
                });
            },

            getLevelProgress: () => {
                const { xp, level } = get();
                const currentLevelStartXP = (level - 1) * XP_PER_LEVEL;
                const nextLevelStartXP = level * XP_PER_LEVEL;
                const xpInCurrent = xp - currentLevelStartXP;
                const progress = (xpInCurrent / XP_PER_LEVEL) * 100;

                return {
                    progress: Math.min(99, Math.max(0, progress)),
                    nextLevelXP: XP_PER_LEVEL - xpInCurrent,
                    xpInCurrent
                };
            }
        }),
        {
            name: "dawayir-gamification-v2"
        }
    )
);

/**
 * المهام اليومية (Daily Quests)
 */
export interface DailyQuest {
    id: string;
    title: string;
    description: string;
    xpReward: number;
    isCompleted: boolean;
    actionKey: string;
}

export function getDailyQuests(completedKeys: string[] = []): DailyQuest[] {
    return [
        {
            id: "dq_checkin",
            title: "تسجيل حضور",
            description: "ادخل للمنصة وسجل دخولك اليومي",
            xpReward: 20,
            isCompleted: completedKeys.includes("dq_checkin"),
            actionKey: "daily_visit"
        },
        {
            id: "dq_map_share",
            title: "قائد ملهم",
            description: "شارك خريطتك اليوم لتوعية الآخرين",
            xpReward: 50,
            isCompleted: completedKeys.includes("dq_map_share"),
            actionKey: "map_shared"
        },
        {
            id: "dq_wisdom",
            title: "نبع حكمة",
            description: "شارك حكمة واحدة في مجتمع الدعم",
            xpReward: 40,
            isCompleted: completedKeys.includes("dq_wisdom"),
            actionKey: "wisdom_shared"
        }
    ];
}


