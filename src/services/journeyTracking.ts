/**
 * تتبع الرحلة — نظامين: بدون هوية (إحصائيات مجمّعة) | مع هوية (لمتابعة المستخدمين ومساعدتهم)
 */

import { isSupabaseReady, supabase } from "./supabaseClient";
import { awardPointsForFlowStep, awardPointsForJourneyType } from "@/domains/gamification/store/achievement.store";
import { isUserMode } from "@/config/appEnv";
import { runtimeEnv } from "@/config/runtimeEnv";
import { getFromLocalStorage, removeFromLocalStorage, setInLocalStorage } from "./browserStorage";
import { getAuthUserId } from "@/domains/auth/store/auth.store";
import { CircuitBreaker } from "../architecture/circuitBreaker";
import { sendJsonWithResilience } from "../architecture/resilientHttp";
import { getStoredLeadAttribution, getStoredUtmParams } from "./marketingAttribution";
import { ANALYTICS_SESSION_KEY, getOrCreateSessionId as getUnifiedSessionId, getOrCreateAnonymousId, sendMetaEvent, AnalyticsEvents, generateUUID, buildAnalyticsEnvelope } from "./analytics";

const KEY_MODE = "dawayir-tracking-mode";
const KEY_EVENTS = "dawayir-journey-events";
const KEY_SESSION_ID = ANALYTICS_SESSION_KEY;
const KEY_API_URL = "dawayir-tracking-api-url";
const MAX_EVENTS = 2000;
const SUPABASE_PROFILES_TABLE = "profiles";
const trackingApiBreaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 20_000 });

export type TrackingMode = "anonymous" | "identified";

export type JourneyEventType =
  | "path_started"
  | "task_started"
  | "task_completed"
  | "path_regenerated"
  | "node_added"
  | "mood_logged"
  | "flow_event";

export interface JourneyEventPayload {
  path_started: { pathId: string; zone: string; symptomType?: string; relationshipRole?: string; nodeId?: string };
  task_started: { pathId: string; taskId: string; taskLabel?: string; personLabel?: string; nodeId?: string };
  task_completed: { pathId: string; taskId: string; date: string; moodScore?: number; taskLabel?: string; personLabel?: string; nodeId?: string };
  path_regenerated: { pathId: string; reason?: string };
  node_added: { ring: string; detachmentMode?: boolean; isEmergency?: boolean; personLabel?: string; nodeId?: string };
  mood_logged: { pathId: string; date: string; moodScore: number };
  flow_event: { step: string; timeToAction?: number; extra?: Record<string, unknown> };
}

export type JourneyEvent = {
  [K in JourneyEventType]: {
    type: K;
    payload: JourneyEventPayload[K];
    timestamp: number;
    /** رقم الجلسة في وضع "مع هوية" */
    sessionId?: string;
    /** Unique ID for deduplication (Meta CAPI / Gtag) */
    client_event_id: string;
  };
}[JourneyEventType]

const isBrowser = typeof window !== "undefined";
let supabaseSyncTimer: ReturnType<typeof setTimeout> | null = null;
const supabaseQueue: Array<{
  mode: TrackingMode;
  event: JourneyEvent;
}> = [];

/** Dwell time tracking — وقت الإقامة بين الخطوات */
let lastFlowStepTimestamp: number | null = null;
let lastFlowStepName: string | null = null;

/** UTM params reader — مخزنة من main.tsx عند أول زيارة */
function getOrCreateSessionId(): string {
  return getUnifiedSessionId();
}

function migrateAnonymousEventsToSession(sessionId: string): void {
  const events = loadEvents();
  if (events.length === 0) return;
  let changed = false;
  const migrated = events.map((event) => {
    if (event.sessionId) return event;
    changed = true;
    return {
      ...event,
      sessionId
    };
  });
  if (changed) saveEvents(migrated);
}

