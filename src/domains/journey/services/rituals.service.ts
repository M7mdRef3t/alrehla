/**
 * Domain: Journey — Rituals Service
 *
 * Facade فوق ritualsEngine.ts
 * يوفر API نظيفة لإدارة العادات اليومية.
 */

import {
  calculateRitualStreak,
  suggestDayTheme,
  generateDailyPlan,
  suggestRituals,
  getTodayRituals,
  getDailyCompletionStats,
  calculateRitualDomainBonus,
  generateQuickActions,
  type RitualStreak,
  type RitualWithStatus,
  type DailyCompletionStats,
  type QuickAction,
} from "@/services/ritualsEngine";
import type {
  DailyRitual,
  RitualLog,
  DailyPlan,
  PresetRitual,
  DayTheme,
} from "@/types/dailyRituals";
import type { LifeScore } from "@/types/lifeDomains";
import type { LifeDomainId } from "@/types/lifeDomains";

// Re-export types needed by consumers
export type {
  RitualStreak,
  RitualWithStatus,
  DailyCompletionStats,
  QuickAction,
};

export const ritualsService = {
  /**
   * حساب streak للعادة
   */
  getStreak(ritualId: string, logs: RitualLog[]): RitualStreak {
    return calculateRitualStreak(ritualId, logs);
  },

  /**
   * اقتراح theme اليوم
   */
  suggestTheme(
    lifeScore: LifeScore | null,
    energyLevel: number | null
  ): DayTheme {
    return suggestDayTheme(lifeScore, energyLevel, new Date().getDay());
  },

  /**
   * توليد خطة اليوم
   */
  generatePlan(
    rituals: DailyRitual[],
    logs: RitualLog[],
    lifeScore: LifeScore | null,
    energyLevel: number | null,
    pendingProblems = 0,
    pendingDecisions = 0
  ): DailyPlan {
    return generateDailyPlan(
      rituals,
      logs,
      lifeScore,
      energyLevel,
      pendingProblems,
      pendingDecisions
    );
  },

  /**
   * اقتراح عادات جديدة بناءً على نتيجة الحياة
   */
  suggestRituals(
    lifeScore: LifeScore | null,
    existingRituals: DailyRitual[]
  ): PresetRitual[] {
    return suggestRituals(lifeScore, existingRituals);
  },

  /**
   * عادات اليوم مع حالتها
   */
  getTodayRituals(
    rituals: DailyRitual[],
    logs: RitualLog[]
  ): RitualWithStatus[] {
    return getTodayRituals(rituals, logs);
  },

  /**
   * إحصاءات الإنجاز اليومي
   */
  getCompletionStats(rituals: RitualWithStatus[]): DailyCompletionStats {
    return getDailyCompletionStats(rituals);
  },

  /**
   * مكافأة الـ domain من العادات (0–15 نقطة لكل domain)
   */
  getDomainBonus(
    rituals: DailyRitual[],
    logs: RitualLog[]
  ): Record<LifeDomainId, number> {
    return calculateRitualDomainBonus(rituals, logs);
  },

  /**
   * الإجراءات السريعة بناءً على السياق
   */
  getQuickActions(
    rituals: RitualWithStatus[],
    plan: DailyPlan | null,
    lifeScore: LifeScore | null,
    hasPulseToday: boolean,
    pendingDecisions: number
  ): QuickAction[] {
    return generateQuickActions(
      rituals,
      plan,
      lifeScore,
      hasPulseToday,
      pendingDecisions
    );
  },
};
