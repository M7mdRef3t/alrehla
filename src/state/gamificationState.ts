import { create } from "zustand";
import { persist } from "zustand/middleware";
import { pushGamificationStats, pushGamificationBadge } from "../services/gamificationSync";

export type Rank =
    | "مستطلع جَدِيد"
    | "كشاف ميداني"
    | "ملازم تعافي"
    | "نقيب حدود"
    | "رائد استقرار"
    | "عقيد حكمة"
    | "عميد سلام"
    | "مارشال الدواير";

const RANKS: Rank[] = [
    "مستطلع جَدِيد", "كشاف ميداني", "ملازم تعافي", "نقيب حدود",
    "رائد استقرار", "عقيد حكمة", "عميد سلام", "مارشال الدواير"
];

const getRankByLevel = (level: number): Rank => {
    const rankIndex = Math.min(Math.floor((level - 1) / 2), RANKS.length - 1);
    return RANKS[rankIndex];
};

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: number;
}

interface GamificationState {
    xp: number;
    level: number;
    rank: Rank;
    badges: Badge[];
    recentLevelUp: boolean;
    streak: number;
    lastActiveDate: string | null;
    
    // Daily Quests State
    dailyCompletedKeys: string[];
    lastQuestDate: string | null;

    // Soft currency
    coins: number;
    addCoins: (amount: number, reason: string) => void;
    spendCoins: (amount: number) => boolean;

    addXP: (amount: number, reason: string) => void;
    awardBadge: (badgeId: string, name: string, description: string, icon: string) => void;
    recordActivity: () => { streakMaintained: boolean; xpLost: number };
    clearLevelUpState: () => void;
    
    // Daily Quests Methods
    checkAndResetQuests: () => void;
    completeDailyQuest: (questId: string, actionKey: string, xpReward: number) => void;

    // Computed Progress
    getLevelProgress: () => { progress: number; nextLevelXP: number; xpInCurrent: number };

    resetAll: () => void;
}

const XP_PER_LEVEL = 200; // Adjusted from 1000 to match engine logic

export const useGamificationState = create<GamificationState>()(
    persist(
        (set, get) => ({
            xp: 0,
            level: 1,
            rank: "مستطلع جَدِيد",
            badges: [],
            recentLevelUp: false,
            streak: 0,
            lastActiveDate: null,
            dailyCompletedKeys: [],
            lastQuestDate: null,
            coins: 500, // Initial coins

            addCoins: (amount, _reason) => {
                set((state) => ({ coins: state.coins + amount }));
            },

            spendCoins: (amount) => {
                let success = false;
                set((state) => {
                    if (state.coins >= amount) {
                        success = true;
                        return { coins: state.coins - amount };
                    }
                    return state;
                });
                return success;
            },

            addXP: (amount, _reason) => {
                set((state) => {
                    const newXP = Math.max(0, state.xp + amount);
                    const newLevel = Math.max(1, Math.floor(newXP / XP_PER_LEVEL) + 1);
                    const didLevelUp = newLevel > state.level;
                    const newRank = getRankByLevel(newLevel);

                    return {
                        xp: newXP,
                        level: newLevel,
                        rank: newRank,
                        recentLevelUp: state.recentLevelUp || didLevelUp,
                    };
                });

                // Fire and forget sync to Supabase
                pushGamificationStats().catch(console.error);
            },

            awardBadge: (badgeId, name, description, icon) => {
                let badgeAwarded: Badge | null = null;

                set((state) => {
                    const hasBadge = state.badges.some((b) => b.id === badgeId);
                    if (hasBadge) return state;

                    badgeAwarded = { id: badgeId, name, description, icon, earnedAt: Date.now() };

                    return {
                        badges: [...state.badges, badgeAwarded]
                    };
                });

                if (badgeAwarded) {
                    pushGamificationBadge(badgeAwarded).catch(console.error);
                }
            },

            recordActivity: () => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayStr = today.toISOString();

                let streakMaintained = false;
                let xpLost = 0;

                set((state) => {
                    if (!state.lastActiveDate) { // First time
                        return { lastActiveDate: todayStr, streak: 1 };
                    }
                    if (state.lastActiveDate === todayStr) { // Already active today
                        return state;
                    }

                    const lastActive = new Date(state.lastActiveDate);
                    const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 3600 * 24));

                    if (diffDays === 1) { // Yesterday -> Streak continues
                        streakMaintained = true;
                        return { lastActiveDate: todayStr, streak: state.streak + 1 };
                    } else if (diffDays > 1) { // Broken streak -> Decay applied
                        xpLost = (diffDays - 1) * 10;
                        const newXp = Math.max(0, state.xp - xpLost);
                        const newLevel = Math.max(1, Math.floor(newXp / XP_PER_LEVEL) + 1);
                        streakMaintained = false;

                        return {
                            lastActiveDate: todayStr,
                            streak: 1,
                            xp: newXp,
                            level: newLevel,
                            rank: getRankByLevel(newLevel)
                        };
                    }

                    return state;
                });

                // Also check quests on activity record
                get().checkAndResetQuests();

                if (xpLost > 0 || streakMaintained) {
                    pushGamificationStats().catch(console.error);
                }
                return { streakMaintained, xpLost };
            },

            checkAndResetQuests: () => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayStr = today.toISOString();

                set((state) => {
                    if (state.lastQuestDate !== todayStr) {
                        return {
                            dailyCompletedKeys: [],
                            lastQuestDate: todayStr
                        };
                    }
                    return state;
                });
            },

            completeDailyQuest: (questId, actionKey, xpReward) => {
                get().checkAndResetQuests();
                
                let alreadyCompleted = false;
                set((state) => {
                    if (state.dailyCompletedKeys.includes(questId)) {
                        alreadyCompleted = true;
                        return state;
                    }
                    return {
                        dailyCompletedKeys: [...state.dailyCompletedKeys, questId]
                    };
                });

                if (!alreadyCompleted) {
                    get().addXP(xpReward, `إتمام مهمة: ${actionKey}`);
                }
            },

            getLevelProgress: () => {
                const { xp, level } = get();
                const currentLevelStartXP = (level - 1) * XP_PER_LEVEL;
                const xpInCurrent = xp - currentLevelStartXP;
                const progress = (xpInCurrent / XP_PER_LEVEL) * 100;

                return {
                    progress: Math.min(99, Math.max(0, progress)),
                    nextLevelXP: XP_PER_LEVEL - xpInCurrent,
                    xpInCurrent
                };
            },

            clearLevelUpState: () => set({ recentLevelUp: false }),

            resetAll: () => set({ xp: 0, level: 1, rank: "مستطلع جَدِيد", badges: [], recentLevelUp: false, streak: 0, lastActiveDate: null, dailyCompletedKeys: [], lastQuestDate: null, coins: 500 }),
        }),
        {
            name: "dawayir-gamification-storage",
        }
    )
);
