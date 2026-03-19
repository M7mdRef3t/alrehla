import type { SupabaseClient } from "@supabase/supabase-js";
import { clamp } from "./_shared";
import type { CandidateV2 } from "./candidate-generator";
import type { RoutingContextV2 } from "./context-builder";

export interface RankedCandidateV2 extends CandidateV2 {
  finalScore: number;
  policyScore: number;
  swarmScore: number;
  cognitivePenalty: number;
  explorationBonus: number;
  isExploration: boolean;
}

const EPSILON = 0.15;

function policyScore(context: RoutingContextV2, candidate: CandidateV2): number {
  let score = 0;
  if (candidate.actionType === "open_breathing") {
    score += context.pulseInstability7d * 3 + context.sessionHesitation;
  }
  if (candidate.actionType === "review_red_node") {
    score += context.riskRatio * 4;
  }
  if (candidate.actionType === "open_mission") {
    score += (1 - context.riskRatio) * 1.5 + context.taskCompletion7d;
  }
  return score;
}

function cognitivePenalty(context: RoutingContextV2, candidate: CandidateV2): number {
  const loadNormalized = clamp(candidate.cognitiveLoad / 5, 0, 1);
  const deficit = 1 - context.cognitiveCapacity;
  return loadNormalized * deficit * 2.2;
}

async function getSwarmScore(
  supabase: SupabaseClient,
  edgeId: string | undefined,
  segmentKey: string
): Promise<number> {
  if (!edgeId) return 0;
  const { data } = await supabase
    .from("swarm_edge_stats")
    .select("trials,successes,avg_completion,decay_factor")
    .eq("edge_id", edgeId)
    .eq("segment_key", segmentKey)
    .limit(1)
    .maybeSingle();
  if (!data) return 0;
  const trials = Number(data.trials ?? 0);
  if (trials <= 0) return 0;
  const successRate = Number(data.successes ?? 0) / trials;
  const completion = Number(data.avg_completion ?? 0);
  const decay = clamp(Number(data.decay_factor ?? 1), 0.5, 1);
  return (successRate * 0.7 + completion * 0.3) * decay;
}

export async function rankCandidatesV2(
  supabase: SupabaseClient,
  context: RoutingContextV2,
  candidates: CandidateV2[]
): Promise<RankedCandidateV2[]> {
  if (candidates.length === 0) return [];
  const isExploration = Math.random() < EPSILON;

  const scored: RankedCandidateV2[] = [];
  for (const candidate of candidates) {
    const pScore = policyScore(context, candidate);
    const sScore = await getSwarmScore(supabase, candidate.edgeId, context.segmentKey);
    const cPenalty = cognitivePenalty(context, candidate);
    const bonus = isExploration ? 0.2 : 0;
    const finalScore = pScore + candidate.baseScore + sScore - cPenalty + bonus;
    scored.push({
      ...candidate,
      finalScore,
      policyScore: pScore,
      swarmScore: sScore,
      cognitivePenalty: cPenalty,
      explorationBonus: bonus,
      isExploration
    });
  }

  if (isExploration) {
    // Exploration: weighted random among top half; still constraints-aware.
    const sorted = [...scored].sort((a, b) => b.finalScore - a.finalScore);
    const pool = sorted.slice(0, Math.max(2, Math.ceil(sorted.length / 2)));
    const picked = pool[Math.floor(Math.random() * pool.length)];
    return [picked, ...sorted.filter((c) => c.id !== picked.id)];
  }

  return scored.sort((a, b) => b.finalScore - a.finalScore);
}

export function getEpsilon(): number {
  return EPSILON;
}