export function ensureIdentifiedTrackingSession(): string | null {
  if (!isBrowser) return null;

  if (isUserMode) {
    const sessionId = getOrCreateSessionId();
    if (!sessionId) return null;

    if (getFromLocalStorage(KEY_MODE) !== "identified") {
      setInLocalStorage(KEY_MODE, "identified");
    }
    migrateAnonymousEventsToSession(sessionId);
    return sessionId;
  }

  if (getTrackingMode() !== "identified") return null;
  const sessionId = getOrCreateSessionId();
  return sessionId || null;
}

export function getTrackingSessionId(): string | null {
  if (isUserMode) return ensureIdentifiedTrackingSession();
  if (getTrackingMode() !== "identified") return null;
  const sessionId = getOrCreateSessionId();
  return sessionId || null;
}

export function getTrackingMode(): TrackingMode {
  if (!isBrowser) return "anonymous";
  if (isUserMode) {
    if (getFromLocalStorage(KEY_MODE) !== "identified") {
      setInLocalStorage(KEY_MODE, "identified");
    }
    return "identified";
  }
  const v = getFromLocalStorage(KEY_MODE);
  return v === "identified" ? "identified" : "anonymous";
}

export function setTrackingMode(mode: TrackingMode): void {
  if (!isBrowser) return;
  if (isUserMode) {
    setInLocalStorage(KEY_MODE, "identified");
    ensureIdentifiedTrackingSession();
    return;
  }
  setInLocalStorage(KEY_MODE, mode);
}

/** رابط الخادم (باكند) — لو مضبوط، الأحداث تُرسل له تلقائياً */
export function getTrackingApiUrl(): string | null {
  if (!isBrowser) return null;
  const v = getFromLocalStorage(KEY_API_URL);
  return v && v.trim() ? v.trim() : null;
}

export function setTrackingApiUrl(url: string | null): void {
  if (!isBrowser) return;
  if (url == null || !url.trim()) removeFromLocalStorage(KEY_API_URL);
  else setInLocalStorage(KEY_API_URL, url.trim());
}

function queueSupabaseSync(mode: TrackingMode, event: JourneyEvent) {
  if (!isSupabaseReady || !supabase) return;
  supabaseQueue.push({ mode, event });
  if (supabaseSyncTimer) clearTimeout(supabaseSyncTimer);
  supabaseSyncTimer = setTimeout(() => {
    void flushSupabaseSync();
  }, 800);
}

