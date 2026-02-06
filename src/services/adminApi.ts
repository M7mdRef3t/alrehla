import { supabase, isSupabaseReady } from "./supabaseClient";
import { useAdminState, ADMIN_ACCESS_CODE } from "../state/adminState";
import { getAuthToken } from "../state/authState";
import type { FeatureFlagKey, FeatureFlagMode } from "../config/features";
import type {
  ScoringWeights,
  ScoringThresholds,
  AiLogEntry,
  AdminMission,
  AdminBroadcast
} from "../state/adminState";
import type { MapNode } from "../modules/map/mapTypes";
import type { PulseCheckMode } from "../state/pulseState";

type SystemSettingKey =
  | "feature_flags"
  | "system_prompt"
  | "scoring_weights"
  | "scoring_thresholds"
  | "pulse_check_mode";

const SETTINGS_TABLE = "system_settings";
const ADMIN_API_BASE = import.meta.env.VITE_ADMIN_API_BASE ?? "";
const ADMIN_API_PATH = `${ADMIN_API_BASE}/api/admin`;

function getAdminCode(): string | null {
  const state = useAdminState.getState();
  return state.adminCode || import.meta.env.VITE_ADMIN_CODE || ADMIN_ACCESS_CODE || null;
}

async function callAdminApi<T>(path: string, options?: RequestInit): Promise<T | null> {
  const code = getAdminCode();
  const authToken = getAuthToken();
  if (!code && !authToken) return null;
  try {
    const res = await fetch(`${ADMIN_API_PATH}/${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(code ? { "x-admin-code": code } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(options?.headers ?? {})
      }
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const toSettingMap = (rows: Array<{ key: string; value: unknown }>) => {
  const map = new Map<string, unknown>();
  rows.forEach((row) => map.set(row.key, row.value));
  return map;
};

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
  }>("config");
  if (apiData) {
    const settings = apiData.settings;
    if (settings) {
      return {
        featureFlags: settings.feature_flags as Record<FeatureFlagKey, FeatureFlagMode> | undefined,
        systemPrompt: settings.system_prompt as string | undefined,
        scoringWeights: settings.scoring_weights as ScoringWeights | undefined,
        scoringThresholds: settings.scoring_thresholds as ScoringThresholds | undefined,
        pulseCheckMode: settings.pulse_check_mode as PulseCheckMode | undefined
      };
    }
    return {
      featureFlags: apiData.featureFlags,
      systemPrompt: apiData.systemPrompt,
      scoringWeights: apiData.scoringWeights,
      scoringThresholds: apiData.scoringThresholds,
      pulseCheckMode: apiData.pulseCheckMode
    };
  }
  const settings = await fetchSettings([
    "feature_flags",
    "system_prompt",
    "scoring_weights",
    "scoring_thresholds",
    "pulse_check_mode"
  ]);
  if (!settings) return null;
  return {
    featureFlags: settings.get("feature_flags") as Record<FeatureFlagKey, FeatureFlagMode> | undefined,
    systemPrompt: settings.get("system_prompt") as string | undefined,
    scoringWeights: settings.get("scoring_weights") as ScoringWeights | undefined,
    scoringThresholds: settings.get("scoring_thresholds") as ScoringThresholds | undefined,
    pulseCheckMode: settings.get("pulse_check_mode") as PulseCheckMode | undefined
  };
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
    createdAt: new Date(String(row.created_at ?? Date.now())).getTime()
  }));
}

export async function saveBroadcast(broadcast: AdminBroadcast) {
  const apiRes = await callAdminApi<{ ok: boolean }>("broadcasts", {
    method: "POST",
    body: JSON.stringify({ broadcast })
  });
  if (apiRes?.ok) return true;
  if (!isSupabaseReady || !supabase) return false;
  const { error } = await supabase.from("admin_broadcasts").insert({
    id: broadcast.id,
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

export interface OverviewStats {
  totalUsers: number | null;
  activeNow: number | null;
  avgMood: number | null;
  aiTokensUsed: number | null;
  growthData: Array<{ date: string; paths: number; nodes: number }>;
  zones: Array<{ label: string; count: number }>;
}

export interface JourneyMapSnapshot {
  sessionId: string;
  nodes: MapNode[];
  updatedAt: number | null;
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

export async function fetchOverviewStats(): Promise<OverviewStats | null> {
  const apiData = await callAdminApi<OverviewStats>("overview");
  if (apiData) return apiData;
  if (!isSupabaseReady || !supabase) return null;
  const now = new Date();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count: usersCount }, { count: activeCount }, { data: events }, { count: aiLogsCount }] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("journey_events").select("id", { count: "exact", head: true }).gte("created_at", fiveMinAgo),
      supabase
        .from("journey_events")
        .select("type,payload,created_at")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: true })
        .limit(1000),
      supabase.from("admin_ai_logs").select("id", { count: "exact", head: true })
    ]);

  if (!events) return {
    totalUsers: usersCount ?? null,
    activeNow: activeCount ?? null,
    avgMood: null,
    aiTokensUsed: aiLogsCount ?? null,
    growthData: [],
    zones: []
  };

  const growthMap = new Map<string, { paths: number; nodes: number }>();
  const zoneMap = new Map<string, number>();
  let moodSum = 0;
  let moodCount = 0;

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
  }

  const growthData = Array.from(growthMap.entries()).map(([date, value]) => ({
    date,
    paths: value.paths,
    nodes: value.nodes
  }));
  const zones = Array.from(zoneMap.entries()).map(([label, count]) => ({ label, count }));

  return {
    totalUsers: usersCount ?? null,
    activeNow: activeCount ?? null,
    avgMood: moodCount ? Math.round((moodSum / moodCount) * 10) / 10 : null,
    aiTokensUsed: aiLogsCount ?? null,
    growthData,
    zones
  };
}
