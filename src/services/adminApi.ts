import { logger } from "@/services/logger";
import { revenueService } from "@/domains/billing";
import type { RevenueMetricSnapshot, TransactionSummary } from "@/domains/billing";
import { supabase, isSupabaseReady } from "./supabaseClient";
import { getAuthToken } from "@/domains/auth/store/auth.store";
import { useAdminState } from "@/domains/admin/store/admin.store";
import { runtimeEnv } from "@/config/runtimeEnv";
import { CircuitBreaker } from "../architecture/circuitBreaker";
import { fetchJsonWithResilience, sendJsonWithResilience } from "../architecture/resilientHttp";
import type { FeatureFlagKey, FeatureFlagMode } from "@/config/features";
import type {
  ScoringWeights,
  ScoringThresholds,
  AiLogEntry,
  AdminMission,
  AdminBroadcast,
  JourneyPath,
  JourneyPathStep,
  SovereignInsight,
  SovereignStats
} from "@/domains/admin/store/admin.store";
import { getBroadcastAudienceFromId, withBroadcastAudienceId } from "@/utils/broadcastAudience";
import type { MapNode } from "@/modules/map/mapTypes";
import type { PulseCheckMode } from "@/domains/consciousness/store/pulse.store";
import type { PulseCopyOverrides } from "@/domains/admin/store/admin.store";
import type {
  OpsInsights as SharedOpsInsights,
  ExecutiveReport as SharedExecutiveReport,
  SystemHealthReport as SharedSystemHealthReport,
  SecuritySignalsReport as SharedSecuritySignalsReport,
  WeeklyReport as SharedWeeklyReport,
  CronReportResponse as SharedCronReportResponse
} from "@/types/admin.types";

type SystemSettingKey =
  | "feature_flags"
  | "system_prompt"
  | "scoring_weights"
  | "scoring_thresholds"
  | "pulse_check_mode"
  | "theme_palette"
  | "pulse_copy_overrides"
  | "journey_paths"
  | "journey_paths"
  | "marketing_spend"
  | "campaign_budgets";

const SETTINGS_TABLE = "system_settings";
const ADMIN_API_BASE = runtimeEnv.adminApiBase;
const ADMIN_API_PATH = `${ADMIN_API_BASE}/api/admin`;
// cooldownMs: 5 min — after a 401/403 auth failure, stop polling for 5 minutes.
const adminApiBreaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 300_000 });
const securityWebhookBreaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 60_000 });

const HOBBY_REMAP_BASES = new Set([
  "daily-report",
  "weekly-report",
  "full-export",
  "user-state",
  "user-state-export",
  "user-state-import"
]);

function remapAdminPathForHobby(path: string): string {
  const [base, ...rest] = path.split("?");
  if (!HOBBY_REMAP_BASES.has(base)) return path;
  const query = rest.join("?");
  return `overview?kind=${encodeURIComponent(base)}${query ? `&${query}` : ""}`;
}

/** بناء مسار الاستعلام لدالة admin الموحدة (?path=...) */
function buildAdminQuery(path: string): string {
  const effectivePath = remapAdminPathForHobby(path);
  const [pathPart, ...queryParts] = effectivePath.split("?");
  const queryPart = queryParts.join("?");
  return `path=${encodeURIComponent(pathPart)}${queryPart ? `&${queryPart}` : ""}`;
}

function isCrossOriginDevAdminApi(): boolean {
  if (typeof window === "undefined") return false;
  if (!runtimeEnv.isDev || !ADMIN_API_BASE) return false;
  try {
    const apiOrigin = new URL(ADMIN_API_BASE, window.location.origin).origin;
    return apiOrigin !== window.location.origin;
  } catch {
    return false;
  }
}

export async function callAdminApi<T>(path: string, options?: RequestInit): Promise<T | null> {
  // In local dev, avoid calling a cross-origin admin API directly from browser
  // to prevent CORS console noise and fallback to local sources gracefully.
  if (isCrossOriginDevAdminApi()) return null;
  const authToken = getAuthToken();
  const adminCode = useAdminState.getState().adminCode;
  const bearer = authToken ?? adminCode;
  if (!bearer) return null;
  const query = buildAdminQuery(path);
  return fetchJsonWithResilience<T>(
    `${ADMIN_API_PATH}?${query}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearer}`,
        ...(options?.headers ?? {})
      }
    },
    { retries: 1, breaker: adminApiBreaker, timeoutMs: runtimeEnv.isDev ? 25000 : 8000 }
  );
}

export interface AlertIncident {
  id: string;
  rule_key: string;
  severity: "low" | "medium" | "high" | "critical";
  segment: string;
  status: "open" | "ack" | "resolved";
  opened_at: string;
  last_seen_at: string;
  action_hint: string | null;
  checklist: Array<{ step: number; title: string; details: string }> | null;
  expected_impact: string | null;
  evidence: unknown;
}

export async function fetchAlertIncidents(): Promise<AlertIncident[] | null> {
  const apiData = await callAdminApi<{ incidents: AlertIncident[] }>("alerts");
  return apiData?.incidents ?? null;
}

export async function fetchSovereignInsights(): Promise<{
  insights: SovereignInsight[];
  stats: SovereignStats | null;
  error?: string;
  retryAfterSec?: number;
} | null> {
  const apiData = await callAdminApi<{ 
    insights: SovereignInsight[]; 
    stats: SovereignStats;
    error?: string;
    retryAfterSec?: number;
  }>("oracle-pulse");
  
  if (!apiData) return null;
  return {
    insights: apiData.insights || [],
    stats: apiData.stats || null,
    error: apiData.error,
    retryAfterSec: apiData.retryAfterSec
  };
}

export async function updateAlertIncidentStatus(
  id: string,
  status: "ack" | "resolved",
  reason?: string
): Promise<boolean> {
  const apiData = await callAdminApi<{ ok: boolean }>("alerts", {
    method: "PATCH",
    body: JSON.stringify({ id, status, reason: reason ?? null })
  });
  return Boolean(apiData?.ok);
}

export async function resetAlertIncidents(): Promise<boolean> {
  const apiData = await callAdminApi<{ ok: boolean }>("alerts", {
    method: "DELETE",
    body: JSON.stringify({ reason: "Manual reset from War Room" })
  });
  return Boolean(apiData?.ok);
}

const toSettingMap = (rows: Array<{ key: string; value: unknown }>) => {
  const map = new Map<string, unknown>();
  rows.forEach((row) => map.set(row.key, row.value));
  return map;
};

export interface ThemePalette {
  primary?: string; // teal — الأزرار الأساسية / النيون
  accent?: string; // amber — التنبيهات / الهايلايت
  nebulaBase?: string; // خلفية الفضاء الأساسية (space-mid / nebula)
  nebulaAccent?: string; // لون التوهج الجانبي في الخلفية
  glassBackground?: string; // درجة شفافية الكروت الزجاجية
  glassBorder?: string; // لون حدود الكروت الزجاجية
}

async function fetchSettings(keys: SystemSettingKey[]) {
  if (!isSupabaseReady || !supabase) return null;
  const { data, error } = await supabase
    .from(SETTINGS_TABLE)
    .select("key,value")
    .in("key", keys);
  if (error || !data) return null;
  return toSettingMap(data as Array<{ key: string; value: unknown }>);
}

async function saveSetting(key: SystemSettingKey, value: unknown) {
  if (!isSupabaseReady || !supabase) return false;
  const { error } = await supabase.from(SETTINGS_TABLE).upsert(
    {
      key,
      value
    },
    { onConflict: "key" }
  );
  return !error;
}

export async function fetchFeatureMode(key: FeatureFlagKey): Promise<FeatureFlagMode | null> {
  const flags = await fetchSettings(["feature_flags"]);
  if (!flags) return null;
  const val = flags.get("feature_flags") as Record<FeatureFlagKey, FeatureFlagMode>;
  return val?.[key] ?? null;
}

export async function updateFeatureMode(key: FeatureFlagKey, mode: FeatureFlagMode): Promise<boolean> {
  const flagsMap = await fetchSettings(["feature_flags"]);
  const current = (flagsMap?.get("feature_flags") as Record<FeatureFlagKey, FeatureFlagMode>) ?? {};
  return saveSetting("feature_flags", { ...current, [key]: mode });
}

export async function fetchScoringWeights(): Promise<ScoringWeights | null> {
  const data = await fetchSettings(["scoring_weights"]);
  return (data?.get("scoring_weights") as ScoringWeights) ?? null;
}

export async function updateScoringWeights(weights: ScoringWeights): Promise<boolean> {
  return saveSetting("scoring_weights", weights);
}

export async function fetchScoringThresholds(): Promise<ScoringThresholds | null> {
  const data = await fetchSettings(["scoring_thresholds"]);
  return (data?.get("scoring_thresholds") as ScoringThresholds) ?? null;
}

