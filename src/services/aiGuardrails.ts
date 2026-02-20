import { getJSON, setJSON } from "./secureStore";

export type AIRequestKind = "generate" | "tool" | "stream" | "embed";
export type AIRejectionReason = "queue_overflow" | "rate_limited";
export type AIGuardStatus = "healthy" | "warning" | "critical";

interface PendingTask<T> {
  run: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

interface GuardrailTelemetry {
  updatedAt: number;
  status: AIGuardStatus;
  requests1m: number;
  failures1m: number;
  fallbacks1m: number;
  rateLimited1m: number;
  queueDropped1m: number;
  avgLatencyMs1m: number;
  p95LatencyMs1m: number;
  inFlight: number;
  queued: number;
  estimatedCostUsdToday: number;
  meteredCostUsdToday: number;
  totalCostUsdToday: number;
  meteredRequestsToday: number;
  estimatedRequestsToday: number;
  requestsToday: number;
}
export type AIGuardrailSnapshot = GuardrailTelemetry;

type EventType = "success" | "failure" | "fallback" | "rate_limited" | "queue_dropped";
interface GuardrailEvent {
  at: number;
  type: EventType;
  latencyMs?: number;
  estimatedCostUsd?: number;
}

const STORAGE_KEY = "dawayir-ai-guardrail-telemetry-v1";
const MAX_CONCURRENT = 2;
const MAX_QUEUE = 24;
const RATE_LIMIT_PER_MINUTE = 30;
const WARNING_COST_USD_PER_DAY = 2;
const CRITICAL_COST_USD_PER_DAY = 5;

const COST_PER_1K_INPUT = 0.0002;
const COST_PER_1K_OUTPUT = 0.0006;

let inFlight = 0;
const queue: PendingTask<unknown>[] = [];
const callTimestamps: number[] = [];
const events: GuardrailEvent[] = [];
const subscribers = new Set<(snap: GuardrailTelemetry) => void>();

let cachedCostDay = "";
let estimatedCostUsdToday = 0;
let meteredCostUsdToday = 0;
let meteredRequestsToday = 0;
let estimatedRequestsToday = 0;
let requestsToday = 0;

function getTodayKey(now = new Date()): string {
  return `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`;
}

function pruneOldData(now = Date.now()): void {
  const oneMinuteAgo = now - 60_000;
  while (callTimestamps.length > 0 && callTimestamps[0] < oneMinuteAgo) {
    callTimestamps.shift();
  }
  while (events.length > 0 && events[0].at < oneMinuteAgo) {
    events.shift();
  }
}

function estimateCostUsd(inputChars: number, outputChars: number): number {
  const inputTokens = inputChars / 4;
  const outputTokens = outputChars / 4;
  return (inputTokens / 1000) * COST_PER_1K_INPUT + (outputTokens / 1000) * COST_PER_1K_OUTPUT;
}

function estimateCostUsdByTokens(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1000) * COST_PER_1K_INPUT + (outputTokens / 1000) * COST_PER_1K_OUTPUT;
}

function getStatus(snapshot: Omit<GuardrailTelemetry, "status" | "updatedAt">): AIGuardStatus {
  const totalCost = snapshot.totalCostUsdToday;
  if (
    snapshot.queueDropped1m > 0 ||
    snapshot.rateLimited1m >= 3 ||
    totalCost >= CRITICAL_COST_USD_PER_DAY
  ) return "critical";
  if (
    snapshot.failures1m >= 3 ||
    snapshot.avgLatencyMs1m >= 2500 ||
    totalCost >= WARNING_COST_USD_PER_DAY
  ) return "warning";
  return "healthy";
}

function buildSnapshot(now = Date.now()): GuardrailTelemetry {
  pruneOldData(now);
  const latencyEvents = events.filter((e) => typeof e.latencyMs === "number") as Array<GuardrailEvent & { latencyMs: number }>;
  const latencies = latencyEvents.map((e) => e.latencyMs).sort((a, b) => a - b);
  const avgLatencyMs1m = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
  const p95LatencyMs1m = latencies.length > 0 ? latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))] : 0;

  const base = {
    requests1m: callTimestamps.length,
    failures1m: events.filter((e) => e.type === "failure").length,
    fallbacks1m: events.filter((e) => e.type === "fallback").length,
    rateLimited1m: events.filter((e) => e.type === "rate_limited").length,
    queueDropped1m: events.filter((e) => e.type === "queue_dropped").length,
    avgLatencyMs1m,
    p95LatencyMs1m,
    inFlight,
    queued: queue.length,
    estimatedCostUsdToday: Number(estimatedCostUsdToday.toFixed(4)),
    meteredCostUsdToday: Number(meteredCostUsdToday.toFixed(4)),
    totalCostUsdToday: Number((estimatedCostUsdToday + meteredCostUsdToday).toFixed(4)),
    meteredRequestsToday,
    estimatedRequestsToday,
    requestsToday
  };

  return {
    updatedAt: now,
    status: getStatus(base),
    ...base
  };
}

