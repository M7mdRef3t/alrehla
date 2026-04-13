import { create } from "zustand";
import { persist } from "zustand/middleware";
import { pushGamificationStats, pushGamificationBadge } from "@/services/gamificationSync";
import { generateChronicle, ChronicleEntry } from "@/services/chroniclesEngine";

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

const getRequiredXPForLevel = (level: number) => 200 + (Math.max(0, level - 1) * 50);

const getTotalXPToReachLevel = (level: number) => {
    let totals = 0;
    for (let i = 1; i < level; i++) {
        totals += getRequiredXPForLevel(i);
    }
    return totals;
};

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    earnedAt: number;
}

export interface PurchaseFeedback {
    title: string;
    message: string;
    itemId: string;
}

// ─── Freeze Stats ─────────────────────────────────────
export interface FreezeStats {
    totalFreezes: number;
    totalUnfreezes: number;
    boundariesSet: number;
    patternsDetected: number;
    weeklyFreezes: number;
    lastFreezeDate: string | null;
    activeComboCount: number; // تجميدات متتالية في أسبوع → مضاعف
}

const DEFAULT_FREEZE_STATS: FreezeStats = {
    totalFreezes: 0,
    totalUnfreezes: 0,
    boundariesSet: 0,
    patternsDetected: 0,
    weeklyFreezes: 0,
    lastFreezeDate: null,
    activeComboCount: 0,
};

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
    
    // Store State
    purchasedItemIds: string[];
    activeThemeId: string | null;
    activeVoiceId: string | null;
    lastPurchaseFeedback: PurchaseFeedback | null;

    // Sovereign Chronicles
    chronicles: ChronicleEntry[];
    lastNewChronicle: ChronicleEntry | null;

    // Soft currency
    coins: number;

    // ❄️ Tajmeed: Frost Points — العملة السيادية للتجميد
    frostPoints: number;
    freezeStats: FreezeStats;
    seasonId: string;
    seasonXP: number;

    // Currency Methods
    addCoins: (amount: number, reason: string) => void;
    spendCoins: (amount: number) => boolean;

    // ❄️ Frost Points Methods
    addFrostPoints: (amount: number, reason: string) => void;
    spendFrostPoints: (amount: number) => boolean;
    recordFreeze: (nodeId: string) => number; // returns FP earned
    recordUnfreeze: (nodeId: string) => number;
    recordBoundarySet: () => number;
    recordPatternDetected: () => number;

    addXP: (amount: number, reason: string) => void;
    awardBadge: (badgeId: string, name: string, description: string, icon: string) => void;
    recordActivity: () => { streakMaintained: boolean; xpLost: number };
    clearLevelUpState: () => void;
    clearChronicleState: () => void;
    
    // Store Methods
    purchaseItem: (itemId: string, price: number, feedback?: PurchaseFeedback) => boolean;
    clearPurchaseFeedback: () => void;
    setActiveTheme: (themeId: string | null) => void;
    setActiveVoice: (voiceId: string | null) => void;

    // Daily Quests Methods
    checkAndResetQuests: () => void;
    completeDailyQuest: (questId: string, actionKey: string, xpReward: number) => void;

    // Computed Progress
    getLevelProgress: () => { progress: number; nextLevelXP: number; xpInCurrent: number; requiredForLevel: number };

    resetAll: () => void;
}

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
            coins: 500,
            purchasedItemIds: [],
            activeThemeId: null,
            activeVoiceId: null,
            lastPurchaseFeedback: null,
            chronicles: [],
            lastNewChronicle: null,

            // ❄️ Tajmeed defaults
            frostPoints: 0,
            freezeStats: { ...DEFAULT_FREEZE_STATS },
            seasonId: 'season_1',
            seasonXP: 0,

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

            // ❄️ Frost Points Methods
            addFrostPoints: (amount, _reason) => {
                set((state) => ({
                    frostPoints: state.frostPoints + amount,
                    seasonXP: state.seasonXP + amount,
                }));
            },

            spendFrostPoints: (amount) => {
                let success = false;
                set((state) => {
                    if (state.frostPoints >= amount) {
                        success = true;
                        return { frostPoints: state.frostPoints - amount };
                    }
                    return state;
                });
                return success;
            },

            recordFreeze: (_nodeId) => {
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                const todayStr = now.toISOString();

                let fpEarned = 50; // Base Frost Points for a freeze
                
                set((state) => {
                    const stats = { ...state.freezeStats };
                    stats.totalFreezes += 1;
                    stats.lastFreezeDate = todayStr;

                    // Combo system: freezes in same week
                    const lastFreeze = state.freezeStats.lastFreezeDate;
                    if (lastFreeze) {
                        const daysSinceLast = Math.floor(
                            (now.getTime() - new Date(lastFreeze).getTime()) / (1000 * 3600 * 24)
                        );
                        if (daysSinceLast <= 7) {
                            stats.weeklyFreezes += 1;
                            stats.activeComboCount += 1;
                        } else {
                            stats.weeklyFreezes = 1;
                            stats.activeComboCount = 1;
                        }
                    } else {
                        stats.weeklyFreezes = 1;
                        stats.activeComboCount = 1;
                    }

                    // Combo bonus: ×2 after 3 freezes in a week
                    if (stats.activeComboCount >= 3) {
                        fpEarned = fpEarned * 2;
                    }

                    return {
                        freezeStats: stats,
                        frostPoints: state.frostPoints + fpEarned,
                        seasonXP: state.seasonXP + fpEarned,
                    };
                });

                // Also award XP
                get().addXP(60, 'تجميد علاقة مستنزفة ❄️');
                return fpEarned;
            },

            recordUnfreeze: (_nodeId) => {
                const fpEarned = 30;
                set((state) => ({
                    freezeStats: {
                        ...state.freezeStats,
                        totalUnfreezes: state.freezeStats.totalUnfreezes + 1,
                    },
                    frostPoints: state.frostPoints + fpEarned,
                    seasonXP: state.seasonXP + fpEarned,
                }));
                get().addXP(40, 'ذوبان واعي — إعادة علاقة 🌊');
                return fpEarned;
            },

            recordBoundarySet: () => {
                const fpEarned = 30;
                set((state) => ({
                    freezeStats: {
                        ...state.freezeStats,
                        boundariesSet: state.freezeStats.boundariesSet + 1,
                    },
                    frostPoints: state.frostPoints + fpEarned,
                    seasonXP: state.seasonXP + fpEarned,
                }));
                get().addXP(30, 'وضع حدود سيادية 🛡️');
                return fpEarned;
            },

            recordPatternDetected: () => {
                const fpEarned = 20;
                set((state) => ({
                    freezeStats: {
                        ...state.freezeStats,
                        patternsDetected: state.freezeStats.patternsDetected + 1,
                    },
                    frostPoints: state.frostPoints + fpEarned,
                    seasonXP: state.seasonXP + fpEarned,
                }));
                get().addXP(20, 'رصد نمط مكرر 👁️');
                return fpEarned;
            },

            addXP: (amount, _reason) => {
                set((state) => {
                    const newXP = Math.max(0, state.xp + amount);
                    
                    let currentLevel = 1;
                    while (newXP >= getTotalXPToReachLevel(currentLevel + 1)) {
                        currentLevel++;
                    }

                    const didLevelUp = currentLevel > state.level;
                    const newRank = getRankByLevel(currentLevel);

                    let newChronicle: ChronicleEntry | null = null;
                    let updatedChronicles = state.chronicles;

                    if (didLevelUp) {
                        newChronicle = generateChronicle(currentLevel, newRank);
                        updatedChronicles = [newChronicle, ...state.chronicles];
                    }

                    return {
                        xp: newXP,
                        level: currentLevel,
                        rank: newRank,
                        recentLevelUp: state.recentLevelUp || didLevelUp,
                        chronicles: updatedChronicles,
                        lastNewChronicle: newChronicle || state.lastNewChronicle
                    };
                });

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
                    if (!state.lastActiveDate) {
                        return { lastActiveDate: todayStr, streak: 1 };
                    }
                    if (state.lastActiveDate === todayStr) {
                        return state;
                    }

                    const lastActive = new Date(state.lastActiveDate);
                    const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 3600 * 24));

                    if (diffDays === 1) {
                        streakMaintained = true;
                        const newStreak = state.streak + 1;
                        
                        // Milestone Bonuses
                        if (newStreak % 7 === 0) {
                            get().addXP(100, `مكافأة استمرار 7 أيام! 🔥`);
                        } else if (newStreak % 30 === 0) {
                            get().addXP(500, `أسطورة الاستمرار 30 يوم! 👑`);
                        }

                        return { lastActiveDate: todayStr, streak: newStreak };
                    } else if (diffDays > 1) {
                        xpLost = (diffDays - 1) * 10;
                        const newXp = Math.max(0, state.xp - xpLost);
                        
                        let currentLevel = 1;
                        while (newXp >= getTotalXPToReachLevel(currentLevel + 1)) {
                            currentLevel++;
                        }

                        streakMaintained = false;

                        return {
                            lastActiveDate: todayStr,
                            streak: 1,
                            xp: newXp,
                            level: currentLevel,
                            rank: getRankByLevel(currentLevel)
                        };
                    }

                    return state;
                });

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
                const currentLevelStartXP = getTotalXPToReachLevel(level);
                const requiredForLevel = getRequiredXPForLevel(level);
                const xpInCurrent = xp - currentLevelStartXP;
                const progress = (xpInCurrent / requiredForLevel) * 100;

                return {
                    progress: Math.min(99, Math.max(0, progress)),
                    nextLevelXP: requiredForLevel - xpInCurrent,
                    xpInCurrent,
                    requiredForLevel
                };
            },

            clearLevelUpState: () => set({ recentLevelUp: false }),
            clearChronicleState: () => set({ lastNewChronicle: null }),

            purchaseItem: (itemId, price, feedback) => {
                const { coins, purchasedItemIds } = get();
                if (coins >= price && !purchasedItemIds.includes(itemId)) {
                    set((state) => ({
                        coins: state.coins - price,
                        purchasedItemIds: [...state.purchasedItemIds, itemId],
                        lastPurchaseFeedback: feedback || null
                    }));
                    return true;
                }
                return false;
            },

            clearPurchaseFeedback: () => set({ lastPurchaseFeedback: null }),

            setActiveTheme: (themeId) => set({ activeThemeId: themeId }),
            setActiveVoice: (voiceId) => set({ activeVoiceId: voiceId }),

            resetAll: () => set({ 
                xp: 0, 
                level: 1, 
                rank: "مستطلع جَدِيد", 
                badges: [], 
                recentLevelUp: false, 
                streak: 0, 
                lastActiveDate: null, 
                dailyCompletedKeys: [], 
                lastQuestDate: null, 
                coins: 500,
                purchasedItemIds: [],
                activeThemeId: null,
                activeVoiceId: null,
                lastPurchaseFeedback: null,
                chronicles: [],
                lastNewChronicle: null,
                frostPoints: 0,
                freezeStats: { ...DEFAULT_FREEZE_STATS },
                seasonId: 'season_1',
                seasonXP: 0,
            }),

        }),
        {
            name: "dawayir-gamification-storage",
        }
    )
);