export async function updateScoringThresholds(thresholds: ScoringThresholds): Promise<boolean> {
  return saveSetting("scoring_thresholds", thresholds);
}

export async function fetchPulseCheckMode(): Promise<PulseCheckMode | null> {
  const data = await fetchSettings(["pulse_check_mode"]);
  return (data?.get("pulse_check_mode") as PulseCheckMode) ?? null;
}

export async function updatePulseCheckMode(mode: PulseCheckMode): Promise<boolean> {
  return saveSetting("pulse_check_mode", mode);
}

export async function savePulseCheckMode(mode: PulseCheckMode): Promise<boolean> {
  return updatePulseCheckMode(mode);
}

export async function fetchThemePalette(): Promise<ThemePalette | null> {
  const data = await fetchSettings(["theme_palette"]);
  return (data?.get("theme_palette") as ThemePalette) ?? null;
}

export async function updateThemePalette(palette: ThemePalette): Promise<boolean> {
  return saveSetting("theme_palette", palette);
}

export async function saveThemePalette(palette: ThemePalette): Promise<boolean> {
  return updateThemePalette(palette);
}

export async function fetchPulseCopyOverrides(): Promise<PulseCopyOverrides | null> {
  const data = await fetchSettings(["pulse_copy_overrides"]);
  return (data?.get("pulse_copy_overrides") as PulseCopyOverrides) ?? null;
}

export async function updatePulseCopyOverrides(overrides: PulseCopyOverrides): Promise<boolean> {
  return saveSetting("pulse_copy_overrides", overrides);
}

export async function fetchJourneyPaths(): Promise<JourneyPath[] | null> {
  const data = await fetchSettings(["journey_paths"]);
  return (data?.get("journey_paths") as JourneyPath[]) ?? null;
}

export async function updateJourneyPaths(paths: JourneyPath[]): Promise<boolean> {
  return saveSetting("journey_paths", paths);
}

export async function generateJourneyPath(intention: string): Promise<JourneyPathStep[] | null> {
  const apiData = await callAdminApi<{ ok: boolean; steps: JourneyPathStep[] }>("paths/generate", {
    method: "POST",
    body: JSON.stringify({ intention })
  });
  if (apiData?.ok && apiData.steps) {
    return apiData.steps;
  }
  return null;
}

export interface CognitiveSimulationResult {
  persona: string;
  theme: "amber" | "rose" | "slate" | "cyan" | "emerald";
  feedback: string;
  willComplete: boolean;
}

export async function simulateJourneyPath(pathSteps: JourneyPathStep[]): Promise<CognitiveSimulationResult[] | null> {
  const apiData = await callAdminApi<{ ok: boolean; simulation: CognitiveSimulationResult[] }>("paths/simulate", {
    method: "POST",
    body: JSON.stringify({ pathSteps })
  });
  if (apiData?.ok && apiData.simulation) {
    return apiData.simulation;
  }
  return null;
}

export async function auditJourneyPath(path: JourneyPath): Promise<any | null> {
  const apiData = await callAdminApi<{ ok: boolean; audit: any }>("paths/audit", {
    method: "POST",
    body: JSON.stringify({ path })
  });
  if (apiData?.ok && apiData.audit) {
    return apiData.audit;
  }
  return null;
}

export async function getRevenueMetrics(): Promise<any | null> {
  if (runtimeEnv.isDev) {
    const snapshot = await revenueService.getExecutiveSnapshot();
    return {
      mrr: snapshot.mrr,
      arr: snapshot.arr,
      churnRate: snapshot.churnRate,
      totalUsers: snapshot.activeSubscriptions,
      breakdown: {
        free: 0,
        premium: snapshot.activeSubscriptions,
        coach: 0
      }
    };
  }

  const apiData = await callAdminApi<{ ok: boolean; metrics: any }>("revenue/metrics", {
    method: "GET"
  });
  if (apiData?.ok && apiData.metrics) {
    return apiData.metrics;
  }

  const snapshot = await revenueService.getExecutiveSnapshot();
  return {
    mrr: snapshot.mrr,
    arr: snapshot.arr,
    churnRate: snapshot.churnRate,
    totalUsers: snapshot.activeSubscriptions,
    breakdown: {
      free: 0,
      premium: snapshot.activeSubscriptions,
      coach: 0
    }
  };
}

export async function fetchAdminConfig(): Promise<{
  featureFlags: Record<FeatureFlagKey, FeatureFlagMode> | null;
  systemPrompt: string | null;
  scoringWeights: ScoringWeights | null;
  scoringThresholds: ScoringThresholds | null;
  pulseCheckMode: PulseCheckMode | null;
  pulseCopyOverrides: PulseCopyOverrides | null;
} | null> {
  const data = await fetchSettings([
    "feature_flags",
    "system_prompt",
    "scoring_weights",
    "scoring_thresholds",
    "pulse_check_mode",
    "pulse_copy_overrides"
  ]);

  if (!data) return null;

  return {
    featureFlags: (data.get("feature_flags") as Record<FeatureFlagKey, FeatureFlagMode>) ?? null,
    systemPrompt: (data.get("system_prompt") as string) ?? null,
    scoringWeights: (data.get("scoring_weights") as ScoringWeights) ?? null,
    scoringThresholds: (data.get("scoring_thresholds") as ScoringThresholds) ?? null,
    pulseCheckMode: (data.get("pulse_check_mode") as PulseCheckMode) ?? null,
    pulseCopyOverrides: (data.get("pulse_copy_overrides") as PulseCopyOverrides) ?? null
  };
}

export async function saveFeatureFlags(flags: Record<FeatureFlagKey, FeatureFlagMode>): Promise<boolean> {
  return saveSetting("feature_flags", flags);
}

export async function saveSystemPrompt(prompt: string): Promise<boolean> {
  return saveSetting("system_prompt", prompt);
}

export async function saveScoring(
  weights: ScoringWeights,
  thresholds: ScoringThresholds
): Promise<boolean> {
  const [weightsSaved, thresholdsSaved] = await Promise.all([
    updateScoringWeights(weights),
    updateScoringThresholds(thresholds)
  ]);
  return weightsSaved && thresholdsSaved;
}

export async function fetchMarketingSpend(): Promise<number> {
  const data = await fetchSettings(["marketing_spend"]);
  return (data?.get("marketing_spend") as number) ?? 0;
}

export async function updateMarketingSpend(spend: number): Promise<boolean> {
  return saveSetting("marketing_spend", spend);
}

export async function fetchCampaignBudgets(): Promise<Record<string, number>> {
  const data = await fetchSettings(["campaign_budgets"]);
  return (data?.get("campaign_budgets") as Record<string, number>) ?? {};
}

export async function updateCampaignBudget(campaignId: string, budget: number): Promise<boolean> {
  const currentBudgets = await fetchCampaignBudgets();
  return saveSetting("campaign_budgets", { ...currentBudgets, [campaignId]: budget });
}

export interface AdminFeedbackEntry {
  id: string;
  sessionId: string;
  category: string;
  rating: number | null;
  message: string;
  createdAt: number | null;
}

export interface UtmBreakdownEntry {
  key: string;
  count: number;
}

export interface PotentialTravelersStats {
  total: number;
  last24h: number;
  bySource: UtmBreakdownEntry[];
  bySourceType: UtmBreakdownEntry[];
  byStatus: UtmBreakdownEntry[];
  byCampaign: UtmBreakdownEntry[];
  dailyTrend: Array<{ date: string; count: number }>;
  sovereignPassage: {
    potential: number;
    startClicks: number;
    pulseCompleted: number;
    journeyMaps: number;
    startClickRatePct: number | null;
    pulseCompletedRatePct: number | null;
    mapCreatedRatePct: number | null;
  };
}

export interface PulseCopyVariantStats {
  assigned: {
    energy: { a: number; b: number };
    mood: { a: number; b: number };
    focus: { a: number; b: number };
  };
  completed: {
    energy: { a: number; b: number };
    mood: { a: number; b: number };
    focus: { a: number; b: number };
  };
}

export interface PulseCopyVariantTrendStats {
  energy: Array<{ date: string; aCompleted: number; bCompleted: number; delta: number }>;
  mood: Array<{ date: string; aCompleted: number; bCompleted: number; delta: number }>;
  focus: Array<{ date: string; aCompleted: number; bCompleted: number; delta: number }>;
}

export interface RetentionCohortRow {
  cohortDate: string;
  cohortSize: number;
  d1: number;
  d3: number;
  d7: number;
  d30: number;
  d1Pct: number;
  d3Pct: number;
  d7Pct: number;
  d30Pct: number;
}

export type TopScenario = {
  key?: string;
  label: string;
  count: number;
  share?: number | null;
  percentage?: number | null;
  percent?: number | null;
};

export type PhaseOneGoalProgress = OverviewStats["phaseOneGoal"];

