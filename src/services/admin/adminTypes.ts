/**
 * adminTypes.ts — All shared types, interfaces, and type aliases for the Admin API.
 * Extracted from the monolithic adminApi.ts during the domain-split refactor.
 */

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
  SovereignStats,
  PulseCopyOverrides,
} from "@/domains/admin/store/admin.store";
import type { MapNode } from "@/modules/map/mapTypes";
import type { PulseCheckMode } from "@/domains/consciousness/store/pulse.store";
import type {
  OpsInsights as SharedOpsInsights,
  ExecutiveReport as SharedExecutiveReport,
  SystemHealthReport as SharedSystemHealthReport,
  SecuritySignalsReport as SharedSecuritySignalsReport,
  WeeklyReport as SharedWeeklyReport,
  CronReportResponse as SharedCronReportResponse,
} from "@/types/admin.types";

// ─── System Setting Keys ────────────────────────────────────────────
export type SystemSettingKey =
  | "feature_flags"
  | "system_prompt"
  | "scoring_weights"
  | "scoring_thresholds"
  | "pulse_check_mode"
  | "theme_palette"
  | "pulse_copy_overrides"
  | "journey_paths"
  | "marketing_spend"
  | "campaign_budgets";

// ─── Theme ──────────────────────────────────────────────────────────
export interface ThemePalette {
  primary?: string; // teal — الأزرار الأساسية / النيون
  accent?: string; // amber — التنبيهات / الهايلايت
  nebulaBase?: string; // خلفية الفضاء الأساسية (space-mid / nebula)
  nebulaAccent?: string; // لون التوهج الجانبي في الخلفية
  glassBackground?: string; // درجة شفافية الكروت الزجاجية
  glassBorder?: string; // لون حدود الكروت الزجاجية
}

// ─── Alerts / War Room ──────────────────────────────────────────────
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

// ─── AI Logs ────────────────────────────────────────────────────────
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

// ─── Feedback ───────────────────────────────────────────────────────
export interface AdminFeedbackEntry {
  id: string;
  sessionId: string;
  category: string;
  rating: number | null;
  message: string;
  createdAt: number | null;
}

// ─── UTM / Marketing ───────────────────────────────────────────────
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

// ─── Pulse Copy A/B Variants ────────────────────────────────────────
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

// ─── Retention ──────────────────────────────────────────────────────
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

// ─── Overview Stats ─────────────────────────────────────────────────
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

// ─── Funnel & Behavioral ────────────────────────────────────────────
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

// ─── SEO ────────────────────────────────────────────────────────────
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

// ─── Owner Alerts ───────────────────────────────────────────────────
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

// ─── Re-exported shared types ───────────────────────────────────────
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

// ─── AI Interpretation / Journey ────────────────────────────────────
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

// ─── User State ─────────────────────────────────────────────────────
export interface UserStateRow {
  deviceToken: string;
  ownerId?: string | null;
  updatedAt: number | null;
  data?: Record<string, string>;
}

export interface UserStateExport {
  exportedAt: string;
  count: number;
  rows: Array<{ device_token: string; owner_id?: string | null; data: Record<string, unknown>; updated_at?: string }>;
}

// ─── Reports ────────────────────────────────────────────────────────
export interface DailyReport {
  date: string;
  totalEvents: number;
  uniqueSessions: number;
  typeCounts: Record<string, number>;
  topSessions: Array<{ sessionId: string; total: number; paths: number; tasks: number; nodes: number; moods: number }>;
}

export type WeeklyReport = SharedWeeklyReport;
export type CronReportResponse = SharedCronReportResponse;

// ─── Support Tickets ────────────────────────────────────────────────
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

// ─── Content Management ─────────────────────────────────────────────
export interface AdminContentEntry {
  key: string;
  content: string;
  page: string | null;
  updatedAt: string | null;
  source?: "remote" | "fallback";
}

// ─── User Management ────────────────────────────────────────────────
export interface AdminUserRow {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: number | null;
}

// ─── Journey Paths ──────────────────────────────────────────────────
export interface CognitiveSimulationResult {
  persona: string;
  theme: "amber" | "rose" | "slate" | "cyan" | "emerald";
  feedback: string;
  willComplete: boolean;
}

// ─── Revenue / Payments ─────────────────────────────────────────────
export interface PendingIntent {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
}

// ─── Sovereign Executive ────────────────────────────────────────────
// Dynamic type derived from fetchSovereignExecutiveReport return
import type { RevenueMetricSnapshot, TransactionSummary } from "@/domains/billing";
export type SovereignExecutiveReport = {
  revenue: RevenueMetricSnapshot;
  recentTransactions: TransactionSummary[];
} | null;

// Re-export domain types consumed by modules (passthrough)
export type {
  FeatureFlagKey,
  FeatureFlagMode,
  ScoringWeights,
  ScoringThresholds,
  AiLogEntry,
  AdminMission,
  AdminBroadcast,
  JourneyPath,
  JourneyPathStep,
  SovereignInsight,
  SovereignStats,
  PulseCopyOverrides,
  PulseCheckMode,
  MapNode,
};
