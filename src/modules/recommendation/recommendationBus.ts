import type { DawayirSignalEventV1 } from "./types";
import { getFromLocalStorage, setInLocalStorage } from "@/services/browserStorage";

const SIGNAL_STORAGE_KEY = "dawayir-recommendation-signals-v1";
const MAX_SIGNALS = 2000;

type SignalListener = (event: DawayirSignalEventV1) => void;

const listeners = new Set<SignalListener>();

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function loadSignals(): DawayirSignalEventV1[] {
  if (!isBrowser()) return [];
  try {
    const raw = getFromLocalStorage(SIGNAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DawayirSignalEventV1[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveSignals(events: DawayirSignalEventV1[]): void {
  if (!isBrowser()) return;
  const trimmed = events.slice(-MAX_SIGNALS);
  try {
    setInLocalStorage(SIGNAL_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore localStorage quota errors.
  }
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function emitDawayirSignal(
  event: Omit<DawayirSignalEventV1, "id" | "timestamp"> & Partial<Pick<DawayirSignalEventV1, "id" | "timestamp">>
): DawayirSignalEventV1 {
  const normalized: DawayirSignalEventV1 = {
    ...event,
    id: event.id ?? newId("signal"),
    timestamp: event.timestamp ?? Date.now()
  };
  const current = loadSignals();
  current.push(normalized);
  saveSignals(current);
  listeners.forEach((listener) => listener(normalized));
  return normalized;
}

export function subscribeToDawayirSignals(listener: SignalListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDawayirSignalHistory(windowMs?: number): DawayirSignalEventV1[] {
  const all = loadSignals();
  if (windowMs == null || windowMs <= 0) return all;
  const now = Date.now();
  return all.filter((event) => now - event.timestamp <= windowMs);
}

export function clearDawayirSignalHistory(): void {
  if (!isBrowser()) return;
  setInLocalStorage(SIGNAL_STORAGE_KEY, "[]");
}