export interface OverviewStats {
  totalTravelers: number | null;
  activeConsciousnessNow: number | null;
  avgMood: number | null;
  aiTokensUsed: number | null;
  growthData: Array<{ date: string; paths: number; nodes: number }>;
  zones: Array<{ label: string; count: number }>;
  phaseOneGoal: {
    registeredTravelers: number;
    installedTravelers: number;
    addedPeers: number;
  };
  pulseEnergyWeekly: {
    points: Array<{ date: string; changed: number; unstable: number; completed: number; recommended: number; undo: number }>;
    unstableToCompletedPct: number | null;
  };
  moodWeekly: {
    points: Array<{ date: string; changed: number; unstable: number; completed: number }>;
    unstableToCompletedPct: number | null;
  };
  pulseCopyVariants: PulseCopyVariantStats;
  pulseCopyVariantTrend: PulseCopyVariantTrendStats;
  funnel: {
    steps: Array<{ label: string; count: number; key: string }>;
  };
  flowStats: {
    byStep: Record<string, number>;
    avgTimeToActionMs: number | null;
    addPersonCompletionRate: number | null;
    pulseAbandonedByReason: Record<string, number>;
  };
  conversionHealth: {
    pathStarted24h: number;
    journeyMapsTotal: number;
    addPersonOpened: number;
    addPersonDoneShowOnMap: number;
  };
  avgDwellByStep?: Record<string, number> | null;
  retentionCohorts?: RetentionCohortRow[] | null;
  utmBreakdown?: {
    sources: UtmBreakdownEntry[];
    mediums: UtmBreakdownEntry[];
    campaigns: UtmBreakdownEntry[];
  } | null;
  potentialTravelers?: PotentialTravelersStats;
  topScenarios?: TopScenario[] | null;
  verificationGapIndex?: number | null;
  awarenessGap?: {
    total?: number | null;
    resolved?: number | null;
    unresolved?: number | null;
    gapPercent?: number | null;
    byCategory?: Array<{ label: string; count: number }>;
  } | null;
  routingV2?: any;
  routingTelemetry?: any;
  taskFriction?: any[] | null;
  weeklyRhythm?: any;
  emergencyLogs?: any[] | null;
}

export interface AdminAiLog {
  id: string;
  userId: string | null;
  prompt: string;
  response: string;
  tokens: number;
  createdAt: number | null;
  source?: string;
  rating?: number | null;
}

export async function fetchAdminAiLogs(limit = 20): Promise<AdminAiLog[] | null> {
  const apiData = await callAdminApi<{ logs: Array<Record<string, unknown>> }>(`ai-logs?limit=${limit}`);
  if (!apiData?.logs) return null;
  return apiData.logs.map((row) => ({
    id: String(row.id ?? ""),
    userId: row.user_id ? String(row.user_id) : null,
    prompt: String(row.prompt ?? ""),
    response: String(row.response ?? ""),
    tokens: Number(row.tokens ?? 0),
    createdAt: row.created_at ? new Date(String(row.created_at)).getTime() : null
  }));
}

export async function fetchAiLogs(limit = 20): Promise<AiLogEntry[] | null> {
  const logs = await fetchAdminAiLogs(limit);
  if (!logs) return null;
  return logs.map((log) => ({
    id: log.id,
    source: log.source === "system" ? "system" : "playground",
    prompt: log.prompt,
    response: log.response,
    tokens: log.tokens,
    rating: log.rating === 1 ? "up" : log.rating === -1 ? "down" : undefined,
    createdAt: log.createdAt ?? Date.now()
  }));
}

export async function saveAiLog(entry: Partial<AiLogEntry>): Promise<boolean> {
  const apiData = await callAdminApi<{ ok: boolean }>("ai-logs", {
    method: "POST",
    body: JSON.stringify(entry)
  });
  return Boolean(apiData?.ok);
}

export async function rateAiLog(id: string, rating: "up" | "down" | 1 | -1): Promise<boolean> {
  const normalized = rating === "up" ? 1 : rating === "down" ? -1 : rating;
  const apiData = await callAdminApi<{ ok: boolean }>("ai-logs", {
    method: "PATCH",
    body: JSON.stringify({ id, rating: normalized })
  });
  return Boolean(apiData?.ok);
}

export async function fetchMissions(): Promise<AdminMission[] | null> {
  const apiData = await callAdminApi<{ missions: AdminMission[] }>("missions");
  return apiData?.missions ?? null;
}

export async function createMission(mission: Partial<AdminMission>): Promise<AdminMission | null> {
  const apiData = await callAdminApi<{ mission: AdminMission }>("missions", {
    method: "POST",
    body: JSON.stringify(mission)
  });
  return apiData?.mission ?? null;
}

export async function saveMission(mission: Partial<AdminMission>): Promise<AdminMission | null> {
  return createMission(mission);
}

export async function updateMission(id: string, mission: Partial<AdminMission>): Promise<boolean> {
  const apiData = await callAdminApi<{ ok: boolean }>("missions", {
    method: "PATCH",
    body: JSON.stringify({ id, ...mission })
  });
  return Boolean(apiData?.ok);
}

export async function deleteMission(id: string): Promise<boolean> {
  const apiData = await callAdminApi<{ ok: boolean }>("missions", {
    method: "DELETE",
    body: JSON.stringify({ id })
  });
  return Boolean(apiData?.ok);
}

export async function fetchBroadcasts(): Promise<AdminBroadcast[] | null> {
  const apiData = await callAdminApi<{ broadcasts: AdminBroadcast[] }>("broadcasts");
  return apiData?.broadcasts ?? null;
}

export async function createBroadcast(broadcast: Partial<AdminBroadcast>): Promise<AdminBroadcast | null> {
  const apiData = await callAdminApi<{ broadcast: AdminBroadcast }>("broadcasts", {
    method: "POST",
    body: JSON.stringify(broadcast)
  });
  return apiData?.broadcast ?? null;
}

export async function saveBroadcast(broadcast: Partial<AdminBroadcast>): Promise<AdminBroadcast | null> {
  return createBroadcast(broadcast);
}

export async function updateBroadcast(id: string, broadcast: Partial<AdminBroadcast>): Promise<boolean> {
  const apiData = await callAdminApi<{ ok: boolean }>("broadcasts", {
    method: "PATCH",
    body: JSON.stringify({ id, ...broadcast })
  });
  return Boolean(apiData?.ok);
}

export async function sendBroadcast(id: string): Promise<boolean> {
  const apiData = await callAdminApi<{ ok: boolean }>("broadcasts", {
    method: "POST",
    body: JSON.stringify({ action: "send", id })
  });
  return Boolean(apiData?.ok);
}

export async function deleteBroadcast(id: string): Promise<boolean> {
  const apiData = await callAdminApi<{ ok: boolean }>("broadcasts", {
    method: "DELETE",
    body: JSON.stringify({ id })
  });
  return Boolean(apiData?.ok);
}

export interface SupportTicketEntry {
  id: string;
  createdAt: number | null;
  updatedAt: number | null;
  source: string;
  status: string;
  priority: string;
  title: string;
  message: string;
  sessionId: string | null;
  category: string | null;
  assignee: string | null;
  metadata: Record<string, unknown> | null;
}

export interface AdminContentEntry {
  key: string;
  content: string;
  page: string | null;
  updatedAt: string | null;
  source?: "remote" | "fallback";
}

export interface AdminUserRow {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: number | null;
}

export interface FunnelStats {
  landing: number;
  entry: number;
  activation: number;
  engagement_d2: number;
  engagement_d7: number;
  conversion: number;
  segments?: Record<"mobile" | "desktop", FunnelStats>;
  healthScore?: {
    activation: number;
    engagement: number;
    overall: number;
  };
}

export interface BehavioralEvent {
  id: string;
  label: string;
  stage: string;
  severity: "low" | "medium" | "high";
  createdAt: number | null;
  event_name: string;
  params: Record<string, unknown> | null;
  user_id: string | null;
  created_at: string | null;
}

export interface HistogramPoint {
  bucket: string;
  count: number;
}

export interface SeoAuditFinding {
  id: string;
  severity: "critical" | "warning" | "passed";
  title: string;
  details: string;
  description?: string;
}

export interface SeoCheckDetails {
  title: { exists: boolean };
  description: { exists: boolean };
  viewport: boolean;
  canonical: boolean;
  robotsTxt: boolean;
  sitemapXml: boolean;
  schemaJsonLd: boolean;
  organizationSchema: boolean;
  softwareApplicationSchema: boolean;
  faqSchema: boolean;
  [key: string]: unknown;
}

export interface SeoAuditReport {
  url: string;
  score: number;
  findings: SeoAuditFinding[];
  checks: SeoCheckDetails;
  scores: { overall: number; seo: number; geo: number; health: number };
  counters: { critical: number; warning: number; passed: number };
  targetUrl?: string;
  finalUrl?: string;
  summary: {
    wordCount: number;
    h1Count: number;
    imagesWithAlt: number;
    images: number;
    internalLinks: number;
    externalLinks: number;
    schemaTypes: string[];
    [key: string]: number | string | string[] | null;
  };
}

