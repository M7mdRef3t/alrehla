import { supabase, isSupabaseReady } from "./supabaseClient";
import { getAuthToken } from "../state/authState";
import { runtimeEnv } from "../config/runtimeEnv";
import { CircuitBreaker } from "../architecture/circuitBreaker";
import { fetchJsonWithResilience, sendJsonWithResilience } from "../architecture/resilientHttp";
import type { FeatureFlagKey, FeatureFlagMode } from "../config/features";
import type {
  ScoringWeights,
  ScoringThresholds,
  AiLogEntry,
  AdminMission,
  AdminBroadcast
} from "../state/adminState";
import { getBroadcastAudienceFromId, withBroadcastAudienceId } from "../utils/broadcastAudience";
import type { MapNode } from "../modules/map/mapTypes";
import type { PulseCheckMode } from "../state/pulseState";
import type { PulseCopyOverrides } from "../state/adminState";

type SystemSettingKey =
  | "feature_flags"
  | "system_prompt"
  | "scoring_weights"
  | "scoring_thresholds"
  | "pulse_check_mode"
  | "theme_palette"
  | "pulse_copy_overrides";

const SETTINGS_TABLE = "system_settings";
const ADMIN_API_BASE = runtimeEnv.adminApiBase;
const ADMIN_API_PATH = `${ADMIN_API_BASE}/api/admin`;
const adminApiBreaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 20_000 });
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
  if (!authToken) return null;
  const query = buildAdminQuery(path);
  return fetchJsonWithResilience<T>(
    `${ADMIN_API_PATH}?${query}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(options?.headers ?? {})
      }
    },
    { retries: 1, breaker: adminApiBreaker }
  );
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

export async function fetchAdminConfig() {
  const apiData = await callAdminApi<{
    settings?: Record<string, unknown>;
    featureFlags?: Record<FeatureFlagKey, FeatureFlagMode>;
    systemPrompt?: string;
    scoringWeights?: ScoringWeights;
    scoringThresholds?: ScoringThresholds;
    pulseCheckMode?: PulseCheckMode;
    pulseCopyOverrides?: PulseCopyOverrides;
  }>("config");
  if (apiData) {
    const settings = apiData.settings;
    if (settings) {
      return {
        featureFlags: settings.feature_flags as Record<FeatureFlagKey, FeatureFlagMode> | undefined,
        systemPrompt: settings.system_prompt as string | undefined,
        scoringWeights: settings.scoring_weights as ScoringWeights | undefined,
        scoringThresholds: settings.scoring_thresholds as ScoringThresholds | undefined,
        pulseCheckMode: settings.pulse_check_mode as PulseCheckMode | undefined,
        pulseCopyOverrides: settings.pulse_copy_overrides as PulseCopyOverrides | undefined
      };
    }
    return {
      featureFlags: apiData.featureFlags,
      systemPrompt: apiData.systemPrompt,
      scoringWeights: apiData.scoringWeights,
      scoringThresholds: apiData.scoringThresholds,
      pulseCheckMode: apiData.pulseCheckMode,
      pulseCopyOverrides: apiData.pulseCopyOverrides
    };
  }
  const settings = await fetchSettings([
    "feature_flags",
    "system_prompt",
    "scoring_weights",
    "scoring_thresholds",
    "pulse_check_mode",
    "pulse_copy_overrides"
  ]);
  if (!settings) return null;
  return {
    featureFlags: settings.get("feature_flags") as Record<FeatureFlagKey, FeatureFlagMode> | undefined,
    systemPrompt: settings.get("system_prompt") as string | undefined,
    scoringWeights: settings.get("scoring_weights") as ScoringWeights | undefined,
    scoringThresholds: settings.get("scoring_thresholds") as ScoringThresholds | undefined,
    pulseCheckMode: settings.get("pulse_check_mode") as PulseCheckMode | undefined,
    pulseCopyOverrides: settings.get("pulse_copy_overrides") as PulseCopyOverrides | undefined
  };
}

export async function fetchThemePalette(): Promise<ThemePalette | null> {
  const settings = await fetchSettings(["theme_palette"]);
  if (!settings) return null;
  const palette = settings.get("theme_palette") as ThemePalette | undefined;
  return palette ?? null;
}

export async function saveThemePalette(palette: ThemePalette): Promise<boolean> {
  const apiRes = await callAdminApi<{ ok: boolean }>("config", {
    method: "POST",
    body: JSON.stringify({ theme_palette: palette })
  });
  if (apiRes?.ok) return true;
  return saveSetting("theme_palette", palette);
}

export async function saveFeatureFlags(flags: Record<FeatureFlagKey, FeatureFlagMode>) {
  const apiRes = await callAdminApi<{ ok: boolean }>("config", {
    method: "POST",
    body: JSON.stringify({ feature_flags: flags })
  });
  if (apiRes?.ok) return true;
  return saveSetting("feature_flags", flags);
}

export async function saveSystemPrompt(prompt: string) {
  const apiRes = await callAdminApi<{ ok: boolean }>("config", {
    method: "POST",
    body: JSON.stringify({ system_prompt: prompt })
  });
  if (apiRes?.ok) return true;
  return saveSetting("system_prompt", prompt);
}

export async function saveScoring(weights: ScoringWeights, thresholds: ScoringThresholds) {
  const apiRes = await callAdminApi<{ ok: boolean }>("config", {
    method: "POST",
    body: JSON.stringify({ scoring_weights: weights, scoring_thresholds: thresholds })
  });
  if (apiRes?.ok) return true;
  const w = await saveSetting("scoring_weights", weights);
  const t = await saveSetting("scoring_thresholds", thresholds);
  return w && t;
}

export async function savePulseCheckMode(mode: PulseCheckMode) {
  const apiRes = await callAdminApi<{ ok: boolean }>("config", {
    method: "POST",
    body: JSON.stringify({ pulse_check_mode: mode })
  });
  if (apiRes?.ok) return true;
  return saveSetting("pulse_check_mode", mode);
}

export async function savePulseCopyOverrides(overrides: PulseCopyOverrides) {
  const apiRes = await callAdminApi<{ ok: boolean }>("config", {
    method: "POST",
    body: JSON.stringify({ pulse_copy_overrides: overrides })
  });
  if (apiRes?.ok) return true;
  return saveSetting("pulse_copy_overrides", overrides);
}

export async function fetchAiLogs(): Promise<AiLogEntry[] | null> {
  const apiData = await callAdminApi<{ logs: Array<Record<string, unknown>> }>("ai-logs");
  if (apiData?.logs) {
    return apiData.logs.map((row) => ({
      id: String(row.id ?? row.log_id ?? row.created_at),
      createdAt: new Date(String(row.created_at ?? Date.now())).getTime(),
      prompt: String(row.prompt ?? ""),
      response: String(row.response ?? ""),
      source: (row.source as AiLogEntry["source"]) ?? "system",
      rating: row.rating as AiLogEntry["rating"]
    }));
  }
  if (!isSupabaseReady || !supabase) return null;
  const { data, error } = await supabase
    .from("admin_ai_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error || !data) return null;
  return data.map((row: Record<string, unknown>) => ({
    id: String(row.id ?? row.log_id ?? row.created_at),
    createdAt: new Date(String(row.created_at ?? Date.now())).getTime(),
    prompt: String(row.prompt ?? ""),
    response: String(row.response ?? ""),
    source: (row.source as AiLogEntry["source"]) ?? "system",
    rating: row.rating as AiLogEntry["rating"]
  }));
}

export async function saveAiLog(entry: AiLogEntry) {
  const apiRes = await callAdminApi<{ ok: boolean }>("ai-logs", {
    method: "POST",
    body: JSON.stringify({ entry })
  });
  if (apiRes?.ok) return true;
  if (!isSupabaseReady || !supabase) return false;
  const { error } = await supabase.from("admin_ai_logs").insert({
    id: entry.id,
    prompt: entry.prompt,
    response: entry.response,
    source: entry.source,
    rating: entry.rating,
    created_at: new Date(entry.createdAt).toISOString()
  });
  return !error;
}

export async function rateAiLog(id: string, rating: "up" | "down") {
  const apiRes = await callAdminApi<{ ok: boolean }>("ai-logs", {
    method: "POST",
    body: JSON.stringify({ action: "rate", id, rating })
  });
  if (apiRes?.ok) return true;
  if (!isSupabaseReady || !supabase) return false;
  const { error } = await supabase
    .from("admin_ai_logs")
    .update({ rating })
    .eq("id", id);
  return !error;
}

export async function fetchMissions(): Promise<AdminMission[] | null> {
  const apiData = await callAdminApi<{ missions: Array<Record<string, unknown>> }>("missions");
  if (apiData?.missions) {
    return apiData.missions.map((row) => ({
      id: String(row.id ?? row.created_at),
      title: String(row.title ?? ""),
      track: String(row.track ?? ""),
      difficulty: (row.difficulty as AdminMission["difficulty"]) ?? "سهل",
      createdAt: new Date(String(row.created_at ?? Date.now())).getTime()
    }));
  }
  if (!isSupabaseReady || !supabase) return null;
  const { data, error } = await supabase
    .from("admin_missions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return null;
  return data.map((row: Record<string, unknown>) => ({
    id: String(row.id ?? row.created_at),
    title: String(row.title ?? ""),
    track: String(row.track ?? ""),
    difficulty: (row.difficulty as AdminMission["difficulty"]) ?? "سهل",
    createdAt: new Date(String(row.created_at ?? Date.now())).getTime()
  }));
}

export async function saveMission(mission: AdminMission) {
  const apiRes = await callAdminApi<{ ok: boolean }>("missions", {
    method: "POST",
    body: JSON.stringify({ mission })
  });
  if (apiRes?.ok) return true;
  if (!isSupabaseReady || !supabase) return false;
  const { error } = await supabase.from("admin_missions").insert({
    id: mission.id,
    title: mission.title,
    track: mission.track,
    difficulty: mission.difficulty,
    created_at: new Date(mission.createdAt).toISOString()
  });
  return !error;
}

export async function deleteMission(id: string) {
  const apiRes = await callAdminApi<{ ok: boolean }>(`missions?id=${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
  if (apiRes?.ok) return true;
  if (!isSupabaseReady || !supabase) return false;
  const { error } = await supabase.from("admin_missions").delete().eq("id", id);
  return !error;
}

export async function fetchBroadcasts(): Promise<AdminBroadcast[] | null> {
  const apiData = await callAdminApi<{ broadcasts: Array<Record<string, unknown>> }>("broadcasts");
  if (apiData?.broadcasts) {
    return apiData.broadcasts.map((row) => ({
      id: String(row.id ?? row.created_at),
      title: String(row.title ?? ""),
      body: String(row.body ?? ""),
      audience: getBroadcastAudienceFromId(String(row.id ?? "")),
      createdAt: new Date(String(row.created_at ?? Date.now())).getTime()
    }));
  }
  if (!isSupabaseReady || !supabase) return null;
  const { data, error } = await supabase
    .from("admin_broadcasts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return null;
  return data.map((row: Record<string, unknown>) => ({
    id: String(row.id ?? row.created_at),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    audience: getBroadcastAudienceFromId(String(row.id ?? "")),
    createdAt: new Date(String(row.created_at ?? Date.now())).getTime()
  }));
}

export async function saveBroadcast(broadcast: AdminBroadcast) {
  const idWithAudience = withBroadcastAudienceId(broadcast.id, broadcast.audience ?? "all");
  const apiRes = await callAdminApi<{ ok: boolean }>("broadcasts", {
    method: "POST",
    body: JSON.stringify({
      broadcast: {
        ...broadcast,
        id: idWithAudience
      }
    })
  });
  if (apiRes?.ok) return true;
  if (!isSupabaseReady || !supabase) return false;
  const { error } = await supabase.from("admin_broadcasts").insert({
    id: idWithAudience,
    title: broadcast.title,
    body: broadcast.body,
    created_at: new Date(broadcast.createdAt).toISOString()
  });
  return !error;
}

export async function deleteBroadcast(id: string) {
  const apiRes = await callAdminApi<{ ok: boolean }>(`broadcasts?id=${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
  if (apiRes?.ok) return true;
  if (!isSupabaseReady || !supabase) return false;
  const { error } = await supabase.from("admin_broadcasts").delete().eq("id", id);
  return !error;
}

export interface AdminContentEntry {
  key: string;
  content: string;
  page: string | null;
  updatedAt: string | null;
}

export async function fetchAppContentEntries(query?: {
  page?: string;
  key?: string;
  limit?: number;
}): Promise<AdminContentEntry[] | null> {
  const params = new URLSearchParams();
  if (query?.page) params.set("page", query.page);
  if (query?.key) params.set("key", query.key);
  if (typeof query?.limit === "number" && Number.isFinite(query.limit) && query.limit > 0) {
    params.set("limit", String(Math.floor(query.limit)));
  }

  const apiPath = params.toString() ? `content?${params.toString()}` : "content";
  const apiData = await callAdminApi<{ entries: Array<Record<string, unknown>> }>(apiPath);
  if (apiData?.entries) {
    return apiData.entries.map((row) => ({
      key: String(row.key ?? ""),
      content: String(row.content ?? ""),
      page: typeof row.page === "string" ? row.page : null,
      updatedAt: typeof row.updated_at === "string"
        ? row.updated_at
        : typeof row.updatedAt === "string"
          ? row.updatedAt
          : null
    }));
  }

  if (!isSupabaseReady || !supabase) return null;
  let request = supabase
    .from("app_content")
    .select("key,content,page,updated_at")
    .order("updated_at", { ascending: false });

  if (query?.page) {
    request = request.eq("page", query.page);
  }
  if (query?.key) {
    request = request.ilike("key", `%${query.key}%`);
  }
  if (typeof query?.limit === "number" && Number.isFinite(query.limit) && query.limit > 0) {
    request = request.limit(Math.min(Math.floor(query.limit), 500));
  } else {
    request = request.limit(300);
  }

  const { data, error } = await request;
  if (error || !data) return null;
  return data.map((row: Record<string, unknown>) => ({
    key: String(row.key ?? ""),
    content: String(row.content ?? ""),
    page: typeof row.page === "string" ? row.page : null,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : null
  }));
}

export async function saveAppContentEntry(entry: {
  key: string;
  content: string;
  page?: string | null;
}) {
  const payload = {
    key: String(entry.key ?? "").trim(),
    content: String(entry.content ?? ""),
    page: entry.page ? String(entry.page) : null
  };

  if (!payload.key) return false;

  const apiRes = await callAdminApi<{ ok: boolean }>("content", {
    method: "POST",
    body: JSON.stringify({ entry: payload })
  });
  if (apiRes?.ok) return true;
  if (!isSupabaseReady || !supabase) return false;
  const { error } = await supabase.from("app_content").upsert(payload, { onConflict: "key" });
  return !error;
}

export async function deleteAppContentEntry(key: string) {
  const normalizedKey = String(key ?? "").trim();
  if (!normalizedKey) return false;
  const apiRes = await callAdminApi<{ ok: boolean }>(`content?key=${encodeURIComponent(normalizedKey)}`, {
    method: "DELETE"
  });
  if (apiRes?.ok) return true;
  if (!isSupabaseReady || !supabase) return false;
  const { error } = await supabase.from("app_content").delete().eq("key", normalizedKey);
  return !error;
}

export interface AdminUserRow {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: number | null;
}

export async function fetchUsers(): Promise<AdminUserRow[] | null> {
  const apiData = await callAdminApi<{ users: Array<Record<string, unknown>> }>("users");
  if (apiData?.users) {
    return apiData.users.map((row) => ({
      id: String(row.id ?? ""),
      fullName: String(row.full_name ?? row.name ?? "—"),
      email: String(row.email ?? "—"),
      role: String(row.role ?? "user"),
      createdAt: row.created_at ? new Date(String(row.created_at)).getTime() : null
    }));
  }
  if (!isSupabaseReady || !supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !data) return null;
  return data.map((row: Record<string, unknown>) => ({
    id: String(row.id ?? ""),
    fullName: String(row.full_name ?? row.name ?? "—"),
    email: String(row.email ?? "—"),
    role: String(row.role ?? "user"),
    createdAt: row.created_at ? new Date(String(row.created_at)).getTime() : null
  }));
}

export interface AwarenessGapStats {
  totalGreen: number;
  gapCount: number;
  gapPercent: number;
  usersWithGap: number;
}

export interface FunnelStep {
  label: string;
  count: number;
  key: string;
}

export interface TopScenario {
  key: string;
  label: string;
  count: number;
  percent: number;
}

export interface EmergencyLogEntry {
  sessionId: string;
  personLabel: string;
  createdAt: string;
}

export interface TaskFrictionEntry {
  label: string;
  started: number;
  completed: number;
  escapeRate: number;
}

export interface WeeklyRhythmDay {
  day: number;
  dayName: string;
  avg: number | null;
  count: number;
}

export interface WeeklyRhythm {
  byDay: WeeklyRhythmDay[];
  lowestDay: number;
  lowestDayName: string | null;
}

export interface PhaseOneGoalProgress {
  registeredUsers: number;
  installedUsers: number;
  addedPeople: number;
}

export interface PulseEnergyWeeklyPoint {
  date: string;
  changed: number;
  unstable: number;
  completed: number;
  recommended: number;
  undo: number;
}

export interface PulseEnergyWeeklyStats {
  points: PulseEnergyWeeklyPoint[];
  unstableToCompletedPct: number | null;
}

export interface MoodWeeklyPoint {
  date: string;
  changed: number;
  unstable: number;
  completed: number;
}

export interface MoodWeeklyStats {
  points: MoodWeeklyPoint[];
  unstableToCompletedPct: number | null;
}

export interface PulseCopyVariantSplit {
  a: number;
  b: number;
}

export interface PulseCopyVariantStats {
  assigned: {
    energy: PulseCopyVariantSplit;
    mood: PulseCopyVariantSplit;
    focus: PulseCopyVariantSplit;
  };
  completed: {
    energy: PulseCopyVariantSplit;
    mood: PulseCopyVariantSplit;
    focus: PulseCopyVariantSplit;
  };
}

export interface PulseCopyVariantTrendPoint {
  date: string;
  aCompleted: number;
  bCompleted: number;
  delta: number;
}

export interface PulseCopyVariantTrendStats {
  energy: PulseCopyVariantTrendPoint[];
  mood: PulseCopyVariantTrendPoint[];
  focus: PulseCopyVariantTrendPoint[];
}

export interface RetentionCohortRow {
  cohortDate: string;
  cohortSize: number;
  d1: number; d3: number; d7: number; d30: number;
  d1Pct: number; d3Pct: number; d7Pct: number; d30Pct: number;
}

export interface UtmBreakdownEntry {
  key: string;
  count: number;
}

export interface OverviewStats {
  totalUsers: number | null;
  activeNow: number | null;
  avgMood: number | null;
  aiTokensUsed: number | null;
  growthData: Array<{ date: string; paths: number; nodes: number }>;
  zones: Array<{ label: string; count: number }>;
  awarenessGap?: AwarenessGapStats | null;
  funnel?: { steps: FunnelStep[] } | null;
  topScenarios?: TopScenario[] | null;
  emergencyLogs?: EmergencyLogEntry[] | null;
  taskFriction?: TaskFrictionEntry[] | null;
  weeklyRhythm?: WeeklyRhythm | null;
  phaseOneGoal?: PhaseOneGoalProgress | null;
  pulseEnergyWeekly?: PulseEnergyWeeklyStats | null;
  moodWeekly?: MoodWeeklyStats | null;
  pulseCopyVariants?: PulseCopyVariantStats | null;
  pulseCopyVariantTrend?: PulseCopyVariantTrendStats | null;
  flowStats?: {
    byStep: Record<string, number>;
    avgTimeToActionMs: number | null;
    addPersonCompletionRate: number | null;
    pulseAbandonedByReason?: Record<string, number>;
  } | null;
  conversionHealth?: {
    pathStarted24h: number;
    journeyMapsTotal: number;
    addPersonOpened: number;
    addPersonDoneShowOnMap: number;
  } | null;
  avgDwellByStep?: Record<string, number> | null;
  retentionCohorts?: RetentionCohortRow[] | null;
  utmBreakdown?: {
    sources: UtmBreakdownEntry[];
    mediums: UtmBreakdownEntry[];
    campaigns: UtmBreakdownEntry[];
  } | null;
}

export interface AdminFeedbackEntry {
  id: string;
  sessionId: string;
  category: string;
  rating: number | null;
  message: string;
  createdAt: number | null;
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
    registeredUsers: number;
    installedUsers: number;
    addedPeople: number;
    target: number;
    registeredReached: boolean;
    installedReached: boolean;
    addedReached: boolean;
    fullyCompleted: boolean;
  };
}

export interface OpsInsights {
  generatedAt: string;
  totals: {
    profiles: number;
    userState: number;
    eventsTotal: number;
    mapsTotal: number;
    sessions30d: number;
  };
  activity: {
    events1d: number;
    events7d: number;
    events30d: number;
  };
  comparisons: {
    events1dDelta: number;
    events7dDelta: number;
  };
  journey: {
    nodeAdded: number;
    pathStarted: number;
    taskCompleted: number;
  };
  tracking: {
    identified: number;
    anonymous: number;
    identifiedRate: number;
  };
  segments: {
    byMode: Array<{ key: string; count: number }>;
    byChannel: Array<{ key: string; count: number }>;
    byDevice: Array<{ key: string; count: number }>;
  };
  cohort: {
    newSessions30d: number;
    retained7d: number;
    retained30d: number;
    activationRate: number;
  };
  funnel: {
    landingViewed: number;
    startClicked: number;
    addPersonOpened: number;
    addPersonDone: number;
    startPathCTA: number;
  };
  alerts: Array<{
    level: "critical" | "warning" | "info";
    code: string;
    title: string;
    metric: number;
    threshold: number;
  }>;
  warnings: string[];
}

export interface ExecutiveReport {
  generatedAt: string;
  kpis: {
    events24h: number;
    pathStarted24h: number;
    nodesAdded24h: number;
    mapsTotal: number;
    addPersonCompletionRate: number;
    retention7d: number;
  };
  attribution: {
    topSources: Array<{ key: string; count: number }>;
    topMediums: Array<{ key: string; count: number }>;
    topCampaigns: Array<{ key: string; count: number }>;
    installClicked: number;
  };
  reliability: {
    status: "healthy" | "warning";
    alerts: string[];
  };
  recommendedActions: string[];
}

export interface SystemHealthReport {
  generatedAt: string;
  status: "healthy" | "degraded";
  probe: {
    supabaseReachable: boolean;
    supabaseProbeMs: number;
  };
  api: {
    uptimeSec: number;
    requests: number;
    errors: number;
    errorRate: number;
    p50LatencyMs: number;
    p95LatencyMs: number;
    lastErrorAt: string | null;
  };
}

export interface SecuritySignalsReport {
  generatedAt: string;
  status: "healthy" | "warning" | "critical";
  config: {
    adminSecretStrong: boolean;
    serviceRoleConfigured: boolean;
    secureTransportConfigured: boolean;
  };
  metrics: {
    authFailed15m: number;
    authRateLimited15m: number;
    adminErrors15m: number;
  };
  incidents: Array<{
    action: string;
    createdAt: string;
    payload: Record<string, unknown>;
  }>;
  warnings: string[];
}

export interface OwnerOpsReport {
  generatedAt: string;
  status: "healthy" | "warning" | "critical";
  systemHealth: SystemHealthReport | null;
  securitySignals: SecuritySignalsReport | null;
  ownerAlerts: OwnerAlertsResponse | null;
}

export interface JourneyMapSnapshot {
  sessionId: string;
  nodes: MapNode[];
  updatedAt: number | null;
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

export interface WeeklyReport {
  from: string;
  to: string;
  totalEvents: number;
  uniqueSessions: number;
  typeCounts: Record<string, number>;
  dailySeries: Array<{ date: string; count: number }>;
  topSessions: Array<{ sessionId: string; total: number }>;
}

export async function fetchWeeklyReport(): Promise<WeeklyReport | null> {
  const apiData = await callAdminApi<WeeklyReport>("weekly-report");
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
  const apiData = await callAdminApi<{ sessionId: string; nodes: MapNode[]; updatedAt?: string }>(
    `journey-map?sessionId=${encodeURIComponent(sessionId)}`
  );
  if (apiData) {
    return {
      sessionId: apiData.sessionId ?? sessionId,
      nodes: apiData.nodes ?? [],
      updatedAt: apiData.updatedAt ? new Date(String(apiData.updatedAt)).getTime() : null
    };
  }
  if (!isSupabaseReady || !supabase) return null;
  const { data, error } = await supabase
    .from("journey_maps")
    .select("session_id,nodes,updated_at")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    sessionId: String(data.session_id ?? sessionId),
    nodes: (data.nodes as MapNode[]) ?? [],
    updatedAt: data.updated_at ? new Date(String(data.updated_at)).getTime() : null
  };
}

export async function fetchSessionEvents(
  sessionId: string,
  limit = 200
): Promise<SessionEventRow[] | null> {
  const sid = sessionId.trim();
  if (!sid) return null;
  if (!isSupabaseReady || !supabase) return null;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 1000) : 200;
  const { data, error } = await supabase
    .from("journey_events")
    .select("id,session_id,type,payload,created_at")
    .eq("session_id", sid)
    .order("created_at", { ascending: false })
    .limit(safeLimit);
  if (error || !data) return null;
  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
    sessionId: String(row.session_id ?? sid),
    type: String(row.type ?? "unknown"),
    payload: (row.payload as Record<string, unknown> | null) ?? null,
    createdAt: row.created_at ? new Date(String(row.created_at)).getTime() : null
  }));
}

export async function fetchVisitorSessions(limit = 300): Promise<VisitorSessionSummary[] | null> {
  if (!isSupabaseReady || !supabase) return null;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 1000) : 300;
  const { data, error } = await supabase
    .from("journey_events")
    .select("session_id,type,payload,created_at")
    .not("session_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(10000);
  if (error || !data) return null;

  const bySession = new Map<string, VisitorSessionSummary>();
  for (const row of data as Array<Record<string, unknown>>) {
    const sid = String(row.session_id ?? "").trim();
    if (!sid) continue;
    const createdAt = row.created_at ? new Date(String(row.created_at)).getTime() : null;
    const type = String(row.type ?? "");
    const payload = (row.payload as Record<string, unknown> | null) ?? null;
    const flowStep = type === "flow_event" && typeof payload?.step === "string" ? payload.step : null;

    const existing = bySession.get(sid);
    if (!existing) {
      bySession.set(sid, {
        sessionId: sid,
        firstSeen: createdAt,
        lastSeen: createdAt,
        eventsCount: 1,
        pathStarts: type === "path_started" ? 1 : 0,
        taskCompletions: type === "task_completed" ? 1 : 0,
        nodesAdded: type === "node_added" ? 1 : 0,
        lastFlowStep: flowStep
      });
      continue;
    }

    existing.eventsCount += 1;
    if (type === "path_started") existing.pathStarts += 1;
    if (type === "task_completed") existing.taskCompletions += 1;
    if (type === "node_added") existing.nodesAdded += 1;
    if (createdAt != null) {
      if (existing.firstSeen == null || createdAt < existing.firstSeen) existing.firstSeen = createdAt;
      if (existing.lastSeen == null || createdAt > existing.lastSeen) {
        existing.lastSeen = createdAt;
        if (flowStep) existing.lastFlowStep = flowStep;
      } else if (existing.lastFlowStep == null && flowStep) {
        existing.lastFlowStep = flowStep;
      }
    } else if (existing.lastFlowStep == null && flowStep) {
      existing.lastFlowStep = flowStep;
    }
  }

  const results = Array.from(bySession.values())
    .sort((a, b) => (b.lastSeen ?? 0) - (a.lastSeen ?? 0))
    .slice(0, safeLimit);

  // Session → User stitching: إضافة بيانات المستخدم المرتبط
  const sessionIds = results.map((r) => r.sessionId).slice(0, 300);
  if (sessionIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, user_id, email")
      .in("id", sessionIds);
    if (profiles) {
      const profileMap = new Map<string, { userId: string | null; email: string | null }>();
      for (const p of profiles as Array<Record<string, unknown>>) {
        profileMap.set(String(p.id), {
          userId: p.user_id ? String(p.user_id) : null,
          email: p.email ? String(p.email) : null
        });
      }
      for (const session of results) {
        const profile = profileMap.get(session.sessionId);
        if (profile) {
          session.linkedUserId = profile.userId;
          session.linkedEmail = profile.email;
        }
      }
    }
  }

  return results;
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
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: usersCount },
    { count: activeCount },
    { data: events },
    { count: aiLogsCount },
    { count: addedPeopleCount },
    { count: journeyMapsTotal },
    { count: pathStarted24h },
    { data: installedSessionsRows }
  ] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("journey_events").select("id", { count: "exact", head: true }).gte("created_at", fiveMinAgo),
      supabase
        .from("journey_events")
        .select("session_id,type,payload,created_at")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: true })
        .limit(10000),
      supabase.from("admin_ai_logs").select("id", { count: "exact", head: true }),
      supabase.from("journey_events").select("id", { count: "exact", head: true }).eq("type", "node_added"),
      supabase.from("journey_maps").select("session_id", { count: "exact", head: true }),
      supabase.from("journey_events").select("id", { count: "exact", head: true }).eq("type", "path_started").gte("created_at", twentyFourHoursAgo),
      supabase
        .from("journey_events")
        .select("session_id")
        .eq("type", "flow_event")
        .contains("payload", { step: "install_clicked" })
        .not("session_id", "is", null)
        .limit(5000)
    ]);
  const installedUsers = new Set(
    ((installedSessionsRows ?? []) as Array<{ session_id?: unknown }>)
      .map((row) => String(row.session_id ?? "").trim())
      .filter(Boolean)
  ).size;

  if (!events) {
    return {
      totalUsers: usersCount ?? null,
      activeNow: activeCount ?? null,
      avgMood: null,
      aiTokensUsed: aiLogsCount ?? null,
      growthData: [],
      zones: [],
      phaseOneGoal: {
        registeredUsers: usersCount ?? 0,
        installedUsers,
        addedPeople: addedPeopleCount ?? 0
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

  // Dwell time aggregation — متوسط وقت الإقامة بين الخطوات
  const dwellTimeByStep = new Map<string, { sum: number; count: number }>();

  // UTM breakdown — توزيع مصادر التسويق
  const utmSources = new Map<string, number>();
  const utmMediums = new Map<string, number>();
  const utmCampaigns = new Map<string, number>();

  // Retention cohorts — تتبع العودة حسب يوم أول ظهور
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
          const legacyVariant = extra?.variant === "a" || extra?.variant === "b" ? (extra.variant as "a" | "b") : null;
          const energyVariant =
            extra?.energyVariant === "a" || extra?.energyVariant === "b"
              ? (extra.energyVariant as "a" | "b")
              : legacyVariant;
          const moodVariant =
            extra?.moodVariant === "a" || extra?.moodVariant === "b"
              ? (extra.moodVariant as "a" | "b")
              : null;
          const focusVariant =
            extra?.focusVariant === "a" || extra?.focusVariant === "b"
              ? (extra.focusVariant as "a" | "b")
              : null;

          if (energyVariant) pulseCopyVariants.assigned.energy[energyVariant] += 1;
          if (moodVariant) pulseCopyVariants.assigned.mood[moodVariant] += 1;
          if (focusVariant) pulseCopyVariants.assigned.focus[focusVariant] += 1;
          if (sessionId) {
            sessionVariantMap.set(sessionId, {
              energy: energyVariant,
              mood: moodVariant,
              focus: focusVariant
            });
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
      // Dwell time aggregation
      if (step) {
        const extra = payload?.extra as Record<string, unknown> | undefined;
        const dwell = typeof extra?.dwellTime === "number" ? extra.dwellTime : null;
        if (dwell != null && dwell > 0 && dwell < 3600000) {
          const b = dwellTimeByStep.get(step) ?? { sum: 0, count: 0 };
          b.sum += dwell;
          b.count += 1;
          dwellTimeByStep.set(step, b);
        }
        // UTM breakdown
        const utm = extra?.utm as Record<string, string> | undefined;
        if (utm) {
          if (utm.utm_source) utmSources.set(utm.utm_source, (utmSources.get(utm.utm_source) ?? 0) + 1);
          if (utm.utm_medium) utmMediums.set(utm.utm_medium, (utmMediums.get(utm.utm_medium) ?? 0) + 1);
          if (utm.utm_campaign) utmCampaigns.set(utm.utm_campaign, (utmCampaigns.get(utm.utm_campaign) ?? 0) + 1);
        }
      }
    }
    // Retention cohort data — تجميع أيام النشاط لكل جلسة
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
  for (const row of events as Array<Record<string, unknown>>) {
    const createdAt = String(row.created_at ?? "");
    const day = createdAt.slice(0, 10);
    if (String(row.type ?? "") !== "flow_event") continue;
    const payload = row.payload as Record<string, unknown> | null;
    const step = String(payload?.step ?? "");
    const sessionId = String(row.session_id ?? "");
    if (step !== "pulse_completed" || !sessionId) continue;
    const sessionVariants = sessionVariantMap.get(sessionId);
    if (!sessionVariants) continue;
    if (sessionVariants.energy) {
      pulseCopyVariants.completed.energy[sessionVariants.energy] += 1;
      if (pulseCopyVariantTrendMap.energy.has(day)) {
        const p = pulseCopyVariantTrendMap.energy.get(day)!;
        if (sessionVariants.energy === "a") p.aCompleted += 1;
        if (sessionVariants.energy === "b") p.bCompleted += 1;
      }
    }
    if (sessionVariants.mood) {
      pulseCopyVariants.completed.mood[sessionVariants.mood] += 1;
      if (pulseCopyVariantTrendMap.mood.has(day)) {
        const p = pulseCopyVariantTrendMap.mood.get(day)!;
        if (sessionVariants.mood === "a") p.aCompleted += 1;
        if (sessionVariants.mood === "b") p.bCompleted += 1;
      }
    }
    if (sessionVariants.focus) {
      pulseCopyVariants.completed.focus[sessionVariants.focus] += 1;
      if (pulseCopyVariantTrendMap.focus.has(day)) {
        const p = pulseCopyVariantTrendMap.focus.get(day)!;
        if (sessionVariants.focus === "a") p.aCompleted += 1;
        if (sessionVariants.focus === "b") p.bCompleted += 1;
      }
    }
  }
  const pulseCopyVariantTrend: PulseCopyVariantTrendStats = {
    energy: last7Dates.map((date) => {
      const point = pulseCopyVariantTrendMap.energy.get(date) ?? { aCompleted: 0, bCompleted: 0 };
      return { date: date.slice(5), aCompleted: point.aCompleted, bCompleted: point.bCompleted, delta: point.aCompleted - point.bCompleted };
    }),
    mood: last7Dates.map((date) => {
      const point = pulseCopyVariantTrendMap.mood.get(date) ?? { aCompleted: 0, bCompleted: 0 };
      return { date: date.slice(5), aCompleted: point.aCompleted, bCompleted: point.bCompleted, delta: point.aCompleted - point.bCompleted };
    }),
    focus: last7Dates.map((date) => {
      const point = pulseCopyVariantTrendMap.focus.get(date) ?? { aCompleted: 0, bCompleted: 0 };
      return { date: date.slice(5), aCompleted: point.aCompleted, bCompleted: point.bCompleted, delta: point.aCompleted - point.bCompleted };
    })
  };

  const growthData = Array.from(growthMap.entries()).map(([date, value]) => ({
    date,
    paths: value.paths,
    nodes: value.nodes
  }));
  const pulseEnergyWeeklyMap = new Map<
    string,
    { changed: number; unstable: number; completed: number; recommended: number; undo: number }
  >();
  for (const date of last7Dates) {
    pulseEnergyWeeklyMap.set(date, { changed: 0, unstable: 0, completed: 0, recommended: 0, undo: 0 });
  }
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
  const pulseEnergyWeeklyPoints = last7Dates.map((date) => {
    const point = pulseEnergyWeeklyMap.get(date) ?? { changed: 0, unstable: 0, completed: 0, recommended: 0, undo: 0 };
    return { date: date.slice(5), ...point };
  });
  const totalWeeklyUnstable = pulseEnergyWeeklyPoints.reduce((sum, item) => sum + item.unstable, 0);
  const totalWeeklyCompleted = pulseEnergyWeeklyPoints.reduce((sum, item) => sum + item.completed, 0);
  const unstableToCompletedPct =
    totalWeeklyCompleted > 0 ? Math.round((totalWeeklyUnstable / totalWeeklyCompleted) * 100) : null;
  const moodWeeklyMap = new Map<string, { changed: number; unstable: number; completed: number }>();
  for (const date of last7Dates) {
    moodWeeklyMap.set(date, { changed: 0, unstable: 0, completed: 0 });
  }
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
  const moodWeeklyPoints = last7Dates.map((date) => {
    const point = moodWeeklyMap.get(date) ?? { changed: 0, unstable: 0, completed: 0 };
    return { date: date.slice(5), ...point };
  });
  const moodWeeklyUnstable = moodWeeklyPoints.reduce((sum, item) => sum + item.unstable, 0);
  const moodWeeklyCompleted = moodWeeklyPoints.reduce((sum, item) => sum + item.completed, 0);
  const moodUnstableToCompletedPct =
    moodWeeklyCompleted > 0 ? Math.round((moodWeeklyUnstable / moodWeeklyCompleted) * 100) : null;
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
  const addPersonCompletionRate =
    addPersonOpened > 0 ? Math.round(((addPersonOpened - addPersonDropped) / addPersonOpened) * 100) : null;

  // Derived flow counters used by the admin flow map
  flowCounts["pulse_closed_to_landing"] =
    (pulseAbandonedByReason["backdrop"] ?? 0) + (pulseAbandonedByReason["close_button"] ?? 0);
  flowCounts["pulse_abandoned_browser_close"] = pulseAbandonedByReason["browser_close"] ?? 0;

  // Dwell time averages — متوسط وقت الإقامة لكل خطوة
  const avgDwellByStep: Record<string, number> = {};
  dwellTimeByStep.forEach((val, key) => {
    avgDwellByStep[key] = Math.round(val.sum / val.count);
  });

  // UTM breakdown — تجميع مصادر التسويق
  const toSortedEntries = (map: Map<string, number>): UtmBreakdownEntry[] =>
    Array.from(map.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  const utmBreakdown = utmSources.size > 0 || utmMediums.size > 0 || utmCampaigns.size > 0
    ? { sources: toSortedEntries(utmSources), mediums: toSortedEntries(utmMediums), campaigns: toSortedEntries(utmCampaigns) }
    : null;

  // Retention cohorts — حساب نسب العودة D1/D3/D7/D30
  const cohortSessions = new Map<string, string[]>();
  sessionFirstSeen.forEach((firstDay, sessionId) => {
    const list = cohortSessions.get(firstDay) ?? [];
    list.push(sessionId);
    cohortSessions.set(firstDay, list);
  });
  const dayOffsets = [1, 3, 7, 30] as const;
  const retentionCohorts: RetentionCohortRow[] = [];
  cohortSessions.forEach((sessions, cohortDate) => {
    const cohortSize = sessions.length;
    if (cohortSize === 0) return;
    const cohortMs = new Date(cohortDate).getTime();
    const counts = { d1: 0, d3: 0, d7: 0, d30: 0 };
    for (const sessionId of sessions) {
      const activeDays = sessionActiveDays.get(sessionId);
      if (!activeDays) continue;
      for (const offset of dayOffsets) {
        const target = new Date(cohortMs + offset * 86400000).toISOString().slice(0, 10);
        if (activeDays.has(target)) counts[`d${offset}` as keyof typeof counts] += 1;
      }
    }
    retentionCohorts.push({
      cohortDate,
      cohortSize,
      ...counts,
      d1Pct: Math.round((counts.d1 / cohortSize) * 100),
      d3Pct: Math.round((counts.d3 / cohortSize) * 100),
      d7Pct: Math.round((counts.d7 / cohortSize) * 100),
      d30Pct: Math.round((counts.d30 / cohortSize) * 100),
    });
  });
  retentionCohorts.sort((a, b) => b.cohortDate.localeCompare(a.cohortDate));

  return {
    totalUsers: usersCount ?? null,
    activeNow: activeCount ?? null,
    avgMood: moodCount ? Math.round((moodSum / moodCount) * 10) / 10 : null,
    aiTokensUsed: aiLogsCount ?? null,
    growthData,
    zones,
    phaseOneGoal: {
      registeredUsers: usersCount ?? 0,
      installedUsers,
      addedPeople: addedPeopleCount ?? 0
    },
    pulseEnergyWeekly: {
      points: pulseEnergyWeeklyPoints,
      unstableToCompletedPct
    },
    moodWeekly: {
      points: moodWeeklyPoints,
      unstableToCompletedPct: moodUnstableToCompletedPct
    },
    pulseCopyVariants,
    pulseCopyVariantTrend,
    funnel,
    flowStats: {
      byStep: flowCounts,
      avgTimeToActionMs: flowTimeToActionCount > 0 ? Math.round(flowTimeToActionSum / flowTimeToActionCount) : null,
      addPersonCompletionRate,
      pulseAbandonedByReason
    },
    conversionHealth: {
      pathStarted24h: pathStarted24h ?? 0,
      journeyMapsTotal: journeyMapsTotal ?? 0,
      addPersonOpened,
      addPersonDoneShowOnMap
    },
    avgDwellByStep: Object.keys(avgDwellByStep).length > 0 ? avgDwellByStep : null,
    retentionCohorts: retentionCohorts.length > 0 ? retentionCohorts.slice(0, 14) : null,
    utmBreakdown
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

export async function sendOwnerSecurityWebhook(payload: {
  generatedAt: string;
  status: "healthy" | "warning" | "critical";
  warnings: string[];
  metrics: SecuritySignalsReport["metrics"];
}): Promise<boolean> {
  const url = runtimeEnv.ownerSecurityWebhookUrl;
  if (!url) return false;
  return sendJsonWithResilience(
    url,
    {
      source: "dawayir-owner-security-sentinel",
      ...payload
    },
    {},
    { retries: 1, breaker: securityWebhookBreaker }
  );
}
