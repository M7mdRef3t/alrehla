/**
 * 🧬 Life Score Engine — محرك نقاط الحياة
 * ==========================================
 * يجمع بيانات من كل أنظمة المنصة ويحسب نقاط الحياة الشاملة.
 *
 * المصادر:
 * - Pulse State → body, self
 * - Map State → relations
 * - Ritual Store → work, spirit, knowledge, dreams
 * - Life State (assessments + entries) → all domains
 */

import type {
  LifeDomainId,
  LifeScore,
  DomainAssessment,
  LifeEntry
} from "@/types/lifeDomains";
import { useMapState } from '@/modules/map/dawayirIndex';
import { usePulseState } from "@/domains/consciousness/store/pulse.store";
import { useRitualState } from "@/domains/journey/store/ritual.store";
import { useLifeState } from '@/modules/map/dawayirIndex';
import { loadStreak } from "@/services/streakSystem";
import { getTodayDate } from "@/types/dailyRituals";

// ─── Weights ─────────────────────────────────────────────────────
// How much each data source contributes to a domain's score
const DOMAIN_WEIGHTS: Record<LifeDomainId, { assessment: number; signals: number }> = {
  self:      { assessment: 0.4, signals: 0.6 },
  body:      { assessment: 0.5, signals: 0.5 },
  relations: { assessment: 0.3, signals: 0.7 },
  work:      { assessment: 0.5, signals: 0.5 },
  finance:   { assessment: 0.7, signals: 0.3 },
  dreams:    { assessment: 0.4, signals: 0.6 },
  spirit:    { assessment: 0.5, signals: 0.5 },
  knowledge: { assessment: 0.5, signals: 0.5 }
};

// Overall domain weights (how much each domain contributes to overall score)
const OVERALL_WEIGHTS: Record<LifeDomainId, number> = {
  self:      0.18,
  body:      0.12,
  relations: 0.16,
  work:      0.14,
  finance:   0.10,
  dreams:    0.12,
  spirit:    0.10,
  knowledge: 0.08
};

// ─── Domain-Ritual Mapping ────────────────────────────────────────
// Maps domain IDs to their related ritual domainId strings (same taxonomy, but explicit)
const DOMAIN_RITUAL_MAP: Record<LifeDomainId, LifeDomainId[]> = {
  self:      ["self"],
  body:      ["body"],
  relations: ["relations"],
  work:      ["work"],
  finance:   ["finance"],
  dreams:    ["dreams"],
  spirit:    ["spirit"],
  knowledge: ["knowledge"]
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 50; // Neutral default
  return values.reduce((s, v) => s + v, 0) / values.length;
}

// ─── Ritual Completion Helper ─────────────────────────────────────

/**
 * Returns 0-100 score based on ritual completion rate for a given domain.
 * Looks at the last 14 days of logs for domain-specific rituals.
 */
function getRitualCompletionScore(domainIds: LifeDomainId[]): number {
  const ritualState = useRitualState.getState();
  const rituals = ritualState.rituals.filter(
    r => r.isActive && domainIds.includes(r.domainId as LifeDomainId)
  );

  if (rituals.length === 0) return 50; // No rituals = neutral

  const today = getTodayDate();
  const todayLogs = ritualState.logs.filter(l => l.logDate === today);
  const todayRitualIds = new Set(todayLogs.map(l => l.ritualId));

  // Today's completion for this domain
  const completedToday = rituals.filter(r => todayRitualIds.has(r.id)).length;
  const todayRate = completedToday / rituals.length;

  // 7-day history
  const last7Days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().slice(0, 10));
  }

  const weekRates: number[] = last7Days.map(date => {
    const dayLogs = new Set(
      ritualState.logs.filter(l => l.logDate === date).map(l => l.ritualId)
    );
    const completed = rituals.filter(r => dayLogs.has(r.id)).length;
    return rituals.length > 0 ? completed / rituals.length : 0;
  });

  const weekAvg = average(weekRates);

  // Blend today (40%) + week average (60%)
  return clamp(Math.round((todayRate * 0.4 + weekAvg * 0.6) * 100), 0, 100);
}

// ─── Signal Extractors ───────────────────────────────────────────

/** Extract "self" signals from pulse mood, journal, and streak */
function extractSelfSignals(): number {
  const pulses = usePulseState.getState().logs.slice(0, 14);
  const streak = loadStreak();

  const signals: number[] = [];

  // Mood → self (normalized 0-100)
  if (pulses.length > 0) {
    const moodMap: Record<string, number> = {
      bright: 90, calm: 75, hopeful: 80,
      anxious: 35, angry: 25, sad: 20,
      tense: 30, overwhelmed: 15
    };
    const avgMood = average(pulses.map(p => moodMap[p.mood] ?? 50));
    signals.push(avgMood);
  }

  // Streak consistency (0-100, caps at streak 13 = 100)
  const streakScore = clamp(streak.currentStreak * 8, 0, 100);
  signals.push(streakScore);

  // Ritual completion for self domain
  signals.push(getRitualCompletionScore(["self"]));

  return signals.length > 0 ? average(signals) : 50;
}

