/**
 * Gamification Engine — محرك التلعيب 🎮
 * ==========================================
 * يحول السلوكيات الإيجابية (الصدق، الانضباط) إلى نقاط خبرة (XP) ورتب عسكرية.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Rank = "Scout" | "Vanguard" | "Captain" | "Commander" | "Warlord";

export interface GamificationState {
    xp: number;
    level: number;
    rank: Rank;
    badges: string[]; // badge IDs
    actionsHistory: Record<string, number>; // actionId -> count
    addXP: (amount: number, reason: string) => void;
    unlockBadge: (badgeId: string) => void;
}

export const XP_TABLE = {
    LEVEL_1: 0,    // Scout
    LEVEL_2: 100,  // Vanguard
    LEVEL_3: 300,  // Captain
    LEVEL_4: 600,  // Commander
    LEVEL_5: 1000  // Warlord
};

export const XP_ACTIONS = {
    MIRROR_CONFRONT: 50,  // أكبر مكافأة: الشجاعة في مواجهة الحقيقة
    STREAK_MAINTAIN: 20,  // الانضباط اليومي
    MAP_ORGANIZE: 10,     // الترتيب
    REFLECTION_LOG: 15,   // الكتابة
    ELITE_CHALLENGE_COMPLETE: 250 // عمل استراتيجي خارق
};

const getRank = (xp: number): Rank => {
    if (xp >= XP_TABLE.LEVEL_5) return "Warlord";
    if (xp >= XP_TABLE.LEVEL_4) return "Commander";
    if (xp >= XP_TABLE.LEVEL_3) return "Captain";
    if (xp >= XP_TABLE.LEVEL_2) return "Vanguard";
    return "Scout";
};

export const useGamificationState = create<GamificationState>()(
    persist(
        (set, get) => ({
            xp: 0,
            level: 1,
            rank: "Scout",
            badges: [],
            actionsHistory: {},

            addXP: (amount, reason) => {
                set((state) => {
                    const newXP = state.xp + amount;
                    const newRank = getRank(newXP);

                    if (newRank !== state.rank) {
                        // Level Up Event! (Could trigger sound/toast)
                        console.log(`🎉 Promoted to ${newRank}!`);
                    }

                    return {
                        xp: newXP,
                        rank: newRank,
                        level: Math.floor(newXP / 100) + 1
                    };
                });
            },

            unlockBadge: (badgeId) => {
                set((state) => {
                    if (state.badges.includes(badgeId)) return state;
                    return { badges: [...state.badges, badgeId] };
                });
            }
        }),
        {
            name: "dawayir-gamification-storage"
        }
    )
);
