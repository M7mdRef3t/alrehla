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

// ─── Services ──────────────────────────────────────────
export { gamificationService } from "./services/gamification.service";

// ─── Hooks ────────────────────────────────────────────
export { useGamification } from "./hooks/useGamification";
