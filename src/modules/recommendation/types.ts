export type JourneyPhaseV1 =
  | "lost"
  | "mapping"
  | "awareness"
  | "resistance"
  | "acceptance"
  | "integration";

export type DawayirSignalTypeV1 =
  | "node_added"
  | "ring_changed"
  | "detachment_toggled"
  | "symptoms_updated"
  | "situation_logged"
  | "path_stage_changed";

export interface DawayirSignalEventV1 {
  id: string;
  type: DawayirSignalTypeV1;
  nodeId?: string;
  timestamp: number;
  payload?: Record<string, unknown>;
}

export interface FeatureVectorV1 {
  entropyScore: number;
  riskRatio: number;
  ringVolatility7d: number;
  pulseInstability7d: number;
  ruminationVelocity7d: number;
  taskCompletion7d: number;
  sessionHesitation: number;
  dominantRing: "green" | "yellow" | "red" | "mixed";
  focusNodeId?: string;
}

export type RiskBandV1 = "high" | "medium" | "low";

export type NextStepActionTypeV1 =
  | "open_breathing"
  | "open_map"
  | "open_tools"
  | "open_mission"
  | "review_red_node"
  | "log_situation"
  | "set_soft_boundary"
  | "journal_reflection";

export interface NextStepCandidateV1 {
  id: string;
  title: string;
  message: string;
  cta: string;
  actionType: NextStepActionTypeV1;
  actionPayload?: Record<string, unknown>;
  tags: string[];
}

export interface WhyReasonV1 {
  code:
    | "pulse_instability"
    | "red_shift"
    | "entropy_high"
    | "session_hesitation"
    | "task_gap"
    | "boundary_progress"
    | "stability_gain";
  label: string;
  value?: string;
}

export interface NextStepWhyCardV1 {
  headline: string;
  reasons: WhyReasonV1[];
}

export type DecisionSourceV1 = "cloud_ranker" | "cloud_ranker_v2" | "local_policy" | "template_fallback";
export type RecommendationSurfaceV1 = "map" | "tools";

export interface NextStepDecisionV1 {
  decisionId: string;
  createdAt: number;
  expiresAt: number;
  source: DecisionSourceV1;
  confidence: number;
  riskBand: RiskBandV1;
  phase: JourneyPhaseV1;
  action: NextStepCandidateV1;
  why: NextStepWhyCardV1;
  featureSnapshot: FeatureVectorV1;
}

export interface DecisionOutcomeV1 {
  decisionId: string;
  acted: boolean;
  completed?: boolean;
  pulseDelta?: number;
  completionLatencySec?: number;
  timeToActionSec?: number;
  hesitationSec?: number;
  idleTimeSec?: number;
  rawElapsedSec?: number;
  interactionCount?: number;
  reportedAt?: number;
}

export interface RecentTelemetrySignalV1 {
  hesitationSec: number;
  activeElapsedSec: number;
  idleElapsedSec?: number;
  interactionCount?: number;
  recordedAt?: number;
}

export interface RankerRequestV1 {
  sessionId: string | null;
  phase: JourneyPhaseV1;
  features: FeatureVectorV1;
  candidates: NextStepCandidateV1[];
  availableFeatures: Record<string, boolean>;
  surface: RecommendationSurfaceV1;
  recentTelemetry?: RecentTelemetrySignalV1[];
}

export interface RankerResponseV1 {
  decisionId: string;
  action: NextStepCandidateV1;
  why: NextStepWhyCardV1;
  confidence: number;
  riskBand: RiskBandV1;
  source: DecisionSourceV1;
  expiresAt: number;
}
