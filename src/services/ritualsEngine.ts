/**
 * ⚙️ Rituals Engine — محرك العادات اليومية
 * ==========================================
 * يدير كل منطق العادات والروتين اليومي:
 * - توليد خطة اليوم بناءً على العادات + الطاقة + المجالات الضعيفة
 * - حساب streaks لكل عادة
 * - اقتراح عادات جديدة بناءً على Life Score
 * - حساب تأثير العادات على Domain Scores
 */

import type {
  DailyRitual,
  RitualLog,
  DailyPlan,
  DailyPriority,
  DayTheme,
  TimeOfDay,
  PresetRitual,
} from "@/types/dailyRituals";
import {
  getTodayDate,
  isRitualScheduledToday,
  getCurrentTimeOfDay,
  PRESET_RITUALS,
  DAY_THEME_CONFIG,
} from "@/types/dailyRituals";
import type { LifeDomainId, LifeScore } from "@/types/lifeDomains";
import { getDomainConfig } from "@/types/lifeDomains";

// ─── Streak Calculator ───────────────────────────────────────────

export interface RitualStreak {
  ritualId: string;
  currentStreak: number;
  longestStreak: number;
  completionRate7d: number; // 0-1 in last 7 days
  lastCompletedDate: string | null;
}

/**
 * Calculate streak data for a single ritual
 */
export function calculateRitualStreak(
  ritualId: string,
  logs: RitualLog[]
): RitualStreak {
  const ritualLogs = logs
    .filter((l) => l.ritualId === ritualId)
    .sort((a, b) => b.completedAt - a.completedAt);

  if (ritualLogs.length === 0) {
    return {
      ritualId,
      currentStreak: 0,
      longestStreak: 0,
      completionRate7d: 0,
      lastCompletedDate: null,
    };
  }

  // Unique dates (sorted descending)
  const uniqueDates = [...new Set(ritualLogs.map((l) => l.logDate))].sort(
    (a, b) => b.localeCompare(a)
  );

  // Current streak
  const today = getTodayDate();
  let currentStreak = 0;
  let checkDate = today;

  for (const date of uniqueDates) {
    if (date === checkDate || date === getPreviousDate(checkDate)) {
      currentStreak++;
      checkDate = date;
    } else if (date < checkDate) {
      break;
    }
  }

  // If the latest log isn't today or yesterday, streak is 0
  if (uniqueDates[0] !== today && uniqueDates[0] !== getPreviousDate(today)) {
    currentStreak = 0;
  }

  // Longest streak (simple calculation)
  let longestStreak = 0;
  let tempStreak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    if (uniqueDates[i] === getPreviousDate(uniqueDates[i - 1])) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

  // 7-day completion rate
  const sevenDaysAgo = getDateNDaysAgo(7);
  const last7 = uniqueDates.filter((d) => d >= sevenDaysAgo).length;
  const completionRate7d = Math.min(last7 / 7, 1);

  return {
    ritualId,
    currentStreak,
    longestStreak,
    completionRate7d,
    lastCompletedDate: uniqueDates[0] ?? null,
  };
}

// ─── Day Theme Suggester ─────────────────────────────────────────

/**
 * Suggest a day theme based on life context
 */
export function suggestDayTheme(
  lifeScore: LifeScore | null,
  energyLevel: number | null,
  dayOfWeek: number
): DayTheme {
  // Low energy → recovery day
  if (energyLevel !== null && energyLevel <= 3) {
    return "recovery";
  }

  // Friday/Saturday (weekend in Egypt) → social or recovery
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    return energyLevel && energyLevel >= 6 ? "social" : "recovery";
  }

  // Check weakest domain
  if (lifeScore) {
    const weakest = lifeScore.weakestDomain;
    const weakScore = lifeScore.domains[weakest];

    if (weakScore < 30) {
      // Critical domain → focus day
      switch (weakest) {
        case "work":
          return "productivity";
        case "relations":
          return "social";
        case "knowledge":
        case "self":
          return "growth";
        case "body":
        case "spirit":
          return "recovery";
        default:
          return "balance";
      }
    }
  }

  // High energy → productivity
  if (energyLevel && energyLevel >= 7) {
    return "productivity";
  }

  return "balance";
}

// ─── Daily Plan Generator ────────────────────────────────────────

/**
 * Generate today's plan based on rituals, life score, and energy
 */