export interface SeoAutofixResult {
  ok: boolean;
  touched: string[];
  message?: string;
  appliedCount?: number;
  fixes?: Array<{ key: string; label?: string; message: string; status?: string }>;
}

export interface OwnerAlertsResponse {
  generatedAt: string;
  since: string;
  newVisitors: {
    count: number;
    sessionIds: string[];
  };
  logins: {
    count: number;
    sessionIds: string[];
  };
  installs: {
    count: number;
    sessionIds: string[];
  };
  phaseOne: {
    registeredTravelers: number;
    installedTravelers: number;
    addedPeers: number;
    target: number;
    registeredReached: boolean;
    installedReached: boolean;
    addedReached: boolean;
    fullyCompleted: boolean;
  };
}

export type OpsInsights = SharedOpsInsights;
export type ExecutiveReport = SharedExecutiveReport;
export type SystemHealthReport = SharedSystemHealthReport;
export type SecuritySignalsReport = SharedSecuritySignalsReport;

export interface OwnerOpsReport {
  generatedAt: string;
  status: "healthy" | "warning" | "critical";
  systemHealth: SystemHealthReport | null;
  securitySignals: SecuritySignalsReport | null;
  ownerAlerts: OwnerAlertsResponse | null;
}

export interface AIInterpretation {
  primary_pattern?: string;
  state?: string;
  focus_areas?: string[];
  anomalies?: string[];
  [key: string]: any;
}

export interface TransformationDiagnosis {
  riskLevel?: string;
  rootTension?: string;
  protocolKey?: string;
  commitmentPledge?: string;
  [key: string]: any;
}

export interface JourneyMapSnapshot {
  sessionId: string;
  nodes: MapNode[];
  updatedAt: number | null;
  aiInterpretation?: AIInterpretation | null;
  transformationDiagnosis?: TransformationDiagnosis | null;
}

export interface SessionEventRow {
  id: string;
  sessionId: string;
  type: string;
  payload: Record<string, unknown> | null;
  createdAt: number | null;
}

export interface VisitorSessionSummary {
  sessionId: string;
  firstSeen: number | null;
  lastSeen: number | null;
  eventsCount: number;
  pathStarts: number;
  taskCompletions: number;
  nodesAdded: number;
  lastFlowStep: string | null;
  linkedUserId?: string | null;
  linkedEmail?: string | null;
  hasAiInterpretation?: boolean;
  aiPattern?: string | null;
  aiState?: string | null;
  riskLevel?: string | null;
  protocolKey?: string | null;
  rootTension?: string | null;
  commitmentPledge?: string | null;
}

export interface UserStateRow {
  deviceToken: string;
  ownerId?: string | null;
  updatedAt: number | null;
  data?: Record<string, string>;
}

export async function fetchUserStates(limit = 50): Promise<UserStateRow[] | null> {
  const apiData = await callAdminApi<{ rows: Array<{ device_token: string; owner_id?: string | null; updated_at?: string }> }>(
    `user-state?limit=${limit}`
  );
  if (apiData?.rows) {
    return apiData.rows.map((row) => ({
      deviceToken: row.device_token,
      ownerId: row.owner_id ?? null,
      updatedAt: row.updated_at ? new Date(String(row.updated_at)).getTime() : null
    }));
  }
  return null;
}

export async function fetchUserStateDetail(params: { deviceToken?: string; ownerId?: string }): Promise<UserStateRow | null> {
  const query = params.deviceToken
    ? `user-state?deviceToken=${encodeURIComponent(params.deviceToken)}`
    : params.ownerId
      ? `user-state?ownerId=${encodeURIComponent(params.ownerId)}`
      : null;
  if (!query) return null;
  const apiData = await callAdminApi<{ deviceToken: string; ownerId?: string | null; updatedAt?: string; data?: Record<string, string> }>(query);
  if (!apiData) return null;
  return {
    deviceToken: apiData.deviceToken,
    ownerId: apiData.ownerId ?? null,
    updatedAt: apiData.updatedAt ? new Date(String(apiData.updatedAt)).getTime() : null,
    data: apiData.data ?? {}
  };
}

export interface UserStateExport {
  exportedAt: string;
  count: number;
  rows: Array<{ device_token: string; owner_id?: string | null; data: Record<string, unknown>; updated_at?: string }>;
}

export async function exportUserStates(limit = 200): Promise<UserStateExport | null> {
  const apiData = await callAdminApi<UserStateExport>(`user-state-export?limit=${limit}`);
  return apiData ?? null;
}

export async function importUserStates(rows: UserStateExport["rows"]): Promise<boolean> {
  const apiRes = await callAdminApi<{ ok: boolean; count?: number }>("user-state-import", {
    method: "POST",
    body: JSON.stringify({ rows })
  });
  return Boolean(apiRes?.ok);
}

export interface DailyReport {
  date: string;
  totalEvents: number;
  uniqueSessions: number;
  typeCounts: Record<string, number>;
  topSessions: Array<{ sessionId: string; total: number; paths: number; tasks: number; nodes: number; moods: number }>;
}

export async function fetchDailyReport(date?: string): Promise<DailyReport | null> {
  const query = date ? `daily-report?date=${encodeURIComponent(date)}` : "daily-report";
  const apiData = await callAdminApi<DailyReport>(query);
  return apiData ?? null;
}

export type WeeklyReport = SharedWeeklyReport;

export async function fetchWeeklyReport(days: 7 | 14 | 30 = 7): Promise<WeeklyReport | null> {
  const apiData = await callAdminApi<WeeklyReport>(`weekly-report?days=${days}`);
  return apiData ?? null;
}

export type CronReportResponse = SharedCronReportResponse;

export async function runCronReport(period: "daily" | "weekly"): Promise<CronReportResponse | null> {
  const apiData = await callAdminApi<CronReportResponse>(`overview?kind=cron-report&type=${period}`, {
    method: "POST"
  });
  return apiData ?? null;
}

export async function exportFullData(limit = 2000): Promise<Record<string, unknown> | null> {
  const apiData = await callAdminApi<Record<string, unknown>>(`full-export?limit=${limit}`);
  return apiData ?? null;
}

export async function updateUserRole(id: string, role: string): Promise<boolean> {
  const apiRes = await callAdminApi<{ ok: boolean }>("roles", {
    method: "POST",
    body: JSON.stringify({ id, role })
  });
  return Boolean(apiRes?.ok);
}

export async function fetchJourneyMap(sessionId: string): Promise<JourneyMapSnapshot | null> {
  const apiData = await callAdminApi<{ sessionId: string; nodes: MapNode[]; updatedAt?: string; aiInterpretation?: string | null; transformationDiagnosis?: any | null }>(
    `journey-map?sessionId=${encodeURIComponent(sessionId)}`
  );
  if (apiData) {
    return {
      sessionId: apiData.sessionId ?? sessionId,
      nodes: apiData.nodes ?? [],
      updatedAt: apiData.updatedAt ? new Date(String(apiData.updatedAt)).getTime() : null,
      aiInterpretation: apiData.aiInterpretation as any,
      transformationDiagnosis: apiData.transformationDiagnosis
    };
  }
  if (!isSupabaseReady || !supabase) return null;
  const { data, error } = await supabase
    .from("journey_maps")
    .select("session_id,nodes,updated_at,ai_interpretation,transformation_diagnosis")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    sessionId: String(data.session_id ?? sessionId),
    nodes: (data.nodes as MapNode[]) ?? [],
    updatedAt: data.updated_at ? new Date(String(data.updated_at)).getTime() : null,
    aiInterpretation: (typeof data.ai_interpretation === 'string' ? JSON.parse(data.ai_interpretation) : data.ai_interpretation) as unknown as AIInterpretation,
    transformationDiagnosis: (typeof data.transformation_diagnosis === 'string' ? JSON.parse(data.transformation_diagnosis) : data.transformation_diagnosis) as unknown as TransformationDiagnosis
  };
}

export async function fetchSessionEvents(
  sessionId: string,
  limit = 200
): Promise<SessionEventRow[] | null> {
  const sid = sessionId.trim();
  if (!sid) return null;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 1000) : 200;
  
  const apiData = await callAdminApi<{ events: SessionEventRow[] }>(
    `session-events?sessionId=${encodeURIComponent(sid)}&limit=${safeLimit}`
  );
  
  if (apiData?.events) {
    return apiData.events;
  }
  
  return null;
}

export async function fetchVisitorSessions(limit = 300): Promise<VisitorSessionSummary[] | null> {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 1000) : 300;
  const apiData = await callAdminApi<VisitorSessionSummary[]>(`overview?kind=visitor-sessions&limit=${safeLimit}`);
  return apiData ?? null;
}

