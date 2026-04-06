"use client";

type SessionHistoryEntry = {
  dominantNodeId: number;
  clarityDelta: number;
  overloadIndex: number;
  transitionCount: number;
  timestamp: number;
};

const STORAGE_KEY = "dawayir_live_session_history";
const MAX_ENTRIES = 21;

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

import { supabase } from "../../../services/supabaseClient";
import { trackEvent } from "../../../services/analytics";

let _liveSessionCache: SessionHistoryEntry[] | null = null;
let _liveSessionLoaded = false;

export async function syncLiveSessionsFromSupabase(): Promise<void> {
    if (!supabase || _liveSessionLoaded) return;
    try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.user) return;
        
        const { data } = await supabase
            .from("telemetry_events")
            .select("payload")
            .eq("user_id", sessionData.session.user.id)
            .eq("event_type", "live_session_backup")
            .order("occurred_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (data && data.payload) {
            _liveSessionCache = data.payload as unknown as SessionHistoryEntry[];
            _liveSessionLoaded = true;
            try {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(_liveSessionCache));
            } catch {
                // Silently skip if local storage fails
            }
        }
    } catch { /* fallback */ }
}

export function readSessionHistory(): SessionHistoryEntry[] {
  if (_liveSessionCache) return [..._liveSessionCache];
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((entry): entry is SessionHistoryEntry => {
      if (!entry || typeof entry !== "object") return false;
      const candidate = entry as Record<string, unknown>;
      return (
        typeof candidate.dominantNodeId === "number" &&
        typeof candidate.clarityDelta === "number" &&
        typeof candidate.overloadIndex === "number" &&
        typeof candidate.transitionCount === "number" &&
        typeof candidate.timestamp === "number"
      );
    });
  } catch {
    return [];
  }
}

export function saveSessionSummary(entry: Omit<SessionHistoryEntry, "timestamp">) {
  if (!canUseStorage()) return;

  const next: SessionHistoryEntry = {
    ...entry,
    timestamp: Date.now(),
  };

  const existing = readSessionHistory();
  const updated = [...existing, next].slice(-MAX_ENTRIES);
  _liveSessionCache = updated;
  try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
      // Silently skip if local storage fails
  }

  if (supabase) {
      supabase.auth.getSession().then(({ data: sess }) => {
          if (sess?.session?.user) {
              trackEvent("live_session_backup", { entries: updated } as any);
          }
      }).catch(() => {});
  }
}

export function getWeeklyPattern() {
  const history = readSessionHistory().slice(-7);
  if (history.length < 2) return null;

  const counts = new Map<number, number>();
  for (const session of history) {
    counts.set(session.dominantNodeId, (counts.get(session.dominantNodeId) ?? 0) + 1);
  }

  const recurring = [...counts.entries()].sort((left, right) => right[1] - left[1])[0] ?? [1, 0];
  const firstClarity = history[0]?.clarityDelta ?? 0;
  const lastClarity = history[history.length - 1]?.clarityDelta ?? 0;
  const avgOverload = history.reduce((sum, entry) => sum + entry.overloadIndex, 0) / history.length;

  return {
    sessionCount: history.length,
    recurringNodeId: recurring[0],
    recurringPct: Math.round((recurring[1] / history.length) * 100),
    clarityTrend: lastClarity - firstClarity,
    avgOverload,
    history,
  };
}
