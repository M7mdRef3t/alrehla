/**
 * Domain: Gamification — useGamification hook
 *
 * Hook رئيسي للـ UI — يقرأ من useGamificationState reactively
 * ويوفر actions عبر gamificationService.
 */

"use client";
import { useGamificationState } from "@/domains/gamification/store/gamification.store";
import { gamificationService } from "../services/gamification.service";

export function useGamification() {
  // Reactive state reads
  const xp = useGamificationState((s) => s.xp);
  const level = useGamificationState((s) => s.level);
  const rank = useGamificationState((s) => s.rank);
  const coins = useGamificationState((s) => s.coins);
  const streak = useGamificationState((s) => s.streak);
  const badges = useGamificationState((s) => s.badges);
  const recentLevelUp = useGamificationState((s) => s.recentLevelUp);
  const lastNewChronicle = useGamificationState((s) => s.lastNewChronicle);
  const purchasedItemIds = useGamificationState((s) => s.purchasedItemIds);
  const activeThemeId = useGamificationState((s) => s.activeThemeId);
  const activeVoiceId = useGamificationState((s) => s.activeVoiceId);
  const dailyCompletedKeys = useGamificationState((s) => s.dailyCompletedKeys);

  // Computed
  const getLevelProgress = useGamificationState((s) => s.getLevelProgress);
  const levelProgress = getLevelProgress();

  return {
    // Data
    xp,
    level,
    rank,
    coins,
    streak,
    badges,
    recentLevelUp,
    lastNewChronicle,
    purchasedItemIds,
    activeThemeId,
    activeVoiceId,
    dailyCompletedKeys,
    levelProgress,

    // Actions via service
    addXP: gamificationService.addXP.bind(gamificationService),
    addCoins: gamificationService.addCoins.bind(gamificationService),
    spendCoins: gamificationService.spendCoins.bind(gamificationService),
    awardBadge: gamificationService.awardBadge.bind(gamificationService),
    hasBadge: gamificationService.hasBadge.bind(gamificationService),
    recordActivity: gamificationService.recordActivity.bind(gamificationService),
    purchaseItem: gamificationService.purchaseItem.bind(gamificationService),
    hasItem: gamificationService.hasItem.bind(gamificationService),
    completeDailyQuest: gamificationService.completeDailyQuest.bind(gamificationService),
    checkAndResetQuests: gamificationService.checkAndResetQuests.bind(gamificationService),

    // State passthrough (less common)
    clearLevelUpState: useGamificationState.getState().clearLevelUpState,
    clearChronicleState: useGamificationState.getState().clearChronicleState,
    clearPurchaseFeedback: useGamificationState.getState().clearPurchaseFeedback,
    setActiveTheme: useGamificationState.getState().setActiveTheme,
    setActiveVoice: useGamificationState.getState().setActiveVoice,
  };
}
