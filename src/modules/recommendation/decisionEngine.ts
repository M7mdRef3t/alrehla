import type {
  DecisionOutcomeV1,
  NextStepDecisionV1,
  RecentTelemetrySignalV1,
  RecommendationSurfaceV1,
  RankerRequestV1,
  RankerResponseV1
} from "./types";
import { buildFeatureVectorV1, deriveJourneyPhaseV1 } from "./featureBuilder";
import { generateCandidatesByPolicy } from "./policyEngine";
import { buildWhyCard } from "./whyCard";
import { getTrackingSessionId, recordFlowEvent } from "@/services/journeyTracking";
import { getFromLocalStorage, setInLocalStorage } from "@/services/browserStorage";
import { CircuitBreaker } from "../../architecture/circuitBreaker";
import { fetchJsonWithResilience, sendJsonWithResilience } from "../../architecture/resilientHttp";

const OUTCOME_QUEUE_KEY = "dawayir-next-step-outcome-queue-v1";
const CACHE_KEY = "dawayir-next-step-decision-cache-v1";
const CACHE_TTL_MS = 600_000; // 10 minutes — reduces API hammering from 90s to 10min
const nextStepApiBreaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 20_000 });
const outcomeApiBreaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 20_000 });

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function randomId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function isExpired(timestamp: number): boolean {
  return Date.now() - timestamp > CACHE_TTL_MS;
}

type DecisionCacheRecord = {
  map?: NextStepDecisionV1;
  tools?: NextStepDecisionV1;
  createdAt: number;
};

function readCache(): DecisionCacheRecord | null {
  if (!isBrowser()) return null;
  try {
    const raw = getFromLocalStorage(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DecisionCacheRecord;
    if (!parsed.createdAt || isExpired(parsed.createdAt)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(surface: RecommendationSurfaceV1, decision: NextStepDecisionV1): void {
  if (!isBrowser()) return;
  const existing = readCache() ?? { createdAt: Date.now() };
  const next: DecisionCacheRecord = {
    ...existing,
    [surface]: decision,
    createdAt: Date.now()
  };
  setInLocalStorage(CACHE_KEY, JSON.stringify(next));
}

async function rankWithCloud(request: RankerRequestV1): Promise<RankerResponseV1 | null> {
  if (!isBrowser()) return null;
  const parsed = await fetchJsonWithResilience<Partial<RankerResponseV1>>(
    "/api/recommendations/next-step",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    },
    { retries: 1, breaker: nextStepApiBreaker }
  );
  if (!parsed?.action || !parsed.decisionId || !parsed.why) return null;
  return parsed as RankerResponseV1;
}

async function rankWithCloudV2(request: RankerRequestV1): Promise<RankerResponseV1 | null> {
  if (!isBrowser()) return null;
  const parsed = await fetchJsonWithResilience<Partial<RankerResponseV1>>(
    "/api/routing/next-step-v2",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    },
    { retries: 1, breaker: nextStepApiBreaker }
  );
  if (!parsed?.action || !parsed.decisionId || !parsed.why) return null;
  return parsed as RankerResponseV1;
}

export interface ComputeNextStepInput {
  goalId: string;
  category: string;
  availableFeatures: Record<string, boolean>;
  surface: RecommendationSurfaceV1;
  forceRefresh?: boolean;
  recentTelemetry?: RecentTelemetrySignalV1[];
}

export async function computeNextStepDecision(input: ComputeNextStepInput): Promise<NextStepDecisionV1 | null> {
  if (!input.forceRefresh) {
    const cached = readCache()?.[input.surface];
    if (cached && cached.expiresAt > Date.now()) return cached;
  }

  const features = buildFeatureVectorV1();
  const phase = deriveJourneyPhaseV1({
    goalId: input.goalId,
    features
  });
  const policy = generateCandidatesByPolicy(phase, features);
  if (policy.candidates.length === 0) return null;

  const localCandidate = policy.candidates[0];
  const localWhy = buildWhyCard(policy.riskBand, features, localCandidate);

  const request: RankerRequestV1 = {
    sessionId: getTrackingSessionId(),
    phase,
    features,
    candidates: policy.candidates,
    availableFeatures: input.availableFeatures,
    surface: input.surface,
    recentTelemetry: Array.isArray(input.recentTelemetry) ? input.recentTelemetry.slice(-3) : []
  };

  const useDynamicRoutingV2 = Boolean(input.availableFeatures?.dynamic_routing_v2);
  const ranked = useDynamicRoutingV2 ? await rankWithCloudV2(request) : await rankWithCloud(request);
  const now = Date.now();

  const decision: NextStepDecisionV1 =
    ranked != null
      ? {
          decisionId: ranked.decisionId,
          createdAt: now,
          expiresAt: ranked.expiresAt,
          source: ranked.source,
          confidence: ranked.confidence,
          riskBand: ranked.riskBand,
          phase,
          action: ranked.action,
          why: ranked.why,
          featureSnapshot: features
        }
      : {
          decisionId: randomId("decision_local"),
          createdAt: now,
          expiresAt: now + 12 * 60 * 60 * 1000,
          source: "local_policy",
          confidence: 0.64,
          riskBand: policy.riskBand,
          phase,
          action: localCandidate,
          why: localWhy,
          featureSnapshot: features
        };

  writeCache(input.surface, decision);
  recordFlowEvent("next_step_rendered", {
    meta: {
      decisionId: decision.decisionId,
      actionType: decision.action.actionType,
      source: decision.source,
      riskBand: decision.riskBand,
      surface: input.surface
    }
  });
  return decision;
}

function readOutcomeQueue(): DecisionOutcomeV1[] {
  if (!isBrowser()) return [];
  try {
    const raw = getFromLocalStorage(OUTCOME_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DecisionOutcomeV1[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOutcomeQueue(outcomes: DecisionOutcomeV1[]): void {
  if (!isBrowser()) return;
  setInLocalStorage(OUTCOME_QUEUE_KEY, JSON.stringify(outcomes.slice(-200)));
}

async function flushOutcomeQueue(): Promise<void> {
  const queued = readOutcomeQueue();
  if (queued.length === 0) return;
  const pending = [...queued];
  writeOutcomeQueue([]);
  for (const item of pending) {
    const isV2Decision = String(item.decisionId).startsWith("decision_v2_");
    const endpoint = isV2Decision ? "/api/routing/outcome-v2" : "/api/recommendations/outcome";
    const ok = await sendJsonWithResilience(
      endpoint,
      item,
      {},
      { retries: 1, breaker: outcomeApiBreaker }
    );
    if (!ok) {
      writeOutcomeQueue([...readOutcomeQueue(), item]);
    }
  }
}

export async function reportDecisionOutcome(outcome: DecisionOutcomeV1): Promise<void> {
  const payload: DecisionOutcomeV1 = {
    ...outcome,
    reportedAt: outcome.reportedAt ?? Date.now()
  };
  writeOutcomeQueue([...readOutcomeQueue(), payload]);
  await flushOutcomeQueue();
}
