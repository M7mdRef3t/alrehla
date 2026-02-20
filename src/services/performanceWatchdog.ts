type WatchdogStatus = "healthy" | "warning" | "critical";

export interface WatchdogSnapshot {
  status: WatchdogStatus;
  avgLagMs: number;
  p95LagMs: number;
  longTasks1m: number;
  freezes1m: number;
  lastFreezeAt: number | null;
  updatedAt: number;
}

type Listener = (snapshot: WatchdogSnapshot) => void;

const SAMPLE_INTERVAL_MS = 1000;
const WARN_LAG_MS = 180;
const CRITICAL_LAG_MS = 450;
const FREEZE_LAG_MS = 1200;
const WINDOW_MS = 60_000;
const MAX_SAMPLES = 240;

let started = false;
let intervalRef: ReturnType<typeof setInterval> | null = null;
let expectedNext = 0;
let longTaskObserver: PerformanceObserver | null = null;

const lagSamples: number[] = [];
const freezeEvents: number[] = [];
const longTaskEvents: number[] = [];
const listeners = new Set<Listener>();

let snapshot: WatchdogSnapshot = {
  status: "healthy",
  avgLagMs: 0,
  p95LagMs: 0,
  longTasks1m: 0,
  freezes1m: 0,
  lastFreezeAt: null,
  updatedAt: Date.now()
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function compactWindow(now: number): void {
  while (freezeEvents.length && now - freezeEvents[0] > WINDOW_MS) freezeEvents.shift();
  while (longTaskEvents.length && now - longTaskEvents[0] > WINDOW_MS) longTaskEvents.shift();
}

function computeP95(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  return sorted[idx] ?? 0;
}

function emit(next: WatchdogSnapshot): void {
  snapshot = next;
  for (const listener of listeners) listener(next);
}

function computeStatus(avgLagMs: number, p95LagMs: number, freezes1m: number, longTasks1m: number): WatchdogStatus {
  if (freezes1m >= 2 || p95LagMs >= CRITICAL_LAG_MS) return "critical";
  if (avgLagMs >= WARN_LAG_MS || p95LagMs >= WARN_LAG_MS || longTasks1m >= 4) return "warning";
  return "healthy";
}

function tick(): void {
  const now = Date.now();
  const lagMs = Math.max(0, now - expectedNext);
  expectedNext = now + SAMPLE_INTERVAL_MS;

  lagSamples.push(lagMs);
  if (lagSamples.length > MAX_SAMPLES) lagSamples.shift();

  if (lagMs >= FREEZE_LAG_MS) {
    freezeEvents.push(now);
  }
  compactWindow(now);

  const avgLagMs = lagSamples.length
    ? lagSamples.reduce((sum, value) => sum + value, 0) / lagSamples.length
    : 0;
  const p95LagMs = computeP95(lagSamples);
  const freezes1m = freezeEvents.length;
  const longTasks1m = longTaskEvents.length;

  emit({
    status: computeStatus(avgLagMs, p95LagMs, freezes1m, longTasks1m),
    avgLagMs: Math.round(avgLagMs),
    p95LagMs: Math.round(p95LagMs),
    longTasks1m,
    freezes1m,
    lastFreezeAt: freezeEvents.length ? freezeEvents[freezeEvents.length - 1] : null,
    updatedAt: now
  });
}

export function startPerformanceWatchdog(): void {
  if (!isBrowser() || started) return;
  started = true;
  expectedNext = Date.now() + SAMPLE_INTERVAL_MS;
  intervalRef = setInterval(tick, SAMPLE_INTERVAL_MS);

  if ("PerformanceObserver" in window) {
    try {
      longTaskObserver = new PerformanceObserver((list) => {
        const now = Date.now();
        for (const entry of list.getEntries()) {
          if (entry.duration >= 50) longTaskEvents.push(now);
        }
        compactWindow(now);
      });
      longTaskObserver.observe({ entryTypes: ["longtask"] });
    } catch {
      longTaskObserver = null;
    }
  }
}

export function stopPerformanceWatchdog(): void {
  if (!started) return;
  started = false;
  if (intervalRef) clearInterval(intervalRef);
  intervalRef = null;
  if (longTaskObserver) longTaskObserver.disconnect();
  longTaskObserver = null;
}

export function subscribePerformanceWatchdog(listener: Listener): () => void {
  listeners.add(listener);
  listener(snapshot);
  return () => {
    listeners.delete(listener);
  };
}

export function getPerformanceWatchdogSnapshot(): WatchdogSnapshot {
  return snapshot;
}

