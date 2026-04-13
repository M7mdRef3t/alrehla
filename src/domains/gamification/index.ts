/**
 * Domain: Gamification — Public API
 */

// ─── Types ─────────────────────────────────────────────
export type {
  AchievementCategory,
  Achievement,
  UserAchievement,
  StreakData,
  GamificationProfile,
  LevelProgress,
  // Re-exports from state
  Rank,
  Badge,
  PurchaseFeedback,
  ChronicleEntry,
} from "./types";

// ─── Freeze Types ────────────────────────────────────────
export type { FreezeStats } from "./store/gamification.store";

// ─── Services ──────────────────────────────────────────
export { gamificationService } from "./services/gamification.service";
export { freezeRewardsService } from "./services/freezeRewards";

// ─── Hooks ────────────────────────────────────────────
export { useGamification } from "./hooks/useGamification";