export async function fetchFeedbackEntries(query?: {
  limit?: number;
  search?: string;
}): Promise<AdminFeedbackEntry[] | null> {
  const params = new URLSearchParams();
  if (typeof query?.limit === "number" && Number.isFinite(query.limit) && query.limit > 0) {
    params.set("limit", String(Math.floor(query.limit)));
  }
  if (query?.search && query.search.trim()) {
    params.set("search", query.search.trim());
  }
  const path = params.toString()
    ? `overview?kind=feedback&${params.toString()}`
    : "overview?kind=feedback";

  const apiData = await callAdminApi<{ entries: Array<Record<string, unknown>> }>(path);
  if (!apiData?.entries) return null;

  return apiData.entries.map((row) => ({
    id: String(row.id ?? row.created_at ?? row.session_id ?? `${Date.now()}`),
    sessionId: String(row.session_id ?? row.sessionId ?? "anonymous"),
    category: String(row.category ?? "general"),
    rating: typeof row.rating === "number" ? row.rating : null,
    message: String(row.message ?? ""),
    createdAt: row.created_at ? new Date(String(row.created_at)).getTime() : null
  }));
}

export async function fetchOwnerAlerts(query?: {
  since?: string;
  phaseTarget?: number;
}): Promise<OwnerAlertsResponse | null> {
  const params = new URLSearchParams();
  if (query?.since && query.since.trim()) params.set("since", query.since.trim());
  if (typeof query?.phaseTarget === "number" && Number.isFinite(query.phaseTarget) && query.phaseTarget > 0) {
    params.set("phaseTarget", String(Math.floor(query.phaseTarget)));
  }
  const path = params.toString()
    ? `overview?kind=owner-alerts&${params.toString()}`
    : "overview?kind=owner-alerts";
  return await callAdminApi<OwnerAlertsResponse>(path);
}

export async function fetchSupportTickets(query?: {
  limit?: number;
  search?: string;
  status?: string;
}): Promise<SupportTicketEntry[] | null> {
  const params = new URLSearchParams();
  if (typeof query?.limit === "number" && Number.isFinite(query.limit) && query.limit > 0) {
    params.set("limit", String(Math.floor(query.limit)));
  }
  if (query?.search && query.search.trim()) params.set("search", query.search.trim());
  if (query?.status && query.status.trim()) params.set("status", query.status.trim());

  const path = params.toString()
    ? `overview?kind=support-tickets&${params.toString()}`
    : "overview?kind=support-tickets";
  const apiData = await callAdminApi<{ tickets: Array<Record<string, unknown>> }>(path);
  if (!apiData?.tickets) return null;
  return apiData.tickets.map((row) => ({
    id: String(row.id ?? ""),
    createdAt: row.created_at ? new Date(String(row.created_at)).getTime() : null,
    updatedAt: row.updated_at ? new Date(String(row.updated_at)).getTime() : null,
    source: String(row.source ?? "manual"),
    status: String(row.status ?? "open"),
    priority: String(row.priority ?? "normal"),
    title: String(row.title ?? ""),
    message: String(row.message ?? ""),
    sessionId: row.session_id ? String(row.session_id) : null,
    category: row.category ? String(row.category) : null,
    assignee: row.assignee ? String(row.assignee) : null,
    metadata: row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : null
  }));
}

export async function fetchUsers(limit = 100): Promise<AdminUserRow[] | null> {
  if (!isSupabaseReady || !supabase) return [];
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 200) : 100;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id ?? ""),
    fullName: String(row.full_name ?? row.email ?? "Unknown"),
    email: String(row.email ?? ""),
    role: String(row.role ?? "user"),
    createdAt: row.created_at ? new Date(String(row.created_at)).getTime() : null
  }));
}

export async function fetchFunnelAnalytics(): Promise<FunnelStats | null> {
  const overview = await fetchOverviewStats();
  const totalTravelers = overview?.totalTravelers ?? 0;
  const activeConsciousnessNow = overview?.activeConsciousnessNow ?? 0;
  const phaseRegistered = overview?.phaseOneGoal?.registeredTravelers ?? 0;

  const base: FunnelStats = {
    landing: totalTravelers,
    entry: activeConsciousnessNow,
    activation: phaseRegistered,
    engagement_d2: Math.round(activeConsciousnessNow * 0.6),
    engagement_d7: Math.round(activeConsciousnessNow * 0.35),
    conversion: Math.round(activeConsciousnessNow * 0.2),
    healthScore: {
      activation: 68,
      engagement: 75,
      overall: 71
    }
  };

  return {
    ...base,
    segments: {
      mobile: { ...base },
      desktop: { ...base }
    }
  };
}

export async function fetchLiveBehavioralEvents(): Promise<BehavioralEvent[] | null> {
  const apiData = await callAdminApi<BehavioralEvent[]>("analytics/events/live");
  if (apiData) return apiData;
  return [
    {
      id: "fallback-behavior-1",
      label: "hesitation_detected",
      stage: "activation",
      severity: "medium",
      createdAt: Date.now(),
      event_name: "hesitation_detected",
      params: { device_type: "web" },
      user_id: null,
      created_at: new Date().toISOString()
    }
  ];
}

export async function fetchTimeToActionHistogram(): Promise<HistogramPoint[] | null> {
  const apiData = await callAdminApi<HistogramPoint[]>("analytics/histogram/time-to-pulse");
  if (apiData) return apiData;
  return [
    { bucket: "0-5s", count: 12 },
    { bucket: "5-15s", count: 45 },
    { bucket: "15-30s", count: 28 },
    { bucket: "30s+", count: 15 }
  ];
}

export async function fetchAppContentEntries(query?: {
  page?: string;
  search?: string;
  limit?: number;
}): Promise<AdminContentEntry[]> {
  if (!isSupabaseReady || !supabase) return [];
  let req = supabase
    .from("app_content")
    .select("key, content, page, updated_at")
    .order("updated_at", { ascending: false });

  if (query?.page) req = req.eq("page", query.page);
  if (query?.search) req = req.ilike("key", `%${query.search}%`);

  const { data, error } = await req;
  if (error || !data) return [];

  return (data as Array<Record<string, unknown>>).map((row) => ({
    key: String(row.key ?? ""),
    content: String(row.content ?? ""),
    page: row.page ? String(row.page) : null,
    updatedAt: row.updated_at ? String(row.updated_at) : null,
    source: "remote"
  }));
}

export async function saveAppContentEntry(entry: {
  key: string;
  content: string;
  page?: string | null;
}): Promise<boolean> {
  if (!isSupabaseReady || !supabase) return false;
  const { error } = await supabase.from("app_content").upsert(
    {
      key: entry.key,
      content: entry.content,
      page: entry.page ?? null,
      updated_at: new Date().toISOString()
    },
    { onConflict: "key" }
  );
  return !error;
}

export async function deleteAppContentEntry(key: string): Promise<boolean> {
  if (!isSupabaseReady || !supabase) return false;
  const { error } = await supabase.from("app_content").delete().eq("key", key);
  return !error;
}

export async function runSeoAudit(url: string): Promise<SeoAuditReport | null> {
  const apiData = await callAdminApi<SeoAuditReport>("seo/audit", {
    method: "POST",
    body: JSON.stringify({ url })
  });

  if (apiData) return apiData;

  return {
    url,
    score: 0,
    findings: [],
    checks: {
      title: { exists: false },
      description: { exists: false },
      viewport: false,
      canonical: false,
      robotsTxt: false,
      sitemapXml: false,
      schemaJsonLd: false,
      organizationSchema: false,
      softwareApplicationSchema: false,
      faqSchema: false
    },
    scores: { overall: 0, seo: 0, geo: 0, health: 0 },
    counters: { critical: 0, warning: 0, passed: 0 },
    targetUrl: url,
    finalUrl: url,
    summary: {
      wordCount: 0,
      h1Count: 0,
      imagesWithAlt: 0,
      images: 0,
      internalLinks: 0,
      externalLinks: 0,
      schemaTypes: []
    }
  };
}

export async function applySeoAutofix(checks: string[]): Promise<SeoAutofixResult | null> {
  const apiData = await callAdminApi<SeoAutofixResult>("seo/autofix", {
    method: "POST",
    body: JSON.stringify({ checks })
  });

  if (apiData) return apiData;

  return {
    ok: false,
    touched: [],
    message: "seo_autofix_unavailable",
    appliedCount: 0,
    fixes: []
  };
}

