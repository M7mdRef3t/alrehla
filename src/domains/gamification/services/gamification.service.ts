/**
 * Domain: Gamification — Core Service
 *
 * Facade فوق useGamificationState — API نظيفة بدون مرور بالـ hook.
 * للاستخدام في services أخرى (لا React context مطلوب).
 */

import { useGamificationState } from "@/domains/gamification/store/gamification.store";
import { eventBus } from "@/shared/events";
import type { GamificationProfile, LevelProgress } from "../types";

export const gamificationService = {
  // ─── Profile ──────────────────────────────────────

  getProfile(): GamificationProfile {
    const s = useGamificationState.getState();
    return {
      xp: s.xp,
      level: s.level,
      rank: s.rank,
      coins: s.coins,
      streak: s.streak,
      badges: s.badges,
      purchasedItemIds: s.purchasedItemIds,
    };
  },

  getLevelProgress(): LevelProgress {
    return useGamificationState.getState().getLevelProgress();
  },

  // ─── XP & Coins ─────────────────────────────────

  addXP(amount: number, reason: string): void {
    const before = useGamificationState.getState().level;
    useGamificationState.getState().addXP(amount, reason);
    const after = useGamificationState.getState().level;

    if (after > before) {
      eventBus.emit("gamification:achievement-unlocked", {
        userId: "",
        achievementId: `level_${after}`,
      });
    }
  },

  addCoins(amount: number, reason: string): void {
    useGamificationState.getState().addCoins(amount, reason);
  },

  spendCoins(amount: number): boolean {
    return useGamificationState.getState().spendCoins(amount);
  },

  // ─── Badges ─────────────────────────────────────

  awardBadge(
    badgeId: string,
    name: string,
    description: string,
    icon: string
  ): void {
    useGamificationState.getState().awardBadge(badgeId, name, description, icon);
    eventBus.emit("gamification:achievement-unlocked", {
      userId: "",
      achievementId: badgeId,
    });
  },

  hasBadge(badgeId: string): boolean {
    return useGamificationState.getState().badges.some((b) => b.id === badgeId);
  },

  // ─── Streak ─────────────────────────────────────

  recordActivity(): { streakMaintained: boolean; xpLost: number } {
    const result = useGamificationState.getState().recordActivity();
    const newStreak = useGamificationState.getState().streak;
    if (newStreak > 1) {
      eventBus.emit("gamification:streak-updated", { userId: "", streak: newStreak });
    }
    return result;
  },

  // ─── Store ──────────────────────────────────────

  purchaseItem(
    itemId: string,
    price: number,
    feedback?: import("@/domains/gamification/store/gamification.store").PurchaseFeedback
  ): boolean {
    return useGamificationState.getState().purchaseItem(itemId, price, feedback);
  },

  hasItem(itemId: string): boolean {
    return useGamificationState.getState().purchasedItemIds.includes(itemId);
  },

  // ─── Daily Quests ────────────────────────────────

  completeDailyQuest(questId: string, actionKey: string, xpReward: number): void {
    useGamificationState.getState().completeDailyQuest(questId, actionKey, xpReward);
  },

  checkAndResetQuests(): void {
    useGamificationState.getState().checkAndResetQuests();
  },

  // ─── Reset ──────────────────────────────────────

  resetAll(): void {
    useGamificationState.getState().resetAll();
  },
};