export function generateDailyPlan(
  rituals: DailyRitual[],
  logs: RitualLog[],
  lifeScore: LifeScore | null,
  energyLevel: number | null,
  pendingProblems: number,
  pendingDecisions: number
): DailyPlan {
  const today = getTodayDate();
  const dayOfWeek = new Date().getDay();

  // Suggest theme
  const dayTheme = suggestDayTheme(lifeScore, energyLevel, dayOfWeek);

  // Generate priorities based on context
  const priorities: DailyPriority[] = [];

  // Priority from weakest domain
  if (lifeScore) {
    const weakDomain = getDomainConfig(lifeScore.weakestDomain);
    const weakScore = lifeScore.domains[lifeScore.weakestDomain];
    if (weakScore < 50) {
      priorities.push({
        id: `weak-${lifeScore.weakestDomain}`,
        text: `اشتغل على ${weakDomain.label} — النتيجة ${weakScore}%`,
        domainId: lifeScore.weakestDomain,
        isCompleted: false,
        source: "ai",
      });
    }
  }

  // Priority from pending decisions
  if (pendingDecisions > 0) {
    priorities.push({
      id: "pending-decisions",
      text: `احسم قرار واحد على الأقل من ${pendingDecisions} قرار معلق`,
      domainId: "self",
      isCompleted: false,
      source: "system",
    });
  }

  // Priority from pending problems
  if (pendingProblems >= 3) {
    priorities.push({
      id: "pending-problems",
      text: `عندك ${pendingProblems} مشكلة مفتوحة — حل واحدة النهاردة`,
      domainId: "self",
      isCompleted: false,
      source: "system",
    });
  }

  // Theme-based priority
  const themeConfig = DAY_THEME_CONFIG[dayTheme];
  if (priorities.length < 3) {
    priorities.push({
      id: `theme-${dayTheme}`,
      text: themeConfig.description,
      domainId: dayTheme === "social" ? "relations" : dayTheme === "productivity" ? "work" : "self",
      isCompleted: false,
      source: "ai",
    });
  }

  return {
    id: `plan-${today}`,
    planDate: today,
    morningEnergy: energyLevel,
    dayTheme,
    topPriorities: priorities.slice(0, 3),
    morningStarted: false,
    eveningReflection: null,
    dayRating: null,
    createdAt: Date.now(),
  };
}

// ─── Ritual Suggestions ──────────────────────────────────────────

/**
 * Suggest new rituals based on weak life domains
 */
export function suggestRituals(
  lifeScore: LifeScore | null,
  existingRituals: DailyRitual[]
): PresetRitual[] {
  const existingNames = new Set(existingRituals.map((r) => r.name));
  const available = PRESET_RITUALS.filter((p) => !existingNames.has(p.name));

  if (!lifeScore) {
    // Cold start — suggest essentials
    return available
      .filter((p) => p.category === "essential")
      .slice(0, 3);
  }

  // Sort domains by score (weakest first)
  const sortedDomains = Object.entries(lifeScore.domains)
    .sort(([, a], [, b]) => a - b)
    .map(([id]) => id as LifeDomainId);

  // Prioritize rituals from weak domains
  const suggestions: PresetRitual[] = [];
  for (const domainId of sortedDomains) {
    const domainRituals = available.filter((p) => p.domainId === domainId);
    for (const ritual of domainRituals) {
      if (suggestions.length < 5 && !suggestions.includes(ritual)) {
        suggestions.push(ritual);
      }
    }
  }

  return suggestions.slice(0, 5);
}

// ─── Today's Rituals with Status ─────────────────────────────────

export interface RitualWithStatus extends DailyRitual {
  isCompletedToday: boolean;
  streak: RitualStreak;
  todayLog: RitualLog | null;
}

/**
 * Get today's rituals with completion status
 */
export function getTodayRituals(
  rituals: DailyRitual[],
  logs: RitualLog[]
): RitualWithStatus[] {
  const today = getTodayDate();
  const todayLogs = logs.filter((l) => l.logDate === today);

  return rituals
    .filter(isRitualScheduledToday)
    .map((ritual) => {
      const todayLog = todayLogs.find((l) => l.ritualId === ritual.id) ?? null;
      const streak = calculateRitualStreak(ritual.id, logs);
      return {
        ...ritual,
        isCompletedToday: todayLog !== null,
        streak,
        todayLog,
      };
    })
    .sort((a, b) => {
      // Incomplete first, then by targetTime order
      if (a.isCompletedToday !== b.isCompletedToday) {
        return a.isCompletedToday ? 1 : -1;
      }
      const timeOrder: Record<TimeOfDay, number> = {
        morning: 0,
        afternoon: 1,
        evening: 2,
        anytime: 3,
      };
      return timeOrder[a.targetTime] - timeOrder[b.targetTime];
    });
}

// ─── Completion Stats ────────────────────────────────────────────

export interface DailyCompletionStats {
  total: number;
  completed: number;
  percentage: number;
  byTime: Record<TimeOfDay, { total: number; completed: number }>;
}

export function getDailyCompletionStats(
  rituals: RitualWithStatus[]
): DailyCompletionStats {
  const byTime: Record<TimeOfDay, { total: number; completed: number }> = {
    morning: { total: 0, completed: 0 },
    afternoon: { total: 0, completed: 0 },
    evening: { total: 0, completed: 0 },
    anytime: { total: 0, completed: 0 },
  };

  for (const r of rituals) {
    byTime[r.targetTime].total++;
    if (r.isCompletedToday) {
      byTime[r.targetTime].completed++;
    }
  }

  const total = rituals.length;
  const completed = rituals.filter((r) => r.isCompletedToday).length;

  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    byTime,
  };
}