export async function createSupportTicket(payload: {
  title: string;
  message: string;
  source?: string;
  priority?: string;
  status?: string;
  sessionId?: string | null;
  category?: string | null;
  assignee?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<SupportTicketEntry | null> {
  const apiData = await callAdminApi<{ ticket?: Record<string, unknown> }>("overview?kind=support-tickets", {
    method: "POST",
    body: JSON.stringify({
      action: "create",
      ...payload
    })
  });
  const row = apiData?.ticket;
  if (!row) return null;
  return {
    id: String(row.id ?? ""),
    createdAt: row.created_at ? new Date(String(row.created_at)).getTime() : null,
    updatedAt: row.updated_at ? new Date(String(row.updated_at)).getTime() : null,
    source: String(row.source ?? "manual"),
    status: String(row.status ?? "open"),
    priority: String(row.priority ?? "normal"),
    title: String(row.title ?? ""),
    message: String(row.message ?? ""),
    sessionId: row.session_id ? String(row.session_id) : null,
    category: row.category ? String(row.category) : null,
    assignee: row.assignee ? String(row.assignee) : null,
    metadata: row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : null
  };
}

export async function updateSupportTicketStatus(payload: {
  id: string;
  status: "open" | "in_progress" | "resolved";
  assignee?: string | null;
}): Promise<SupportTicketEntry | null> {
  const apiData = await callAdminApi<{ ticket?: Record<string, unknown> }>("overview?kind=support-tickets", {
    method: "POST",
    body: JSON.stringify({
      action: "update-status",
      ...payload
    })
  });
  const row = apiData?.ticket;
  if (!row) return null;
  return {
    id: String(row.id ?? ""),
    createdAt: row.created_at ? new Date(String(row.created_at)).getTime() : null,
    updatedAt: row.updated_at ? new Date(String(row.updated_at)).getTime() : null,
    source: String(row.source ?? "manual"),
    status: String(row.status ?? "open"),
    priority: String(row.priority ?? "normal"),
    title: String(row.title ?? ""),
    message: String(row.message ?? ""),
    sessionId: row.session_id ? String(row.session_id) : null,
    category: row.category ? String(row.category) : null,
    assignee: row.assignee ? String(row.assignee) : null,
    metadata: row.metadata && typeof row.metadata === "object" ? (row.metadata as Record<string, unknown>) : null
  };
}

export async function fetchOverviewStats(): Promise<OverviewStats | null> {
  const apiData = await callAdminApi<OverviewStats>("overview");
  if (apiData) return apiData;
  if (!isSupabaseReady || !supabase) return null;
  const now = new Date();
  const isoDate = (d: Date) => d.toISOString().slice(0, 10);
  const last7Dates: string[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
    return isoDate(d);
  });
  const last14Dates: string[] = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now.getTime() - (13 - i) * 24 * 60 * 60 * 1000);
    return isoDate(d);
  });
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: usersCount },
    { count: activeCount },
    { data: events },
    { count: aiLogsCount },
    { count: addedPeopleCount },
    { count: journeyMapsTotal },
    { count: pathStarted24h },
    { data: installedSessionsRows },
    { count: marketingLeadsTotalCount },
    { count: marketingLeadsLast24hCount },
    { data: marketingLeadsRows }
  ] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("routing_events").select("id", { count: "exact", head: true }).gte("occurred_at", fiveMinAgo),
      supabase
        .from("routing_events")
        .select("session_id,event_type,payload,occurred_at")
        .gte("occurred_at", thirtyDaysAgo)
        .order("occurred_at", { ascending: true })
        .limit(10000),
      supabase.from("admin_ai_logs").select("id", { count: "exact", head: true }),
      supabase.from("routing_events").select("id", { count: "exact", head: true }).eq("event_type", "node_added"),
      supabase.from("journey_maps").select("session_id", { count: "exact", head: true }),
      supabase.from("routing_events").select("id", { count: "exact", head: true }).eq("event_type", "path_started").gte("occurred_at", twentyFourHoursAgo),
      supabase
        .from("routing_events")
        .select("session_id")
        .eq("event_type", "flow_event")
        .contains("payload", { step: "install_clicked" })
        .not("session_id", "is", null)
        .limit(5000),
      supabase.from("marketing_leads").select("email", { count: "exact", head: true }),
      supabase.from("marketing_leads").select("email", { count: "exact", head: true }).gte("created_at", twentyFourHoursAgo),
      supabase
        .from("marketing_leads")
        .select("source,source_type,status,utm,created_at")
        .gte("created_at", fourteenDaysAgo)
        .order("created_at", { ascending: true })
        .limit(10000)
    ]);
  const installedUsers = new Set(
    ((installedSessionsRows ?? []) as Array<{ session_id?: unknown }>)
      .map((row) => String(row.session_id ?? "").trim())
      .filter(Boolean)
  ).size;
  const marketingBySource = new Map<string, number>();
  const marketingBySourceType = new Map<string, number>();
  const marketingByStatus = new Map<string, number>();
  const marketingByCampaign = new Map<string, number>();
  const marketingByDate = new Map<string, number>();
  for (const day of last14Dates) marketingByDate.set(day, 0);
  for (const row of (marketingLeadsRows ?? []) as Array<Record<string, unknown>>) {
    const source = String(row.source ?? "").trim() || "landing";
    marketingBySource.set(source, (marketingBySource.get(source) ?? 0) + 1);
    const sourceType = String(row.source_type ?? "").trim() || "website";
    marketingBySourceType.set(sourceType, (marketingBySourceType.get(sourceType) ?? 0) + 1);
    const status = String(row.status ?? "").trim() || "new";
    marketingByStatus.set(status, (marketingByStatus.get(status) ?? 0) + 1);
    const utm = (row.utm as Record<string, unknown> | null) ?? null;
    const campaign = String(utm?.utm_campaign ?? "").trim();
    if (campaign) {
      marketingByCampaign.set(campaign, (marketingByCampaign.get(campaign) ?? 0) + 1);
    }
    const day = String(row.created_at ?? "").slice(0, 10);
    if (marketingByDate.has(day)) {
      marketingByDate.set(day, (marketingByDate.get(day) ?? 0) + 1);
    }
  }
  const toTopEntries = (map: Map<string, number>): UtmBreakdownEntry[] =>
    Array.from(map.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

  if (!events) {
    return {
      totalTravelers: usersCount ?? null,
      activeConsciousnessNow: activeCount ?? null,
      avgMood: null,
      aiTokensUsed: aiLogsCount ?? null,
      growthData: [],
      zones: [],
      phaseOneGoal: {
        registeredTravelers: usersCount ?? 0,
        installedTravelers: installedUsers,
        addedPeers: addedPeopleCount ?? 0
      },
      pulseEnergyWeekly: {
        points: last7Dates.map((date) => ({
          date: date.slice(5),
          changed: 0,
          unstable: 0,
          completed: 0,
          recommended: 0,
          undo: 0
        })),
        unstableToCompletedPct: null
      },
      moodWeekly: {
        points: last7Dates.map((date) => ({
          date: date.slice(5),
          changed: 0,
          unstable: 0,
          completed: 0
        })),
        unstableToCompletedPct: null
      },
      pulseCopyVariants: {
        assigned: {
          energy: { a: 0, b: 0 },
          mood: { a: 0, b: 0 },
          focus: { a: 0, b: 0 }
        },
        completed: {
          energy: { a: 0, b: 0 },
          mood: { a: 0, b: 0 },
          focus: { a: 0, b: 0 }
        }
      },
      pulseCopyVariantTrend: {
        energy: last7Dates.map((date) => ({ date: date.slice(5), aCompleted: 0, bCompleted: 0, delta: 0 })),
        mood: last7Dates.map((date) => ({ date: date.slice(5), aCompleted: 0, bCompleted: 0, delta: 0 })),
        focus: last7Dates.map((date) => ({ date: date.slice(5), aCompleted: 0, bCompleted: 0, delta: 0 }))
      },
      funnel: { steps: [] },
      flowStats: {
        byStep: {},
        avgTimeToActionMs: null,
        addPersonCompletionRate: null,
        pulseAbandonedByReason: {}
      },
      conversionHealth: {
        pathStarted24h: pathStarted24h ?? 0,
        journeyMapsTotal: journeyMapsTotal ?? 0,
        addPersonOpened: 0,
        addPersonDoneShowOnMap: 0
      },
      verificationGapIndex: (marketingLeadsTotalCount ?? 0) > 0 
        ? Math.max(0, Math.round((( (marketingLeadsTotalCount ?? 0) - (usersCount ?? 0) ) / (marketingLeadsTotalCount ?? 0)) * 100)) 
        : 0,
      potentialTravelers: {
        total: marketingLeadsTotalCount ?? 0,
        last24h: marketingLeadsLast24hCount ?? 0,
        bySource: toTopEntries(marketingBySource),
        bySourceType: toTopEntries(marketingBySourceType),
        byStatus: toTopEntries(marketingByStatus),
        byCampaign: toTopEntries(marketingByCampaign),
        dailyTrend: last14Dates.map((date) => ({ date, count: marketingByDate.get(date) ?? 0 })),
        sovereignPassage: {
          potential: marketingLeadsTotalCount ?? 0,
          startClicks: 0,
          pulseCompleted: 0,
          journeyMaps: journeyMapsTotal ?? 0,
          startClickRatePct: null,
          pulseCompletedRatePct: null,
          mapCreatedRatePct: null
        }
      }
    };
  }

  const growthMap = new Map<string, { paths: number; nodes: number }>();
  const zoneMap = new Map<string, number>();
  let moodSum = 0;
  let moodCount = 0;

  const flowCounts: Record<string, number> = {};
  const pulseAbandonedByReason: Record<string, number> = {};
  let flowTimeToActionSum = 0;
  let flowTimeToActionCount = 0;
  const sessionVariantMap = new Map<string, { energy: "a" | "b" | null; mood: "a" | "b" | null; focus: "a" | "b" | null }>();
  const pulseCopyVariants: PulseCopyVariantStats = {
    assigned: {
      energy: { a: 0, b: 0 },
      mood: { a: 0, b: 0 },
      focus: { a: 0, b: 0 }
    },
    completed: {
      energy: { a: 0, b: 0 },
      mood: { a: 0, b: 0 },
      focus: { a: 0, b: 0 }
    }
  };
  const pulseCopyVariantTrendMap = {
    energy: new Map<string, { aCompleted: number; bCompleted: number }>(),
    mood: new Map<string, { aCompleted: number; bCompleted: number }>(),
    focus: new Map<string, { aCompleted: number; bCompleted: number }>()
  };
  for (const date of last7Dates) {
    pulseCopyVariantTrendMap.energy.set(date, { aCompleted: 0, bCompleted: 0 });
    pulseCopyVariantTrendMap.mood.set(date, { aCompleted: 0, bCompleted: 0 });
    pulseCopyVariantTrendMap.focus.set(date, { aCompleted: 0, bCompleted: 0 });
  }

  // Dwell time aggregation
  const dwellTimeByStep = new Map<string, { sum: number; count: number }>();

  // UTM breakdown
  const utmSources = new Map<string, number>();
  const utmMediums = new Map<string, number>();
  const utmCampaigns = new Map<string, number>();

  // Retention cohorts
  const sessionFirstSeen = new Map<string, string>();
  const sessionActiveDays = new Map<string, Set<string>>();

  for (const row of events as Array<Record<string, unknown>>) {
    const createdAt = String(row.created_at ?? "");
    const date = createdAt ? createdAt.slice(5, 10) : "--";
    if (!growthMap.has(date)) growthMap.set(date, { paths: 0, nodes: 0 });
    const bucket = growthMap.get(date)!;
    const type = String(row.type ?? "");
    const payload = row.payload as Record<string, unknown> | null;
    if (type === "path_started") bucket.paths += 1;
    if (type === "node_added") bucket.nodes += 1;
    if (payload?.moodScore != null) {
      moodSum += Number(payload.moodScore);
      moodCount += 1;
    }
    if (payload?.zone) {
      const zone = String(payload.zone);
      zoneMap.set(zone, (zoneMap.get(zone) ?? 0) + 1);
    }
    if (type === "flow_event") {
      const step = String(payload?.step ?? "");
      const sessionId = String(row.session_id ?? "");
      if (step) {
        flowCounts[step] = (flowCounts[step] ?? 0) + 1;
        if (step === "pulse_copy_variant_assigned") {
          const extra = payload?.extra as Record<string, unknown> | undefined;
          const energyVariant = extra?.energyVariant === "a" || extra?.energyVariant === "b" ? (extra.energyVariant as "a" | "b") : null;
          const moodVariant = extra?.moodVariant === "a" || extra?.moodVariant === "b" ? (extra.moodVariant as "a" | "b") : null;
          const focusVariant = extra?.focusVariant === "a" || extra?.focusVariant === "b" ? (extra.focusVariant as "a" | "b") : null;

          if (energyVariant) pulseCopyVariants.assigned.energy[energyVariant] += 1;
          if (moodVariant) pulseCopyVariants.assigned.mood[moodVariant] += 1;
          if (focusVariant) pulseCopyVariants.assigned.focus[focusVariant] += 1;
          if (sessionId) {
            sessionVariantMap.set(sessionId, { energy: energyVariant, mood: moodVariant, focus: focusVariant });
          }
        }
        if (step === "pulse_abandoned") {
          const extra = payload?.extra as Record<string, unknown> | undefined;
          const reason = typeof extra?.closeReason === "string" ? extra.closeReason : "unknown";
          pulseAbandonedByReason[reason] = (pulseAbandonedByReason[reason] ?? 0) + 1;
        }
      }
      if (typeof payload?.timeToAction === "number") {
        flowTimeToActionSum += payload.timeToAction;
        flowTimeToActionCount += 1;
      }
      if (step) {
        const extra = payload?.extra as Record<string, unknown> | undefined;
        const dwell = typeof extra?.dwellTime === "number" ? extra.dwellTime : null;
        if (dwell != null && dwell > 0 && dwell < 3600000) {
          const b = dwellTimeByStep.get(step) ?? { sum: 0, count: 0 };
          b.sum += dwell;
          b.count += 1;
          dwellTimeByStep.set(step, b);
        }
        const utm = extra?.utm as Record<string, string> | undefined;
        if (utm) {
          if (utm.utm_source) utmSources.set(utm.utm_source, (utmSources.get(utm.utm_source) ?? 0) + 1);
          if (utm.utm_medium) utmMediums.set(utm.utm_medium, (utmMediums.get(utm.utm_medium) ?? 0) + 1);
          if (utm.utm_campaign) utmCampaigns.set(utm.utm_campaign, (utmCampaigns.get(utm.utm_campaign) ?? 0) + 1);
        }
      }
    }
    const sid = String(row.session_id ?? "").trim();
    const fullDay = createdAt.slice(0, 10);
    if (sid && fullDay.length === 10) {
      if (!sessionFirstSeen.has(sid) || fullDay < sessionFirstSeen.get(sid)!) {
        sessionFirstSeen.set(sid, fullDay);
      }
      if (!sessionActiveDays.has(sid)) sessionActiveDays.set(sid, new Set());
      sessionActiveDays.get(sid)!.add(fullDay);
    }
  }

  for (const date of last7Dates) {
    const energyPoint = pulseCopyVariantTrendMap.energy.get(date) ?? { aCompleted: 0, bCompleted: 0 };
    const moodPoint = pulseCopyVariantTrendMap.mood.get(date) ?? { aCompleted: 0, bCompleted: 0 };
    const focusPoint = pulseCopyVariantTrendMap.focus.get(date) ?? { aCompleted: 0, bCompleted: 0 };
  }

  const growthData = Array.from(growthMap.entries()).map(([date, value]) => ({
    date,
    paths: value.paths,
    nodes: value.nodes
  }));

  const pulseEnergyWeeklyMap = new Map<string, { changed: number; unstable: number; completed: number; recommended: number; undo: number }>();
  for (const date of last7Dates) pulseEnergyWeeklyMap.set(date, { changed: 0, unstable: 0, completed: 0, recommended: 0, undo: 0 });

  for (const row of events as Array<Record<string, unknown>>) {
    const createdAt = String(row.created_at ?? "");
    const day = createdAt.slice(0, 10);
    if (!pulseEnergyWeeklyMap.has(day) || String(row.type ?? "") !== "flow_event") continue;
    const payload = row.payload as Record<string, unknown> | null;
    const step = String(payload?.step ?? "");
    const point = pulseEnergyWeeklyMap.get(day)!;
    if (step === "pulse_energy_changed") point.changed += 1;
    if (step === "pulse_energy_unstable") point.unstable += 1;
    if (step === "pulse_energy_weekly_recommendation_applied") point.recommended += 1;
    if (step === "pulse_energy_undo_applied") point.undo += 1;
    if (step === "pulse_completed") point.completed += 1;
  }

  const pulseEnergyWeeklyPoints = last7Dates.map((date) => ({ date: date.slice(5), ...(pulseEnergyWeeklyMap.get(date)!) }));
  const totalWeeklyUnstable = pulseEnergyWeeklyPoints.reduce((sum, item) => sum + item.unstable, 0);
  const totalWeeklyCompleted = pulseEnergyWeeklyPoints.reduce((sum, item) => sum + item.completed, 0);
  const unstableToCompletedPct = totalWeeklyCompleted > 0 ? Math.round((totalWeeklyUnstable / totalWeeklyCompleted) * 100) : null;

  const moodWeeklyMap = new Map<string, { changed: number; unstable: number; completed: number }>();
  for (const date of last7Dates) moodWeeklyMap.set(date, { changed: 0, unstable: 0, completed: 0 });

  for (const row of events as Array<Record<string, unknown>>) {
    const createdAt = String(row.created_at ?? "");
    const day = createdAt.slice(0, 10);
    if (!moodWeeklyMap.has(day) || String(row.type ?? "") !== "flow_event") continue;
    const payload = row.payload as Record<string, unknown> | null;
    const step = String(payload?.step ?? "");
    const point = moodWeeklyMap.get(day)!;
    if (step === "pulse_mood_changed") point.changed += 1;
    if (step === "pulse_mood_unstable") point.unstable += 1;
    if (step === "pulse_completed") point.completed += 1;
  }

  const moodWeeklyPoints = last7Dates.map((date) => ({ date: date.slice(5), ...(moodWeeklyMap.get(date)!) }));
  const moodWeeklyUnstable = moodWeeklyPoints.reduce((sum, item) => sum + item.unstable, 0);
  const moodWeeklyCompleted = moodWeeklyPoints.reduce((sum, item) => sum + item.completed, 0);
  const moodUnstableToCompletedPct = moodWeeklyCompleted > 0 ? Math.round((moodWeeklyUnstable / moodWeeklyCompleted) * 100) : null;

  const zones = Array.from(zoneMap.entries()).map(([label, count]) => ({ label, count }));

  const sessionsByType = { node_added: new Set<string>(), path_started: new Set<string>(), task_completed: new Set<string>() };
  for (const row of events as Array<Record<string, unknown>>) {
    const sid = String(row.session_id ?? "anonymous");
    const type = String(row.type ?? "");
    if (type === "node_added") sessionsByType.node_added.add(sid);
    if (type === "path_started") sessionsByType.path_started.add(sid);
    if (type === "task_completed") sessionsByType.task_completed.add(sid);
  }

  const funnel = {
    steps: [
      { label: "أضاف شخصاً", count: sessionsByType.node_added.size, key: "identification" },
      { label: "بدأ مساراً", count: sessionsByType.path_started.size, key: "commitment" },
      { label: "نفّذ مهمة", count: sessionsByType.task_completed.size, key: "success" }
    ]
  };

  const addPersonOpened = flowCounts["add_person_opened"] ?? 0;
  const addPersonDropped = flowCounts["add_person_dropped"] ?? 0;
  const addPersonDoneShowOnMap = flowCounts["add_person_done_show_on_map"] ?? 0;
  const addPersonCompletionRate = addPersonOpened > 0 ? Math.round(((addPersonOpened - addPersonDropped) / addPersonOpened) * 100) : null;

  const marketingLeadsTotal = marketingLeadsTotalCount ?? 0;
  const startClicks = flowCounts["landing_clicked_start"] ?? 0;
  const pulseCompleted = flowCounts["pulse_completed"] ?? 0;
  const journeyMapsTotalVal = journeyMapsTotal ?? 0;

  return {
    totalTravelers: usersCount ?? null,
    activeConsciousnessNow: activeCount ?? null,
    avgMood: moodCount ? Math.round((moodSum / moodCount) * 10) / 10 : null,
    aiTokensUsed: aiLogsCount ?? null,
    growthData,
    zones,
    phaseOneGoal: { registeredTravelers: usersCount ?? 0, installedTravelers: installedUsers, addedPeers: addedPeopleCount ?? 0 },
    pulseEnergyWeekly: { points: pulseEnergyWeeklyPoints, unstableToCompletedPct },
    moodWeekly: { points: moodWeeklyPoints, unstableToCompletedPct: moodUnstableToCompletedPct },
    pulseCopyVariants: { assigned: { energy: { a: 0, b: 0 }, mood: { a: 0, b: 0 }, focus: { a: 0, b: 0 } }, completed: { energy: { a: 0, b: 0 }, mood: { a: 0, b: 0 }, focus: { a: 0, b: 0 } } },
    pulseCopyVariantTrend: { energy: [], mood: [], focus: [] },
    funnel,
    flowStats: { byStep: flowCounts, avgTimeToActionMs: flowTimeToActionCount > 0 ? Math.round(flowTimeToActionSum / flowTimeToActionCount) : null, addPersonCompletionRate, pulseAbandonedByReason },
    conversionHealth: { pathStarted24h: pathStarted24h ?? 0, journeyMapsTotal: journeyMapsTotalVal, addPersonOpened, addPersonDoneShowOnMap },
    verificationGapIndex: marketingLeadsTotal > 0 
      ? Math.max(0, Math.round(((marketingLeadsTotal - (usersCount ?? 0)) / marketingLeadsTotal) * 100)) 
      : 0,
    potentialTravelers: {
      total: marketingLeadsTotal,
      last24h: marketingLeadsLast24hCount ?? 0,
      bySource: toTopEntries(marketingBySource),
      bySourceType: toTopEntries(marketingBySourceType),
      byStatus: toTopEntries(marketingByStatus),
      byCampaign: toTopEntries(marketingByCampaign),
      dailyTrend: last14Dates.map((date) => ({ date, count: marketingByDate.get(date) ?? 0 })),
      sovereignPassage: {
        potential: marketingLeadsTotal,
        startClicks,
        pulseCompleted,
        journeyMaps: journeyMapsTotalVal,
        startClickRatePct: marketingLeadsTotal > 0 ? Math.round((startClicks / marketingLeadsTotal) * 100) : null,
        pulseCompletedRatePct: marketingLeadsTotal > 0 ? Math.round((pulseCompleted / marketingLeadsTotal) * 100) : null,
        mapCreatedRatePct: marketingLeadsTotal > 0 ? Math.round((journeyMapsTotalVal / marketingLeadsTotal) * 100) : null
      }
    }
  };
}

