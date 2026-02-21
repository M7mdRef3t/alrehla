import { useEffect, useReducer } from "react";
import { CircuitBreaker } from "./circuitBreaker";
import { appEventBus } from "./appEventBus";
import { runtimeEnv } from "../config/runtimeEnv";
import { designToggles } from "../config/designToggles";

export interface LiveMetrics {
  activeUnits30d: number;
  retentionRate30d: number;
  activity24h: number;
}

export interface TestimonialItem {
  quote: string;
  author: string;
}

export const NULL_METRICS: LiveMetrics = Object.freeze({
  activeUnits30d: 0,
  retentionRate30d: 0,
  activity24h: 0
});

export const NULL_TESTIMONIALS: TestimonialItem[] = [];

interface DataStrategy {
  shouldUseLive(): boolean;
}

class RuntimeDataStrategy implements DataStrategy {
  shouldUseLive(): boolean {
    return Boolean(designToggles.enableLiveLandingSections && (runtimeEnv.isProd || runtimeEnv.isDev));
  }
}

class LandingApiAdapter {
  static toMetrics(raw: unknown): LiveMetrics {
    const item = (raw ?? {}) as Partial<LiveMetrics>;
    return {
      activeUnits30d: Number(item.activeUnits30d ?? 0),
      retentionRate30d: Number(item.retentionRate30d ?? 0),
      activity24h: Number(item.activity24h ?? 0)
    };
  }

  static toTestimonials(raw: unknown): TestimonialItem[] {
    const input = raw as { testimonials?: Array<Partial<TestimonialItem>> } | null | undefined;
    if (!Array.isArray(input?.testimonials)) return [];
    return input.testimonials
      .map((item) => ({
        quote: String(item.quote ?? "").trim(),
        author: String(item.author ?? "").trim()
      }))
      .filter((item) => item.quote.length > 0 && item.author.length > 0);
  }
}

class LandingRepository {
  private readonly metricsBreaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 20_000 });
  private readonly testimonialsBreaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 20_000 });

  async fetchMetrics(): Promise<LiveMetrics | null> {
    if (designToggles.enableCircuitBreakerForLiveData && !this.metricsBreaker.canRequest()) return null;
    try {
      const res = await fetch("/api/user/live-metrics", { method: "GET", cache: "no-store" });
      if (!res.ok) throw new Error(`http_${res.status}`);
      const data = await res.json();
      if (designToggles.enableCircuitBreakerForLiveData) this.metricsBreaker.markSuccess();
      return LandingApiAdapter.toMetrics(data);
    } catch (error) {
      if (designToggles.enableCircuitBreakerForLiveData) this.metricsBreaker.markFailure();
      appEventBus.emit("live_data_fetch_failed", { key: "metrics", reason: String(error) });
      return null;
    }
  }

  async fetchTestimonials(): Promise<TestimonialItem[] | null> {
    if (designToggles.enableCircuitBreakerForLiveData && !this.testimonialsBreaker.canRequest()) return null;
    try {
      const res = await fetch("/api/user/testimonials", { method: "GET", cache: "no-store" });
      if (!res.ok) throw new Error(`http_${res.status}`);
      const data = await res.json();
      if (designToggles.enableCircuitBreakerForLiveData) this.testimonialsBreaker.markSuccess();
      return LandingApiAdapter.toTestimonials(data);
    } catch (error) {
      if (designToggles.enableCircuitBreakerForLiveData) this.testimonialsBreaker.markFailure();
      appEventBus.emit("live_data_fetch_failed", { key: "testimonials", reason: String(error) });
      return null;
    }
  }
}

type ResourceKey = "metrics" | "testimonials";
type LoadingState<T> = { data: T; isLoading: boolean; lastUpdatedAt: number | null; mode: "live" | "fallback" };

interface FacadeState {
  metrics: LoadingState<LiveMetrics>;
  testimonials: LoadingState<TestimonialItem[]>;
}

type FacadeAction =
  | { type: "loading"; key: ResourceKey }
  | { type: "metrics_loaded"; data: LiveMetrics; mode: "live" | "fallback" }
  | { type: "metrics_fallback_keep_current" }
  | { type: "testimonials_loaded"; data: TestimonialItem[]; mode: "live" | "fallback" };

const initialState: FacadeState = {
  metrics: { data: NULL_METRICS, isLoading: true, lastUpdatedAt: null, mode: "fallback" },
  testimonials: { data: NULL_TESTIMONIALS, isLoading: true, lastUpdatedAt: null, mode: "fallback" }
};

