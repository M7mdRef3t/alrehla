/**
 * Domain: Gamification — Types
 *
 * يدمج scaffold الموجود مع re-exports من gamificationState.
 */

// ─── Re-exports from state ─────────────────────────────
export type { Rank, Badge, PurchaseFeedback } from "@/domains/gamification/store/gamification.store";

// ─── Re-exports from chronicles ───────────────────────
export type { ChronicleEntry } from "@/services/chroniclesEngine";

// ─── Kept from scaffold ──────────────────────────────
export type AchievementCategory =
  | "relationships"
  | "recovery"
  | "consistency"
  | "milestones"
  | "discovery";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  xpReward: number;
  condition: string;
}

export interface UserAchievement {
  achievementId: string;
  unlockedAt: string;
  progress?: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  streakMaintained: boolean;
}

export interface GamificationProfile {
  xp: number;
  level: number;
  rank: import("@/domains/gamification/store/gamification.store").Rank;
  coins: number;
  streak: number;
  badges: import("@/domains/gamification/store/gamification.store").Badge[];
  purchasedItemIds: string[];
}

// ─── Level Progress ────────────────────────────────────

export interface LevelProgress {
  progress: number;       // 0-100%
  nextLevelXP: number;
  xpInCurrent: number;
  requiredForLevel: number;
}