export async function fetchOpsInsights(): Promise<OpsInsights | null> {
  const apiData = await callAdminApi<OpsInsights>("overview?kind=ops-insights");
  return apiData ?? null;
}

export async function fetchExecutiveReport(): Promise<ExecutiveReport | null> {
  const apiData = await callAdminApi<ExecutiveReport>("overview?kind=executive-report");
  return apiData ?? null;
}

export async function fetchSystemHealth(): Promise<SystemHealthReport | null> {
  const apiData = await callAdminApi<SystemHealthReport>("overview?kind=system-health");
  return apiData ?? null;
}

export async function fetchSecuritySignals(): Promise<SecuritySignalsReport | null> {
  const apiData = await callAdminApi<SecuritySignalsReport>("overview?kind=security-signals");
  return apiData ?? null;
}

export async function fetchOwnerOpsReport(): Promise<OwnerOpsReport | null> {
  const apiData = await callAdminApi<OwnerOpsReport>("overview?kind=owner-ops");
  return apiData ?? null;
}

export async function sendOwnerSecurityWebhook(payload: any): Promise<boolean> {
  const url = runtimeEnv.ownerSecurityWebhookUrl;
  if (!url) return false;
  return sendJsonWithResilience(url, { source: "dawayir-sentinel", ...payload }, {}, { retries: 1, breaker: securityWebhookBreaker });
}

