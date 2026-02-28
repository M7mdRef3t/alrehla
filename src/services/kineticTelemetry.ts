export type KineticTelemetrySnapshot = {
  nodeId: string;
  measuredAt: string;
  velocityPxPerSec: number;
  hesitationMs: number;
  erraticDeviation: number;
  profile: "impulsive_aggressive" | "hesitant_anxious" | "scattered_unsettled" | "grounded_deliberate";
  summary: string;
};

const LATEST_KINETIC_KEY = "dawayir:kinetic:latest";
const CONSUMED_MARKER_KEY = "dawayir:kinetic:consumed";

function safeSessionStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function writeLatestKineticTelemetry(snapshot: KineticTelemetrySnapshot): void {
  const storage = safeSessionStorage();
  if (!storage) return;
  storage.setItem(LATEST_KINETIC_KEY, JSON.stringify(snapshot));
  storage.removeItem(CONSUMED_MARKER_KEY);
}

export function peekLatestKineticTelemetry(): KineticTelemetrySnapshot | null {
  const storage = safeSessionStorage();
  if (!storage) return null;
  const raw = storage.getItem(LATEST_KINETIC_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as KineticTelemetrySnapshot;
  } catch {
    return null;
  }
}

export function consumeKineticTelemetryOnce(): KineticTelemetrySnapshot | null {
  const storage = safeSessionStorage();
  if (!storage) return null;
  if (storage.getItem(CONSUMED_MARKER_KEY) === "1") return null;
  const snapshot = peekLatestKineticTelemetry();
  if (!snapshot) return null;
  storage.setItem(CONSUMED_MARKER_KEY, "1");
  return snapshot;
}

