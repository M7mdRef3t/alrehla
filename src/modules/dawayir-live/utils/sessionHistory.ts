"use client";

type SessionHistoryEntry = {
  dominantNodeId: number;
  clarityDelta: number;
  overloadIndex: number;
  transitionCount: number;
  recordingSeconds?: number;
  transcriptCount?: number;
  timestamp: number;
};

const STORAGE_KEY = "dawayir_live_session_history";
const MAX_ENTRIES = 21;

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function readSessionHistory(): SessionHistoryEntry[] {
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
      typeof candidate.timestamp === "number" &&
      (candidate.recordingSeconds === undefined || typeof candidate.recordingSeconds === "number") &&
      (candidate.transcriptCount === undefined || typeof candidate.transcriptCount === "number")
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
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
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