export async function fetchDreams(): Promise<any[]> {
  if (!isSupabaseReady || !supabase) return [];
  const { data, error } = await supabase.from('alrehla_dreams').select('*').order('created_at', { ascending: false });
  if (error || !data) return [];
  return data;
}

export async function saveDream(dream: any): Promise<boolean> {
  if (!isSupabaseReady || !supabase) return false;
  const { error } = await supabase.from('alrehla_dreams').upsert({ ...dream, updated_at: new Date().toISOString() });
  return !error;
}

export async function fetchSovereignExecutiveReport(): Promise<any | null> {
  try {
    const [revenue, recentTransactions] = await Promise.all([revenueService.getExecutiveSnapshot(), revenueService.getRecentTransactions(10)]);
    return { revenue, recentTransactions };
  } catch (e) {
    logger.error("fetchSovereignExecutiveReport error:", e);
    return null;
  }
}

export type SovereignExecutiveReport = Awaited<ReturnType<typeof fetchSovereignExecutiveReport>>;

export async function fetchOpenSupportTickets(): Promise<SupportTicketEntry[] | null> {
  const apiData = await callAdminApi<{ tickets: SupportTicketEntry[] }>("tickets/resolve", { method: "GET" });
  return apiData?.tickets ?? null;
}

export async function resolveActivationTicket(ticketId: string, userId: string, email: string | null, phone: string | null): Promise<boolean> {
  const apiData = await callAdminApi<{ ok: boolean }>("tickets/resolve", {
    method: "POST",
    body: JSON.stringify({ action: "resolve", ticketId, userId, email, phone })
  });
  return Boolean(apiData?.ok);
}

export async function rejectActivationTicket(ticketId: string, reason?: string): Promise<boolean> {
  const apiData = await callAdminApi<{ ok: boolean }>("tickets/resolve", {
    method: "POST",
    body: JSON.stringify({ action: "reject", ticketId, reason })
  });
  return Boolean(apiData?.ok);
}

export const adminApi = {
  fetchMarketingSpend,
  updateMarketingSpend,
  fetchCampaignBudgets,
  updateCampaignBudget,
  fetchOverviewStats,
  fetchOwnerAlerts,
  callAdminApi,
  upsertMarketingLead: async (lead: any) => {
    if (!isSupabaseReady || !supabase) return { success: false, error: 'Supabase not ready' };
    const { data, error } = await supabase
      .from('marketing_leads')
      .upsert(lead, { onConflict: 'email' })
      .select();
    return { success: !error, data, error };
  }
};