// ─── Domain Impact Calculator ────────────────────────────────────

/**
 * Calculate how much ritual completion impacts domain scores.
 * Returns a bonus (0-15) per domain based on ritual adherence.
 */
export function calculateRitualDomainBonus(
  rituals: DailyRitual[],
  logs: RitualLog[]
): Record<LifeDomainId, number> {
  const bonus: Record<string, number> = {
    self: 0, body: 0, relations: 0, work: 0,
    finance: 0, dreams: 0, spirit: 0, knowledge: 0,
  };

  for (const ritual of rituals.filter((r) => r.isActive)) {
    const streak = calculateRitualStreak(ritual.id, logs);
    // Each completed day in last 7 adds up to 2 points per ritual
    const ritualBonus = Math.round(streak.completionRate7d * 15);
    bonus[ritual.domainId] = Math.min(
      (bonus[ritual.domainId] ?? 0) + ritualBonus,
      15
    );
  }

  return bonus as Record<LifeDomainId, number>;
}

// ─── Context-Aware Quick Actions ─────────────────────────────────

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  color: string;
  action: "pulse" | "ritual" | "capture" | "decision" | "assessment" | "evening-review" | "morning-start" | "rest" | "focus";
  priority: number; // Higher = show first
  bg?: string;
}


/**
 * Generate contextual quick actions based on current state
 */
export function generateQuickActions(
  rituals: RitualWithStatus[],
  plan: DailyPlan | null,
  lifeScore: LifeScore | null,
  hasPulseToday: boolean,
  pendingDecisions: number
): QuickAction[] {
  const actions: QuickAction[] = [];
  const timeOfDay = getCurrentTimeOfDay();

  // Morning: Start your day
  if (timeOfDay === "morning" && plan && !plan.morningStarted) {
    actions.push({
      id: "morning-start",
      label: "ابدأ يومك",
      icon: "☀️",
      color: "#f59e0b",
      action: "morning-start",
      priority: 100,
    });
  }

  // Pulse check (if not done today)
  if (!hasPulseToday) {
    actions.push({
      id: "pulse",
      label: "سجّل طاقتك",
      icon: "💚",
      color: "#10b981",
      action: "pulse",
      priority: 90,
    });
  }

  // Pending rituals
  const pendingRituals = rituals.filter((r) => !r.isCompletedToday);
  const currentTimeRituals = pendingRituals.filter(
    (r) => r.targetTime === timeOfDay || r.targetTime === "anytime"
  );

  if (currentTimeRituals.length > 0) {
    actions.push({
      id: "ritual",
      label: `أنجز عادة (${pendingRituals.length} باقي)`,
      icon: "✅",
      color: "#8b5cf6",
      action: "ritual",
      priority: 85,
    });
  }

  // Pending decisions
  if (pendingDecisions > 0) {
    actions.push({
      id: "decision",
      label: "احسم قرار",
      icon: "🧠",
      color: "#f59e0b",
      action: "decision",
      priority: 70,
    });
  }

  // Quick capture (always available)
  actions.push({
    id: "capture",
    label: "سجّل فكرة",
    icon: "📝",
    color: "#06b6d4",
    action: "capture",
    priority: 60,
  });

  // Evening review (evening only)
  if (timeOfDay === "evening" && plan && !plan.eveningReflection) {
    actions.push({
      id: "evening-review",
      label: "راجع يومك",
      icon: "🌙",
      color: "#6366f1",
      action: "evening-review",
      priority: 95,
    });
  }

  // Energy-based logic
  if (plan?.morningEnergy !== null) {
    if (plan!.morningEnergy! >= 8) {
      actions.push({
        id: "focus",
        label: "أصعب مهمة",
        icon: "⚡",
        color: "#f472b6",
        action: "focus",
        priority: 88,
      });
    } else if (plan!.morningEnergy! <= 4) {
      actions.push({
        id: "rest",
        label: "راحة استراتيجية",
        icon: "🌬️",
        color: "#10b981",
        action: "rest",
        priority: 88,
      });
    }
  }

  // Domain assessment for weak domain
  if (lifeScore) {
    const weakest = lifeScore.weakestDomain;
    const score = lifeScore.domains[weakest];
    if (score < 40) {
      const weakConfig = getDomainConfig(weakest);
      actions.push({
        id: "assessment",
        label: `صلّح ${weakConfig.label}`,
        icon: weakConfig.icon,
        color: "#f87171", // Alert color
        action: "assessment",
        priority: 92,
      });
    }
  }

  return actions.sort((a, b) => b.priority - a.priority);
}


// ─── Utility Helpers ─────────────────────────────────────────────

function getPreviousDate(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function getDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
