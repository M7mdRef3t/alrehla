/**
 * 🧬 Life Score Engine — محرك نقاط الحياة
 * ==========================================
 * يجمع بيانات من كل أنظمة المنصة ويحسب نقاط الحياة الشاملة.
 *
 * المصادر:
 * - Pulse State → body, self
 * - Map State → relations
 * - Dreams → dreams
 * - Daily Journal → self, spirit
 * - Streak System → self (consistency)
 * - Consciousness History → self
 * - Life State (assessments) → all domains
 */

import type {
  LifeDomainId,
  LifeScore,
  DomainAssessment,
  LifeEntry
} from "@/types/lifeDomains";
import { useMapState } from "@/domains/dawayir/store/map.store";
import { usePulseState } from "@/domains/consciousness/store/pulse.store";
import { loadStreak } from "@/services/streakSystem";

// ─── Weights ─────────────────────────────────────────────────────
// How much each data source contributes to a domain's score
const DOMAIN_WEIGHTS: Record<LifeDomainId, { assessment: number; signals: number }> = {
  self:      { assessment: 0.4, signals: 0.6 },
  body:      { assessment: 0.5, signals: 0.5 },
  relations: { assessment: 0.3, signals: 0.7 },
  work:      { assessment: 0.6, signals: 0.4 },
  finance:   { assessment: 0.7, signals: 0.3 },
  dreams:    { assessment: 0.4, signals: 0.6 },
  spirit:    { assessment: 0.6, signals: 0.4 },
  knowledge: { assessment: 0.7, signals: 0.3 }
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 50; // Neutral default
  return values.reduce((s, v) => s + v, 0) / values.length;
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

  // Streak consistency (0-100)
  const streakScore = clamp(streak.currentStreak * 8, 0, 100);
  signals.push(streakScore);

  return signals.length > 0 ? average(signals) : 50;
}

/** Extract "body" signals from pulse energy */
function extractBodySignals(): number {
  const pulses = usePulseState.getState().logs.slice(0, 14);

  if (pulses.length === 0) return 50;

  // Energy (1-10) → normalize to 0-100
  const avgEnergy = average(pulses.map(p => (p.energy / 10) * 100));
  return avgEnergy;
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

/** Extract "dreams" signals from dreams progress */
function extractDreamsSignals(): number {
  // Dreams data comes from assessments primarily
  // We can check if the user has active goals in journey state
  return 50; // Neutral default, enriched by assessments
}

/** Generic fallback for domains with no signal extractor */
function extractGenericSignals(): number {
  return 50; // Neutral
}

// ─── Signal Router ───────────────────────────────────────────────
const SIGNAL_EXTRACTORS: Record<LifeDomainId, () => number> = {
  self:      extractSelfSignals,
  body:      extractBodySignals,
  relations: extractRelationsSignals,
  work:      extractGenericSignals,
  finance:   extractGenericSignals,
  dreams:    extractDreamsSignals,
  spirit:    extractGenericSignals,
  knowledge: extractGenericSignals
};

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

  const assessmentScore = relevantAssessments.length > 0
    ? (relevantAssessments[0].score / 10) * 100 // Normalize 1-10 → 0-100
    : 50; // Neutral if no assessment

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
    trend: "stable", // Will be enriched with history comparison
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