/** Extract "body" signals from pulse energy + body rituals */
function extractBodySignals(): number {
  const pulses = usePulseState.getState().logs.slice(0, 14);

  const signals: number[] = [];

  if (pulses.length > 0) {
    // Energy (1-10) → normalize to 0-100
    const avgEnergy = average(pulses.map(p => (p.energy / 10) * 100));
    signals.push(avgEnergy);
  } else {
    signals.push(50); // neutral fallback instead of returning 0
  }

  // Body-related rituals (sleep, exercise, food)
  signals.push(getRitualCompletionScore(["body"]));

  return average(signals);
}

/** Extract "relations" signals from map nodes */
function extractRelationsSignals(): number {
  const nodes = useMapState.getState().nodes.filter(n => !n.isNodeArchived);

  if (nodes.length === 0) return 50;

  const greenCount = nodes.filter(n => n.ring === "green").length;
  const yellowCount = nodes.filter(n => n.ring === "yellow").length;
  const redCount = nodes.filter(n => n.ring === "red").length;
  const total = nodes.length;

  // Green = positive (100), Yellow = neutral (50), Red = negative (20)
  const weightedScore = (greenCount * 100 + yellowCount * 50 + redCount * 20) / total;

  // Penalty for detached/emergency nodes
  const detachedCount = nodes.filter(n => n.detachmentMode || n.isDetached).length;
  const emergencyCount = nodes.filter(n => n.isEmergency).length;
  const penalty = clamp((detachedCount * 5 + emergencyCount * 10), 0, 30);

  return clamp(weightedScore - penalty, 0, 100);
}

/** Extract "work" signals from work rituals + active work problems */
function extractWorkSignals(): number {
  const signals: number[] = [];

  // Work rituals completion
  signals.push(getRitualCompletionScore(["work"]));

  // Penalize active work-related problems
  const lifeState = useLifeState.getState();
  const workProblems = lifeState.getActiveProblems().filter(
    p => p.domainId === "work"
  ).length;

  // Each work problem reduces score (max -30)
  const problemPenalty = clamp(workProblems * 10, 0, 30);
  signals.push(clamp(70 - problemPenalty, 10, 100));

  return average(signals);
}

/** Extract "finance" signals from financial entries + assessments */
function extractFinanceSignals(): number {
  const lifeState = useLifeState.getState();

  // Finance rituals
  const ritualScore = getRitualCompletionScore(["finance"]);

  // Financial problems → reduce score
  const financeProblems = lifeState.getActiveProblems().filter(
    p => p.domainId === "finance"
  ).length;

  // Financial wins → boost score
  const financeWins = lifeState.entries.filter(
    e => e.type === "win" && e.domainId === "finance" &&
    Date.now() - e.createdAt < 30 * 24 * 60 * 60 * 1000
  ).length;

  const base = 60;
  const score = clamp(base - financeProblems * 10 + financeWins * 5, 0, 100);

  return average([ritualScore, score]);
}

/** Extract "dreams" signals from goals, wins, and dreams rituals */
function extractDreamsSignals(): number {
  const lifeState = useLifeState.getState();

  // Recent wins in last 30 days (encouraging!)
  const recentWins = lifeState.entries.filter(
    e => e.type === "win" && Date.now() - e.createdAt < 30 * 24 * 60 * 60 * 1000
  ).length;

  // Goals/dreams entries
  const activeGoals = lifeState.entries.filter(
    e => e.type === "goal" && e.status === "active"
  ).length;

  // Dreams rituals
  const ritualScore = getRitualCompletionScore(["dreams"]);

  // Score: more wins + more active goals = better
  const achievementScore = clamp(30 + recentWins * 10 + activeGoals * 8, 0, 100);

  return average([ritualScore, achievementScore]);
}

/** Extract "spirit" signals from Wird store + spirit rituals */
function extractSpiritSignals(): number {
  const signals: number[] = [];

  // Spirit rituals completion
  signals.push(getRitualCompletionScore(["spirit"]));

  // Wird store data (the real spiritual activity)
  try {
    const { useWirdState } = require('@/modules/wird/store/wird.store');
    const wirdState = useWirdState.getState();
    const streak = wirdState.getStreak();
    const todayTotal = wirdState.getDailyTotal();

    // Streak → score: each day adds ~8pts (max 100 at ~12 days)
    const streakScore = clamp(streak * 8, 0, 100);
    signals.push(streakScore);

    // Today's dhikr count → score (100 dhikr = 100 pts)
    const todayScore = clamp(todayTotal, 0, 100);
    signals.push(todayScore);
  } catch {
    // Wird store unavailable — just use ritual score
  }

  return average(signals);
}

/** Extract "knowledge" signals from learning rituals */
function extractKnowledgeSignals(): number {
  return getRitualCompletionScore(["knowledge"]);
}