function reducer(state: FacadeState, action: FacadeAction): FacadeState {
  if (action.type === "loading") {
    return {
      ...state,
      [action.key]: { ...state[action.key], isLoading: true }
    };
  }
  if (action.type === "metrics_loaded") {
    return {
      ...state,
      metrics: {
        data: action.data,
        isLoading: false,
        lastUpdatedAt: Date.now(),
        mode: action.mode
      }
    };
  }
  if (action.type === "metrics_fallback_keep_current") {
    return {
      ...state,
      metrics: {
        ...state.metrics,
        isLoading: false,
        mode: "fallback"
      }
    };
  }
  return {
    ...state,
    testimonials: {
      data: action.data,
      isLoading: false,
      lastUpdatedAt: Date.now(),
      mode: action.mode
    }
  };
}

function emitEvent(
  key: "live_data_fetch_started",
  payload: { key: "metrics" | "testimonials" }
): void;
function emitEvent(
  key: "live_data_fetch_succeeded",
  payload: { key: "metrics" | "testimonials"; source: "live" | "fallback" }
): void;
function emitEvent(
  key: "live_data_fetch_failed",
  payload: { key: "metrics" | "testimonials"; reason: string }
): void;
function emitEvent(
  key: "live_data_fetch_started" | "live_data_fetch_succeeded" | "live_data_fetch_failed",
  payload:
    | { key: "metrics" | "testimonials" }
    | { key: "metrics" | "testimonials"; source: "live" | "fallback" }
    | { key: "metrics" | "testimonials"; reason: string }
): void {
  if (!designToggles.enableAppEventBus) return;
  if (key === "live_data_fetch_started") {
    appEventBus.emit(key, payload as { key: "metrics" | "testimonials" });
    return;
  }
  if (key === "live_data_fetch_succeeded") {
    appEventBus.emit(key, payload as { key: "metrics" | "testimonials"; source: "live" | "fallback" });
    return;
  }
  appEventBus.emit(key, payload as { key: "metrics" | "testimonials"; reason: string });
}

export function useLandingLiveData(fallbackTestimonials: TestimonialItem[]) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    testimonials: { ...initialState.testimonials, data: fallbackTestimonials }
  });

  useEffect(() => {
    const strategy = new RuntimeDataStrategy();
    const repository = new LandingRepository();
    let mounted = true;
    let metricsTimer: ReturnType<typeof setInterval> | null = null;
    let testimonialsTimer: ReturnType<typeof setInterval> | null = null;

    const loadMetrics = async (silent = false) => {
      if (!silent) dispatch({ type: "loading", key: "metrics" });
      emitEvent("live_data_fetch_started", { key: "metrics" });
      if (!strategy.shouldUseLive()) {
        dispatch({ type: "metrics_loaded", data: NULL_METRICS, mode: "fallback" });
        emitEvent("live_data_fetch_succeeded", { key: "metrics", source: "fallback" });
        return;
      }
      const data = await repository.fetchMetrics();
      if (!mounted) return;
      if (!data) {
        dispatch({ type: "metrics_fallback_keep_current" });
        return;
      }
      dispatch({ type: "metrics_loaded", data, mode: "live" });
      emitEvent("live_data_fetch_succeeded", { key: "metrics", source: "live" });
    };

    const loadTestimonials = async (silent = false) => {
      if (!silent) dispatch({ type: "loading", key: "testimonials" });
      emitEvent("live_data_fetch_started", { key: "testimonials" });
      if (!strategy.shouldUseLive()) {
        dispatch({ type: "testimonials_loaded", data: fallbackTestimonials, mode: "fallback" });
        emitEvent("live_data_fetch_succeeded", { key: "testimonials", source: "fallback" });
        return;
      }
      const data = await repository.fetchTestimonials();
      if (!mounted) return;
      if (!data || data.length === 0) {
        dispatch({ type: "testimonials_loaded", data: fallbackTestimonials, mode: "fallback" });
        return;
      }
      dispatch({ type: "testimonials_loaded", data, mode: "live" });
      emitEvent("live_data_fetch_succeeded", { key: "testimonials", source: "live" });
    };

    void loadMetrics();
    void loadTestimonials();
    metricsTimer = setInterval(() => void loadMetrics(true), 45_000);
    testimonialsTimer = setInterval(() => void loadTestimonials(true), 60_000);

    return () => {
      mounted = false;
      if (metricsTimer) clearInterval(metricsTimer);
      if (testimonialsTimer) clearInterval(testimonialsTimer);
    };
  }, [fallbackTestimonials]);

  return state;
}