function persistSnapshot(): void {
  const snap = buildSnapshot();
  void setJSON(STORAGE_KEY, snap);
}

function emit(): void {
  const snap = buildSnapshot();
  subscribers.forEach((cb) => cb(snap));
  persistSnapshot();
}

function pushEvent(type: EventType, latencyMs?: number, estimatedCost?: number): void {
  const now = Date.now();
  events.push({ at: now, type, latencyMs, estimatedCostUsd: estimatedCost });
  emit();
}

function tryStartNext(): void {
  if (inFlight >= MAX_CONCURRENT) return;
  const next = queue.shift();
  if (!next) return;
  inFlight += 1;
  emit();
  void next.run()
    .then(next.resolve)
    .catch(next.reject)
    .finally(() => {
      inFlight = Math.max(0, inFlight - 1);
      emit();
      tryStartNext();
    });
}

export async function runWithAIGuardrails<T>(
  kind: AIRequestKind,
  task: (signal: AbortSignal) => Promise<T>,
  options?: {
    timeoutMs?: number;
    inputChars?: number;
    outputCharsEstimate?: number;
  }
): Promise<T> {
  const now = Date.now();
  pruneOldData(now);

  if (callTimestamps.length >= RATE_LIMIT_PER_MINUTE) {
    pushEvent("rate_limited");
    throw new Error("ai_guard_rate_limited");
  }

  if (queue.length >= MAX_QUEUE && inFlight >= MAX_CONCURRENT) {
    pushEvent("queue_dropped");
    throw new Error("ai_guard_queue_overflow");
  }

  callTimestamps.push(now);

  return new Promise<T>((resolve, reject) => {
    const pending: PendingTask<T> = {
      run: async () => {
        const startedAt = performance.now();
        const controller = new AbortController();
        const timeoutMs = Math.max(800, options?.timeoutMs ?? (kind === "stream" ? 20_000 : 12_000));
        const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
        try {
          const out = await task(controller.signal);
          const latency = Math.round(performance.now() - startedAt);
          const cost = estimateCostUsd(options?.inputChars ?? 0, options?.outputCharsEstimate ?? 0);

          const today = getTodayKey(new Date());
          if (cachedCostDay !== today) {
            cachedCostDay = today;
            estimatedCostUsdToday = 0;
            meteredCostUsdToday = 0;
            meteredRequestsToday = 0;
            estimatedRequestsToday = 0;
            requestsToday = 0;
          }
          if (cost > 0) {
            estimatedCostUsdToday += cost;
            estimatedRequestsToday += 1;
          }
          requestsToday += 1;
          pushEvent("success", latency, cost);
          return out;
        } catch (error) {
          if ((error as Error)?.name === "AbortError") {
            pushEvent("fallback");
          } else {
            pushEvent("failure");
          }
          throw error;
        } finally {
          window.clearTimeout(timeoutId);
        }
      },
      resolve,
      reject
    };

    if (inFlight < MAX_CONCURRENT) {
      inFlight += 1;
      emit();
      void pending.run()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          inFlight = Math.max(0, inFlight - 1);
          emit();
          tryStartNext();
        });
      return;
    }

    queue.push(pending as PendingTask<unknown>);
    emit();
  });
}

export function recordAIFallback(): void {
  pushEvent("fallback");
}

export function recordAICostFromUsage(inputTokens: number, outputTokens: number): void {
  const safeInput = Math.max(0, Number.isFinite(inputTokens) ? inputTokens : 0);
  const safeOutput = Math.max(0, Number.isFinite(outputTokens) ? outputTokens : 0);
  const cost = estimateCostUsdByTokens(safeInput, safeOutput);
  if (cost <= 0) return;
  const today = getTodayKey(new Date());
  if (cachedCostDay !== today) {
    cachedCostDay = today;
    estimatedCostUsdToday = 0;
    meteredCostUsdToday = 0;
    meteredRequestsToday = 0;
    estimatedRequestsToday = 0;
    requestsToday = 0;
  }
  meteredCostUsdToday += cost;
  meteredRequestsToday += 1;
  emit();
}

export function getAIGuardrailSnapshot(): AIGuardrailSnapshot {
  return buildSnapshot();
}

export function subscribeAIGuardrail(cb: (snap: AIGuardrailSnapshot) => void): () => void {
  subscribers.add(cb);
  cb(buildSnapshot());
  return () => subscribers.delete(cb);
}

export async function hydrateAIGuardrailSnapshot(): Promise<void> {
  const data = await getJSON<GuardrailTelemetry>(STORAGE_KEY);
  if (!data) return;
  const today = getTodayKey(new Date());
  cachedCostDay = today;
  estimatedCostUsdToday = data.estimatedCostUsdToday ?? 0;
  meteredCostUsdToday = data.meteredCostUsdToday ?? 0;
  meteredRequestsToday = data.meteredRequestsToday ?? 0;
  estimatedRequestsToday = data.estimatedRequestsToday ?? 0;
  requestsToday = data.requestsToday ?? 0;
  emit();
}
