/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * ❄️ Tajmeed — Freeze Rewards Service
 *
 * ربط أحداث التجميد (archive node, isolate, boundary set)
 * بنظام المكافآت (Frost Points + XP + Achievements)
 *
 * هذا هو Service الأساسي اللي بيربط بين Map events و Gamification engine
 */

import { useGamificationState } from "@/domains/gamification/store/gamification.store";
import { checkFreezeAchievements } from "@/domains/gamification/constants/freezeAchievements";
import { eventBus } from "@/shared/events";

export const freezeRewardsService = {
  /**
   * يُستدعى عند تجميد/أرشفة عقدة على الخريطة
   * مثال: المستخدم قرر يجمّد علاقة مستنزفة
   */
  onNodeFrozen(nodeId: string): { fpEarned: number; newAchievements: string[] } {
    const state = useGamificationState.getState();
    const fpEarned = state.recordFreeze(nodeId);

    // Check for new freeze achievements
    const updated = useGamificationState.getState();
    const newAchievements = this._checkAchievements(updated);

    // Emit event for UI notifications
    if (newAchievements.length > 0) {
      eventBus.emit("tajmeed:achievement-unlocked", {
        achievements: newAchievements,
        trigger: "freeze",
      });
    }

    eventBus.emit("tajmeed:frost-earned", {
      amount: fpEarned,
      reason: "node_frozen",
      nodeId,
    });

    return { fpEarned, newAchievements };
  },

  /**
   * يُستدعى عند إعادة عقدة مجمدة (unarchive)
   */
  onNodeUnfrozen(nodeId: string): { fpEarned: number; newAchievements: string[] } {
    const state = useGamificationState.getState();
    const fpEarned = state.recordUnfreeze(nodeId);

    const updated = useGamificationState.getState();
    const newAchievements = this._checkAchievements(updated);

    if (newAchievements.length > 0) {
      eventBus.emit("tajmeed:achievement-unlocked", {
        achievements: newAchievements,
        trigger: "unfreeze",
      });
    }

    return { fpEarned, newAchievements };
  },

  /**
   * يُستدعى عند وضع حدود (boundary) مع شخص
   */
  onBoundarySet(nodeId: string): { fpEarned: number; newAchievements: string[] } {
    const state = useGamificationState.getState();
    const fpEarned = state.recordBoundarySet();

    const updated = useGamificationState.getState();
    const newAchievements = this._checkAchievements(updated);

    if (newAchievements.length > 0) {
      eventBus.emit("tajmeed:achievement-unlocked", {
        achievements: newAchievements,
        trigger: "boundary",
      });
    }

    return { fpEarned, newAchievements };
  },

  /**
   * يُستدعى عندما AI يرصد نمط علائقي متكرر
   */
  onPatternDetected(patternType: string): { fpEarned: number; newAchievements: string[] } {
    const state = useGamificationState.getState();
    const fpEarned = state.recordPatternDetected();

    const updated = useGamificationState.getState();
    const newAchievements = this._checkAchievements(updated);

    return { fpEarned, newAchievements };
  },

  /**
   * يُستدعى عند تحريك شخص من مدار أحمر إلى أخضر
   */
  onRelationshipMoved(fromRing: string, toRing: string): { fpEarned: number } {
    // مكافأة خاصة لنقل شخص من مدار خطر إلى آمن
    if (fromRing === "red" && (toRing === "green" || toRing === "blue")) {
      const state = useGamificationState.getState();
      state.addFrostPoints(25, "تحسين مدار علائقي 🌈");
      state.addXP(35, "تحسين مدار علائقي 🌈");
      return { fpEarned: 25 };
    }
    return { fpEarned: 0 };
  },

  /**
   * يُستدعى عند استخدام "ذكاء دواير" (Dawayir Intelligence)
   * لتحليل العلاقات بعمق أو استشراف المستقبل
   */
  onIntelligenceDeepDive(): { fpEarned: number } {
    const state = useGamificationState.getState();
    const fpEarned = 50; // مكافأة عالية للوعي العميق
    state.addFrostPoints(fpEarned, "استبصار علائقي عميق 👁️");
    state.addXP(75, "قيادة معرفية");
    
    eventBus.emit("tajmeed:frost-earned", {
      amount: fpEarned,
      reason: "intelligence_deep_dive",
    });

    return { fpEarned };
  },

  /**
   * الحصول على إحصائيات التجميد الشاملة
   */
  getFreezeProfile() {
    const state = useGamificationState.getState();
    return {
      frostPoints: state.frostPoints,
      freezeStats: state.freezeStats,
      seasonId: state.seasonId,
      seasonXP: state.seasonXP,
      comboActive: state.freezeStats.activeComboCount >= 3,
      comboMultiplier: state.freezeStats.activeComboCount >= 3 ? 2 : 1,
    };
  },

  // ─── Internal: Check achievements ──────────────────

  _checkAchievements(state: ReturnType<typeof useGamificationState.getState>): string[] {
    const alreadyUnlocked = state.badges.map((b) => b.id);
    const newlyUnlocked = checkFreezeAchievements(
      state.freezeStats,
      alreadyUnlocked,
      state.streak
    );

    const newIds: string[] = [];
    for (const achievement of newlyUnlocked) {
      state.awardBadge(
        achievement.id,
        achievement.title,
        achievement.description,
        achievement.icon
      );
      state.addFrostPoints(achievement.frostPointsReward, `إنجاز: ${achievement.title}`);
      newIds.push(achievement.id);
    }

    return newIds;
  },
};