async function flushSupabaseSync(): Promise<void> {
  if (!isSupabaseReady || !supabase) return;
  const batch = supabaseQueue.splice(0, supabaseQueue.length);
  if (batch.length === 0) return;

  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const anonymousId = getOrCreateAnonymousId();
  const leadAttr = getStoredLeadAttribution();
  const utm = getStoredUtmParams();

  const rowsWithMeta = batch
    .map((item) => ({
      item,
      row: buildAnalyticsEnvelope({
        event_type: item.event.type,
        session_id: item.event.sessionId ?? null,
        anonymous_id: anonymousId,
        client_event_id: item.event.client_event_id,
        lead_id: leadAttr?.lead_id || null,
        lead_source: leadAttr?.lead_source || null,
        utm_source: utm?.utm_source || null,
        utm_medium: utm?.utm_medium || null,
        utm_campaign: utm?.utm_campaign || null,
        payload: {
          ...(item.event.payload ?? {}),
          mode: item.mode
        }
      })
    }))
    .filter((entry): entry is { item: typeof batch[0]; row: NonNullable<typeof entry.row> } => {
      if (entry.row) return true;
      if (runtimeEnv.isDev) {
        console.warn("[JourneyTracking] Invalid analytics envelope blocked before sync");
      }
      return false;
    });

  const failedItems: typeof batch = [];

  // Redirect to unified analytics API instead of direct Supabase insertion
  for (const { item, row } of rowsWithMeta) {
    const success = await sendJsonWithResilience(
      "/api/analytics",
      row,
      { headers, keepalive: true },
      { retries: 2, retryDelayMs: 500, timeoutMs: 8000 }
    );
    if (!success) {
      if (runtimeEnv.isDev) {
        console.warn(`[JourneyTracking] Failed to sync event ${row.event_type} to unified analytics.`);
      }
      failedItems.push(item);
    }
  }

  // Restore failed items back to the queue (at the beginning) so they aren't lost on 503
  if (failedItems.length > 0) {
    supabaseQueue.unshift(...failedItems);
  }

  // Only sync session profiles for anonymous tracking.
  // Authenticated users' profiles are auto-created by the handle_auth_profile() trigger.
  const authenticatedUserId = session?.user?.id || getAuthUserId();
  if (authenticatedUserId && !session?.user?.id) { // If we only have a fallback ID but no session, return
    return;
  }

  // In local development, skip profile upserts to avoid noisy RLS/401 warnings.
  if (runtimeEnv.isDev) {
    return;
  }

  const sessionIds = Array.from(
    new Set(
      batch
        .filter((item) => item.mode === "identified" && item.event.sessionId)
        .map((item) => item.event.sessionId!)
    )
  );
  if (sessionIds.length === 0) return;

  const now = new Date().toISOString();
  
  // Identity Linking & Registration
  // We keep this bridge here to ensure the Sovereign dashboard has a profile to link to.
  const profileRows = sessionIds.map((id) => ({
    id,
    full_name: `Session ${id.slice(0, 4)}`,
    role: "session",
    last_seen: now
  }));
  
  await supabase.from(SUPABASE_PROFILES_TABLE).upsert(profileRows, {
    onConflict: "id"
  });

  // Session → User stitching: ربط الجلسة بالمستخدم عند تسجيل الدخول
  const userStitchingMap = new Map<string, Record<string, unknown>>();
  for (const { event } of batch) {
    if (event.type !== "flow_event" || !event.sessionId) continue;
    const payload = event.payload as JourneyEventPayload["flow_event"];
    if (payload?.step !== "auth_login_success") continue;
    const extra = payload?.extra as Record<string, unknown> | undefined;
    const userId = typeof extra?.userId === "string" ? extra.userId : null;
    const email = typeof extra?.email === "string" ? extra.email : null;
    
    if (!userId) continue;
    
    userStitchingMap.set(event.sessionId, {
      id: event.sessionId,
      user_id: userId,
      email: email ?? undefined,
      role: "session",
      last_seen: now
    });
  }

  if (userStitchingMap.size > 0) {
    const stitchingRows = Array.from(userStitchingMap.values());
    await supabase.from(SUPABASE_PROFILES_TABLE).upsert(stitchingRows, { onConflict: "id" });
  }
}


