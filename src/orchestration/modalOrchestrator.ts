export const AUTO_COCOON_LAST_SHOWN_DATE_KEY = "dawayir-auto-cocoon-last-shown-date";
const AUTO_COCOON_MIN_INTERVAL_MS = 30_000;

export type CocoonOpenSource = "auto" | "manual";

export interface CocoonOpenInput {
  source: CocoonOpenSource;
  isLandingScreen: boolean;
  now: number;
  suppressedUntil: number;
  suppressReopen: boolean;
  showBreathing: boolean;
  lastAutoOpenAt: number;
  lastShownDate: string | null;
}

export interface CocoonOpenDecision {
  shouldOpen: boolean;
  nextLastAutoOpenAt?: number;
  nextLastShownDate?: string;
}

export function getLocalDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function evaluateCocoonOpen(input: CocoonOpenInput): CocoonOpenDecision {
  if (input.now < input.suppressedUntil) return { shouldOpen: false };
  if (input.suppressReopen || input.showBreathing) return { shouldOpen: false };

  if (input.source !== "auto") {
    return { shouldOpen: true };
  }

  if (input.isLandingScreen) return { shouldOpen: false };

  const todayKey = getLocalDateKey(new Date(input.now));
  if (input.lastShownDate === todayKey) return { shouldOpen: false };
  if (input.now - input.lastAutoOpenAt < AUTO_COCOON_MIN_INTERVAL_MS) return { shouldOpen: false };

  return {
    shouldOpen: true,
    nextLastAutoOpenAt: input.now,
    nextLastShownDate: todayKey
  };
}
