import { create } from "zustand";
import { persist } from "zustand/middleware";
import { pushGamificationStats, pushGamificationBadge } from "../services/gamificationSync";

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
    badges: Badge[];
    recentLevelUp: boolean;
    streak: number;
    lastActiveDate: string | null;
    addXP: (amount: number, reason: string) => void;
    awardBadge: (badgeId: string, name: string, description: string, icon: string) => void;
    recordActivity: () => { streakMaintained: boolean; xpLost: number };
    clearLevelUpState: () => void;
    resetAll: () => void;
}

const XP_PER_LEVEL = 1000;

export const useGamificationState = create<GamificationState>()(
    persist(
        (set, get) => ({
            xp: 0,
            level: 1,
            badges: [],
            recentLevelUp: false,
            streak: 0,
            lastActiveDate: null,

            addXP: (amount, reason) => {
                set((state) => {
                    const newXp = Math.max(0, state.xp + amount);
                    const newLevel = Math.max(1, Math.floor(newXp / XP_PER_LEVEL) + 1);
                    const didLevelUp = newLevel > state.level;

                    return {
                        xp: newXp,
                        level: newLevel,
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
                    if (hasBadge) return state; // Already has it

                    badgeAwarded = { id: badgeId, name, description, icon, earnedAt: Date.now() };

                    return {
                        badges: [
                            ...state.badges,
                            badgeAwarded
                        ]
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
                        xpLost = (diffDays - 1) * 10; // 10 XP penalty per completely missed day
                        const newXp = Math.max(0, state.xp - xpLost);
                        const newLevel = Math.max(1, Math.floor(newXp / XP_PER_LEVEL) + 1);
                        streakMaintained = false;

                        return {
                            lastActiveDate: todayStr,
                            streak: 1, // Restart streak
                            xp: newXp,
                            level: newLevel
                        };
                    }

                    return state; // Safety fallback
                });

                if (xpLost > 0 || streakMaintained) {
                    pushGamificationStats().catch(console.error);
                }
                return { streakMaintained, xpLost };
            },

            clearLevelUpState: () => set({ recentLevelUp: false }),

            resetAll: () => set({ xp: 0, level: 1, badges: [], recentLevelUp: false, streak: 0, lastActiveDate: null }),
        }),
        {
            name: "dawayir-gamification-storage",
        }
    )
);
