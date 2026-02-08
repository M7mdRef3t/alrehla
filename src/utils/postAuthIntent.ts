import type { PulseFocus, PulseMood } from "../state/pulseState";

export type PostAuthIntent =
  | {
      kind: "start_recovery";
      pulse: { energy: number; mood: PulseMood; focus: PulseFocus; auto?: boolean };
      createdAt: number;
    }
  | {
      kind: "login";
      createdAt: number;
    };

const STORAGE_KEY = "dawayir-post-auth-intent";
const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

const VALID_MOODS: ReadonlySet<PulseMood> = new Set(["bright", "calm", "anxious", "angry", "sad"]);
const VALID_FOCUS: ReadonlySet<PulseFocus> = new Set(["event", "thought", "body", "none"]);

function clampEnergy(n: number): number {
  const v = Math.round(n);
  if (v < 1) return 1;
  if (v > 10) return 10;
  return v;
}

function isValidPulse(pulse: unknown): pulse is { energy: number; mood: PulseMood; focus: PulseFocus; auto?: boolean } {
  if (!pulse || typeof pulse !== "object") return false;
  const obj = pulse as Record<string, unknown>;
  if (typeof obj.energy !== "number" || !Number.isFinite(obj.energy)) return false;
  if (typeof obj.mood !== "string" || !VALID_MOODS.has(obj.mood as PulseMood)) return false;
  if (typeof obj.focus !== "string" || !VALID_FOCUS.has(obj.focus as PulseFocus)) return false;
  if (obj.auto != null && typeof obj.auto !== "boolean") return false;
  return true;
}

export function setPostAuthIntent(intent: PostAuthIntent): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
  } catch {
    // Ignore storage errors to avoid blocking auth.
  }
}

export function clearPostAuthIntent(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}

export function getPostAuthIntent(): PostAuthIntent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;

    const obj = parsed as Record<string, unknown>;
    if (typeof obj.createdAt !== "number") return null;
    if (Date.now() - obj.createdAt > MAX_AGE_MS) return null;

    if (obj.kind === "login") {
      return { kind: "login", createdAt: obj.createdAt };
    }

    if (obj.kind === "start_recovery") {
      // New format: pulse payload.
      if (isValidPulse(obj.pulse)) {
        return {
          kind: "start_recovery",
          pulse: {
            energy: clampEnergy(obj.pulse.energy),
            mood: obj.pulse.mood,
            focus: obj.pulse.focus,
            auto: obj.pulse.auto
          },
          createdAt: obj.createdAt
        };
      }

      // Backward compat: legacy microCompass value (1-10).
      if (typeof obj.microCompass === "number" && Number.isFinite(obj.microCompass)) {
        return {
          kind: "start_recovery",
          pulse: { energy: clampEnergy(obj.microCompass), mood: "calm", focus: "none" },
          createdAt: obj.createdAt
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}
