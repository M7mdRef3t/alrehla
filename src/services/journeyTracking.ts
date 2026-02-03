/**
 * تتبع الرحلة — نظامين: بدون هوية (إحصائيات مجمّعة) | مع هوية (لمتابعة المستخدمين ومساعدتهم)
 */

const KEY_MODE = "dawayir-tracking-mode";
const KEY_EVENTS = "dawayir-journey-events";
const KEY_SESSION_ID = "dawayir-session-id";
const KEY_API_URL = "dawayir-tracking-api-url";
const MAX_EVENTS = 2000;

export type TrackingMode = "anonymous" | "identified";

export type JourneyEventType =
  | "path_started"
  | "task_completed"
  | "path_regenerated"
  | "node_added"
  | "mood_logged";

export interface JourneyEventPayload {
  path_started?: { pathId: string; zone: string; symptomType?: string; relationshipRole?: string };
  task_completed?: { pathId: string; taskId: string; date: string; moodScore?: number };
  path_regenerated?: { pathId: string; reason?: string };
  node_added?: { ring: string; detachmentMode?: boolean; isEmergency?: boolean };
  mood_logged?: { pathId: string; date: string; moodScore: number };
}

export interface JourneyEvent {
  type: JourneyEventType;
  payload: JourneyEventPayload[JourneyEventType];
  timestamp: number;
  /** موجود فقط في وضع "مع هوية" */
  sessionId?: string;
}

const isBrowser = typeof window !== "undefined";

function getOrCreateSessionId(): string {
  if (!isBrowser) return "";
  let id = localStorage.getItem(KEY_SESSION_ID);
  if (!id) {
    id = "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11);
    localStorage.setItem(KEY_SESSION_ID, id);
  }
  return id;
}

export function getTrackingMode(): TrackingMode {
  if (!isBrowser) return "anonymous";
  const v = localStorage.getItem(KEY_MODE);
  return v === "identified" ? "identified" : "anonymous";
}

export function setTrackingMode(mode: TrackingMode): void {
  if (!isBrowser) return;
  localStorage.setItem(KEY_MODE, mode);
}

/** رابط الخادم (باكند) — لو مضبوط، الأحداث تُرسل له تلقائياً */
export function getTrackingApiUrl(): string | null {
  if (!isBrowser) return null;
  const v = localStorage.getItem(KEY_API_URL);
  return v && v.trim() ? v.trim() : null;
}

export function setTrackingApiUrl(url: string | null): void {
  if (!isBrowser) return;
  if (url == null || !url.trim()) localStorage.removeItem(KEY_API_URL);
  else localStorage.setItem(KEY_API_URL, url.trim());
}

function loadEvents(): JourneyEvent[] {
  if (!isBrowser) return [];
  try {
    const raw = localStorage.getItem(KEY_EVENTS);
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
    localStorage.setItem(KEY_EVENTS, JSON.stringify(trimmed));
  } catch (e) {
    if (import.meta.env.DEV) console.warn("journeyTracking: save failed", e);
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
  const event: JourneyEvent = {
    type,
    payload,
    timestamp: Date.now()
  };
  if (mode === "identified") {
    event.sessionId = getOrCreateSessionId();
  }
  const events = loadEvents();
  events.push(event);
  saveEvents(events);

  const apiUrl = getTrackingApiUrl();
  if (apiUrl) {
    const body = { mode: getTrackingMode(), event };
    fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).catch((err) => {
      if (import.meta.env.DEV) console.warn("journeyTracking: send to backend failed", err);
    });
  }
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
  localStorage.removeItem(KEY_EVENTS);
}

export function clearSessionId(): void {
  if (!isBrowser) return;
  localStorage.removeItem(KEY_SESSION_ID);
}