function loadEvents(): JourneyEvent[] {
  if (!isBrowser) return [];
  try {
    const raw = getFromLocalStorage(KEY_EVENTS);
    if (!raw) return [];
    const arr = JSON.parse(raw) as JourneyEvent[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function saveEvents(events: JourneyEvent[]): void {
  if (!isBrowser) return;
  const trimmed = events.slice(-MAX_EVENTS);
  try {
    setInLocalStorage(KEY_EVENTS, JSON.stringify(trimmed));
  } catch {
    // Ignore storage quota issues and keep runtime stable.
  }
}

/** أحداث السجل التخطيطي — للأحدث للأقدم */
const TIMELINE_EVENT_TYPES: JourneyEventType[] = ["task_completed", "node_added", "path_started"];

export function getTimelineEvents(): JourneyEvent[] {
  const events = loadEvents().filter((e) => TIMELINE_EVENT_TYPES.includes(e.type));
  return [...events].sort((a, b) => b.timestamp - a.timestamp);
}

/** آخر مهمة مكتملة لشخص — لـ "ذكريات الرحلة" في ViewPersonModal */
export interface LastTaskForNode {
  taskLabel: string;
  timestamp: number;
}

export function getLastTaskForNode(nodeId: string): LastTaskForNode | null {
  const events = loadEvents();
  const tasks = events
    .filter((e): e is JourneyEvent & { type: "task_completed" } => e.type === "task_completed")
    .map((e) => ({ event: e, payload: e.payload as JourneyEventPayload["task_completed"] }))
    .filter(({ payload }) => payload.nodeId === nodeId)
    .sort((a, b) => b.event.timestamp - a.event.timestamp);
  const task = tasks[0];
  if (!task) return null;
  const { event, payload } = task;
  const taskLabel = payload.taskLabel?.trim() || "خطوة";
  return { taskLabel, timestamp: event.timestamp };
}

/** نقاط تدفق الزائر — للوحة الأونر (خريطة القرارات) */
export type FlowStep =
  | "landing_viewed"
  | "landing_ab_assigned"
  | "landing_clicked_start"
  | "journey_started_frictionless"
  | "cta_free_clicked"
  | "cta_activation_clicked"
  | "activation_page_viewed"
  | "activation_session_created"
  | "activation_provider_unavailable"
  | "payment_success"
  | "payment_failed"
  | "payment_intent_submitted"
  | "payment_proof_submitted"
  | "paid_feature_clicked"
  | "premium_bridge_viewed"
  | "activation_detected_realtime"
  | "lead_form_submitted"
  | "lead_followup_attempted"
  | "lead_followup_connected"
  | "qualified_lead"
  | "retargeting_clicked"
  | "landing_closed"
  | "onboarding_opened"
  | "onboarding_phase_noise_completed"
  | "onboarding_phase_inventory_completed"
  | "onboarding_phase_mapping_completed"
  | "onboarding_completed"
  | "onboarding_skipped"
  | "onboarding_contact_skipped"
  | "lead_captured"
  | "pulse_phone_captured"
  | "auth_gate_opened"
  | "auth_login_success"
  | "post_auth_intent_phase_one_map"
  | "post_auth_intent_goal_picker"
  | "goal_selected"
  | "screen_goal_viewed"
  | "screen_map_viewed"
  | "screen_guided_viewed"
  | "screen_mission_viewed"
  | "screen_tools_viewed"
  | "screen_diplomacy_viewed"
  | "screen_guilt_court_viewed"
  | "screen_enterprise_viewed"
  | "screen_settings_viewed"
  | "screen_oracle_dashboard_viewed"
  | "screen_armory_viewed"
  | "screen_exit_scripts_viewed"
  | "screen_grounding_viewed"
  | "mirror_journey_started"
  | "mirror_journey_completed"
  | "install_clicked"
  | "profile_clicked"
  | "pulse_opened"
  | "pulse_copy_variant_assigned"
  | "pulse_energy_changed"
  | "pulse_energy_unstable"
  | "pulse_energy_weekly_recommendation_applied"
  | "pulse_energy_undo_applied"
  | "pulse_mood_changed"
  | "pulse_mood_unstable"
  | "pulse_mood_weekly_recommendation_applied"
  | "pulse_focus_changed"
  | "pulse_notes_used"
  | "pulse_notes_quick_chip_applied"
  | "pulse_abandoned"
  | "pulse_completed"
  | "pulse_completed_with_choices"
  | "pulse_completed_without_choices"
  | "add_person_opened"
  | "add_person_done_show_on_map"
  | "add_person_start_path_clicked"
  | "add_person_start_path_blocked_missing_node"
  | "add_person_cta_forced_shown"
  | "add_person_cta_forced_blocked_close"
  | "add_person_dropped"
  | "feedback_opened"
  | "feedback_submitted"
  | "feature_showcase_clicked"
  | "tools_opened"
  | "playbook_executed"
  | "affiliate_link_exposed"
  | "affiliate_link_clicked"
  | "utm_captured"
  | "next_step_rendered"
  | "next_step_action_taken"
  | "next_step_dismissed"
  | "routing_intervention_triggered"
  | "safety_triage_triggered"
  | "quiz_completed"
  | "quiz_hub_opened"
  | "diagnosis_completed"
  | "activation_copy_number_clicked"
  | "activation_proof_upload_started"
  | "activation_proof_upload_completed"
  | "activation_submit_clicked"
  | "activation_submit_success"
  | "activation_submit_failed"
  | "paid_feature_clicked"
  | "premium_bridge_viewed";

export function recordFlowEvent(
  step: FlowStep,
  extra?: {
    timeToAction?: number;
    atStep?: string;
    closeReason?: "backdrop" | "close_button" | "programmatic" | "browser_close";
    meta?: Record<string, unknown>;
  }
): void {
  const now = Date.now();

  // Dwell time — وقت الإقامة بين هذه الخطوة والسابقة
  const dwellTime = lastFlowStepTimestamp != null ? now - lastFlowStepTimestamp : null;
  const previousStep = lastFlowStepName;
  lastFlowStepTimestamp = now;
  lastFlowStepName = step;

  // UTM params — مصدر الزيارة التسويقي
  const utmParams = getStoredUtmParams();
  const leadAttribution = getStoredLeadAttribution();

  const client_event_id = extra?.meta?.client_event_id as string || generateUUID();
  
  const hasExtraData = extra && Object.keys(extra).length > 0;
  const hasExtraKeys = !!(hasExtraData || utmParams || leadAttribution || dwellTime != null || previousStep);

  const sanitizedMeta = extra?.meta
    ? Object.fromEntries(Object.entries(extra.meta).filter(([_, v]) => v !== undefined))
    : {};

  const event = {
    type: "flow_event" as const,
    payload: {
      step,
      timeToAction: extra?.timeToAction,
      extra: hasExtraKeys
        ? {
            ...(extra?.atStep ? { atStep: extra.atStep } : {}),
            ...(extra?.closeReason ? { closeReason: extra.closeReason } : {}),
            ...sanitizedMeta,
            ...(utmParams ? { utm: utmParams } : {}),
            ...(leadAttribution ? { lead: leadAttribution } : {}),
            ...(dwellTime != null ? { dwellTime } : {}),
            ...(previousStep ? { previousStep } : {})
          }
        : undefined
    } as JourneyEventPayload["flow_event"],
    timestamp: now,
    sessionId: getOrCreateSessionId(),
    client_event_id
  } as JourneyEvent;

  // Bridge to Meta Pixel (Client-side) for high-value events
  const metaBypass = { bypassConsent: true, client_event_id };
  if (step === "lead_form_submitted") sendMetaEvent("Lead", {}, metaBypass);
  if (step === "onboarding_completed") sendMetaEvent("CompleteRegistration", {}, metaBypass);
  if (step === "payment_proof_submitted") sendMetaEvent("Purchase", { currency: "USD", value: 30 }, metaBypass); // Baseline value
  if (step === "qualified_lead" || step === "gate_qualified" as any) sendMetaEvent("ViewContent", { content_name: "Qualified" }, metaBypass);

  const events = loadEvents();
  events.push(event);
  saveEvents(events);
  awardPointsForFlowStep(step);
  queueSupabaseSync(getTrackingMode(), event);
  const apiUrl = getTrackingApiUrl();
  if (apiUrl) {
    void sendJsonWithResilience(
      apiUrl,
      { mode: getTrackingMode(), event },
      {},
      { retries: 1, breaker: trackingApiBreaker }
    );
  }
}

/**
 * تسجيل حدث — في وضع anonymous بدون sessionId، في identified مع sessionId
 */
export function recordJourneyEvent(
  type: JourneyEventType,
  payload: JourneyEventPayload[JourneyEventType]
): void {
  const mode = getTrackingMode();
  const event = {
    type,
    payload,
    timestamp: Date.now(),
    client_event_id: generateUUID()
  } as JourneyEvent;
  if (mode === "identified") {
    event.sessionId = getOrCreateSessionId();
  }
  const events = loadEvents();
  events.push(event);
  saveEvents(events);
  awardPointsForJourneyType(type);
  queueSupabaseSync(mode, event);

  const apiUrl = getTrackingApiUrl();
  if (apiUrl) {
    void sendJsonWithResilience(
      apiUrl,
      { mode: getTrackingMode(), event },
      {},
      { retries: 1, breaker: trackingApiBreaker }
    );
  }
}

export function hasPathStartedForNode(nodeId: string): boolean {
  const safeNodeId = nodeId.trim();
  if (!safeNodeId) return false;
  const events = loadEvents();
  return events.some((event) => {
    if (event.type !== "path_started") return false;
    const payload = event.payload as JourneyEventPayload["path_started"];
    return payload.nodeId === safeNodeId;
  });
}

export function recordPathStartedOnce(payload: JourneyEventPayload["path_started"]): boolean {
  const safeNodeId = typeof payload.nodeId === "string" ? payload.nodeId.trim() : "";
  if (safeNodeId && hasPathStartedForNode(safeNodeId)) {
    return false;
  }
  recordJourneyEvent("path_started", payload);
  return true;
}

/** إحصائيات مجمّعة — بدون هوية (للاستخدام في "أطلس العلاقات" أو لوحة عامة) */
export interface AggregateStats {
  totalPathStarts: number;
  totalTaskCompletions: number;
  totalMoodLogged: number;
  totalNodesAdded: number;
  pathRegenerates: number;
  avgMoodScore: number | null;
  byPathId: Record<string, { starts: number; completions: number }>;
  byZone: Record<string, number>;
}

export function getAggregateStats(): AggregateStats {
  const events = loadEvents();
  const stats: AggregateStats = {
    totalPathStarts: 0,
    totalTaskCompletions: 0,
    totalMoodLogged: 0,
    totalNodesAdded: 0,
    pathRegenerates: 0,
    avgMoodScore: null,
    byPathId: {},
    byZone: {}
  };
  let moodSum = 0;
  let moodCount = 0;

  for (const e of events) {
    switch (e.type) {
      case "path_started":
        stats.totalPathStarts++;
        if (e.payload.pathId) {
          stats.byPathId[e.payload.pathId] = stats.byPathId[e.payload.pathId] ?? { starts: 0, completions: 0 };
          stats.byPathId[e.payload.pathId].starts++;
        }
        if (e.payload.zone) stats.byZone[e.payload.zone] = (stats.byZone[e.payload.zone] ?? 0) + 1;
        break;
      case "task_completed":
        stats.totalTaskCompletions++;
        if (e.payload.pathId) {
          stats.byPathId[e.payload.pathId] = stats.byPathId[e.payload.pathId] ?? { starts: 0, completions: 0 };
          stats.byPathId[e.payload.pathId].completions++;
        }
        if (e.payload.moodScore != null) {
          moodSum += e.payload.moodScore;
          moodCount++;
        }
        break;
      case "mood_logged":
        stats.totalMoodLogged++;
        if (e.payload.moodScore != null) {
          moodSum += e.payload.moodScore;
          moodCount++;
        }
        break;
      case "path_regenerated":
        stats.pathRegenerates++;
        break;
      case "node_added":
        stats.totalNodesAdded++;
        if (e.payload.ring) stats.byZone[e.payload.ring] = (stats.byZone[e.payload.ring] ?? 0) + 1;
        break;
    }
  }

  if (moodCount > 0) stats.avgMoodScore = Math.round((moodSum / moodCount) * 10) / 10;
  return stats;
}

/** بيانات مجمّعة حسب اليوم — لمؤشر الوعي الجماعي (لوحة الأطلس) */
export interface DayAggregate {
  date: string;
  pathStarts: number;
  taskCompletions: number;
  nodesAdded: number;
  moodSum: number;
  moodCount: number;
}

export function getEventsByDay(): DayAggregate[] {
  const events = loadEvents();
  const byDay = new Map<string, DayAggregate>();

  const toDate = (ts: number) => new Date(ts).toISOString().slice(0, 10);

  for (const e of events) {
    const date = toDate(e.timestamp);
    const cur = byDay.get(date) ?? {
      date,
      pathStarts: 0,
      taskCompletions: 0,
      nodesAdded: 0,
      moodSum: 0,
      moodCount: 0
    };
    switch (e.type) {
      case "path_started":
        cur.pathStarts++;
        break;
      case "task_completed":
        cur.taskCompletions++;
        if (e.payload.moodScore != null) {
          cur.moodSum += e.payload.moodScore;
          cur.moodCount++;
        }
        break;
      case "node_added":
        cur.nodesAdded++;
        break;
      case "mood_logged":
        if (e.payload.moodScore != null) {
          cur.moodSum += e.payload.moodScore;
          cur.moodCount++;
        }
        break;
      default:
        break;
    }
    byDay.set(date, cur);
  }

  return Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/** جلسة واحدة — للتتبع "مع هوية" */
export interface SessionSummary {
  sessionId: string;
  firstSeen: number;
  lastSeen: number;
  pathStarts: number;
  taskCompletions: number;
  nodesAdded: number;
  lastPathId: string | null;
  lastActivity: string;
  moodScores: number[];
}

export interface SessionTimelineEvent {
  type: JourneyEventType;
  payload: JourneyEventPayload[JourneyEventType];
  timestamp: number;
  sessionId?: string;
}

export function getSessionTimelineEvents(sessionId: string, limit = 200): SessionTimelineEvent[] {
  const sid = sessionId.trim();
  if (!sid) return [];
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 1000) : 200;
  return loadEvents()
    .filter((e) => e.sessionId === sid)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, safeLimit)
    .map((e) => ({
      type: e.type,
      payload: e.payload,
      timestamp: e.timestamp,
      sessionId: e.sessionId
    }));
}

export function getSessionsWithProgress(): SessionSummary[] {
  const events = loadEvents().filter((e) => e.sessionId);
  const bySession = new Map<string, JourneyEvent[]>();
  for (const e of events) {
    if (!e.sessionId) continue;
    const list = bySession.get(e.sessionId) ?? [];
    list.push(e);
    bySession.set(e.sessionId, list);
  }

  const summaries: SessionSummary[] = [];
  bySession.forEach((list, sessionId) => {
    const sorted = [...list].sort((a, b) => a.timestamp - b.timestamp);
    const first = sorted[0]!.timestamp;
    const last = sorted[sorted.length - 1]!.timestamp;
    let pathStarts = 0;
    let taskCompletions = 0;
    let nodesAdded = 0;
    let lastPathId: string | null = null;
    const moodScores: number[] = [];

    for (const e of list) {
      switch (e.type) {
        case "path_started":
          pathStarts++;
          if (e.payload.pathId) lastPathId = e.payload.pathId;
          break;
        case "task_completed":
          taskCompletions++;
          if (e.payload.pathId) lastPathId = e.payload.pathId;
          if (e.payload.moodScore != null) moodScores.push(e.payload.moodScore);
          break;
        case "node_added":
          nodesAdded++;
          break;
        case "mood_logged":
          if (e.payload.moodScore != null) moodScores.push(e.payload.moodScore);
          break;
      }
    }

    const lastEv = list[list.length - 1];
    let lastActivity = "—";
    if (lastEv) {
      const d = new Date(lastEv.timestamp);
      lastActivity = d.toLocaleDateString("ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    }

    summaries.push({
      sessionId,
      firstSeen: first,
      lastSeen: last,
      pathStarts,
      taskCompletions,
      nodesAdded,
      lastPathId,
      lastActivity,
      moodScores
    });
  });

  return summaries.sort((a, b) => b.lastSeen - a.lastSeen);
}

export function clearAllJourneyEvents(): void {
  if (!isBrowser) return;
  removeFromLocalStorage(KEY_EVENTS);
}

export function clearSessionId(): void {
  if (!isBrowser) return;
  removeFromLocalStorage(KEY_SESSION_ID);
}

export function getRecentJourneyEvents(limit = 500): JourneyEvent[] {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 5000) : 500;
  return loadEvents()
    .slice(-safeLimit)
    .sort((a, b) => b.timestamp - a.timestamp);
}