// ─── Signal Router ───────────────────────────────────────────────
const SIGNAL_EXTRACTORS: Record<LifeDomainId, () => number> = {
  self:      extractSelfSignals,
  body:      extractBodySignals,
  relations: extractRelationsSignals,
  work:      extractWorkSignals,
  finance:   extractFinanceSignals,
  dreams:    extractDreamsSignals,
  spirit:    extractSpiritSignals,
  knowledge: extractKnowledgeSignals
};

// ─── Assessment Decay ─────────────────────────────────────────────

/**
 * If the last assessment is older than 30 days, gradually reduce its weight.
 * After 60 days, the assessment contributes almost nothing.
 */
function getAssessmentDecayFactor(timestamp: number): number {
  const daysSince = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
  if (daysSince <= 30) return 1.0;
  if (daysSince >= 60) return 0.3;
  // Linear interpolation from 1.0 to 0.3 over 30 days
  return 1.0 - ((daysSince - 30) / 30) * 0.7;
}

// ─── Main Calculator ─────────────────────────────────────────────

export function calculateDomainScore(
  domainId: LifeDomainId,
  assessments: DomainAssessment[]
): number {
  const weights = DOMAIN_WEIGHTS[domainId];

  // Get latest assessment score for this domain
  const relevantAssessments = assessments
    .filter(a => a.domainId === domainId)
    .sort((a, b) => b.timestamp - a.timestamp);

  let assessmentScore = 50; // Neutral if no assessment

  if (relevantAssessments.length > 0) {
    const latest = relevantAssessments[0];
    const normalizedScore = (latest.score / 10) * 100; // 1-10 → 0-100
    const decayFactor = getAssessmentDecayFactor(latest.timestamp);
    assessmentScore = normalizedScore * decayFactor + 50 * (1 - decayFactor);
  }

  // Get automatic signal score
  const signalScore = SIGNAL_EXTRACTORS[domainId]();

  // Weighted combination
  const finalScore = assessmentScore * weights.assessment + signalScore * weights.signals;

  return clamp(Math.round(finalScore), 0, 100);
}

export function calculateLifeScore(
  assessments: DomainAssessment[],
  entries: LifeEntry[]
): LifeScore {
  const domainScores: Record<string, number> = {};
  const domainIds: LifeDomainId[] = [
    "self", "body", "relations", "work", "finance", "dreams", "spirit", "knowledge"
  ];

  // Calculate per-domain score
  for (const domainId of domainIds) {
    domainScores[domainId] = calculateDomainScore(domainId, assessments);
  }

  // ◈ Vertical Axis Modifier ◈
  // The spirit domain (vertical axis) affects all other domains.
  // When spiritual connection is weak → all domains suffer (~10%)
  // When spiritual connection is strong → slight boost
  const spiritScore = domainScores["spirit"] || 50;
  // spiritScore ranges 0-100, normalize to -0.1 to +0.05
  // At 50 (neutral) → modifier = 0
  // At 0 (disconnected) → modifier = -0.10 (loses 10%)
  // At 100 (radiant) → modifier = +0.05 (gains 5%)
  const verticalModifier = ((spiritScore - 50) / 50) * 0.10;

  // Apply modifier to all non-spirit domains
  for (const domainId of domainIds) {
    if (domainId !== "spirit") {
      const modified = domainScores[domainId] * (1 + verticalModifier);
      domainScores[domainId] = clamp(Math.round(modified), 0, 100);
    }
  }

  // Calculate overall weighted score
  let overall = 0;
  for (const domainId of domainIds) {
    overall += domainScores[domainId] * OVERALL_WEIGHTS[domainId];
  }
  overall = clamp(Math.round(overall), 0, 100);

  // Find weakest and strongest
  let weakest: LifeDomainId = "self";
  let strongest: LifeDomainId = "self";
  let minScore = 101;
  let maxScore = -1;

  for (const domainId of domainIds) {
    if (domainScores[domainId] < minScore) {
      minScore = domainScores[domainId];
      weakest = domainId;
    }
    if (domainScores[domainId] > maxScore) {
      maxScore = domainScores[domainId];
      strongest = domainId;
    }
  }

  // Count active problems and pending decisions
  const activeProblems = entries.filter(
    e => e.type === "problem" && e.status === "active"
  ).length;

  const pendingDecisions = entries.filter(
    e => e.type === "decision" && e.status === "active"
  ).length;

  return {
    overall,
    domains: domainScores as Record<LifeDomainId, number>,
    trend: "stable", // Enriched by calculateTrend()
    weakestDomain: weakest,
    strongestDomain: strongest,
    calculatedAt: Date.now(),
    activeProblems,
    pendingDecisions
  };
}

/**
 * Determine trend by comparing current score with previous scores
 */
export function calculateTrend(
  currentOverall: number,
  previousScores: number[]
): "improving" | "stable" | "declining" {
  if (previousScores.length < 3) return "stable";

  const recentAvg = average(previousScores.slice(0, 3));
  const diff = currentOverall - recentAvg;

  if (diff > 5) return "improving";
  if (diff < -5) return "declining";
  return "stable";
}
