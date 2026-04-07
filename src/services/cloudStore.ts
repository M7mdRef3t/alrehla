import { getAuthToken } from "@/state/authState";
import { runtimeEnv } from "@/config/runtimeEnv";
import { getFromLocalStorage, setInLocalStorage } from "./browserStorage";
import { CircuitBreaker } from "../architecture/circuitBreaker";
import { fetchJsonWithResilience, sendJsonWithResilience } from "../architecture/resilientHttp";

const DEVICE_TOKEN_KEY = "dawayir-device-token";
const EXCLUDED_KEYS = new Set([
  "dawayir-admin-state",
  "dawayir-theme",
  "dawayir-tracking-mode",
  "dawayir-tracking-api-url",
  "dawayir-session-id"
]);

const API_BASE = runtimeEnv.adminApiBase;
const USER_STATE_ENDPOINT = `${API_BASE}/api/user/state`;

function isCrossOriginDevEndpoint(): boolean {
  if (typeof window === "undefined") return false;
  if (!runtimeEnv.isDev || !API_BASE) return false;
  try {
    const apiOrigin = new URL(API_BASE, window.location.origin).origin;
    return apiOrigin !== window.location.origin;
  } catch {
    return false;
  }
}

const REMOTE_SYNC_ENABLED = Boolean(API_BASE) && !isCrossOriginDevEndpoint();
const cloudStoreBreaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 20_000 });

let remoteCache: Record<string, string> | null = null;
let remoteLoaded = false;
let remoteLoading: Promise<void> | null = null;
let pendingUpdates: Record<string, string> = {};
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let lastIdentityKey: string | null = null;
let syncFailureCount = 0;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function shouldSyncKey(key: string): boolean {
  if (!key.startsWith("dawayir-")) return false;
  return !EXCLUDED_KEYS.has(key);
}

function getDeviceToken(): string | null {
  if (!isBrowser()) return null;
  const existing = getFromLocalStorage(DEVICE_TOKEN_KEY);
  if (existing) return existing;
  let token = "";
  if (window.crypto?.randomUUID) {
    token = `dev_${window.crypto.randomUUID()}`;
  } else if (window.crypto?.getRandomValues) {
    const arr = new Uint8Array(16);
    window.crypto.getRandomValues(arr);
    token = `dev_${Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("")}`;
  } else {
    token = `dev_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
  setInLocalStorage(DEVICE_TOKEN_KEY, token);
  return token;
}

function buildHeaders(): Record<string, string> {
  const token = getDeviceToken();
  const authToken = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers["x-device-token"] = token;
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const identityKey = `${token ?? ""}|${authToken ?? ""}`;
  if (lastIdentityKey && lastIdentityKey !== identityKey) {
    remoteLoaded = false;
    remoteCache = null;
  }
  lastIdentityKey = identityKey;
  return headers;
}

async function loadRemoteState(): Promise<void> {
  if (!isBrowser()) return;
  if (remoteLoaded) return;
  if (remoteLoading) {
    await remoteLoading;
    return;
  }
  remoteLoading = (async () => {
    const headers = buildHeaders();
    if (!headers["x-device-token"] && !headers.Authorization) {
      remoteLoaded = true;
      return;
    }
    try {
      const data = await fetchJsonWithResilience<{ data?: Record<string, string> }>(
        USER_STATE_ENDPOINT,
        { headers },
        { retries: 1, breaker: cloudStoreBreaker }
      );
      if (!data) {
        remoteLoaded = true;
        return;
      }
      remoteCache = typeof data?.data === "object" && data.data ? data.data : {};
      remoteLoaded = true;
    } catch {
      remoteLoaded = true;
    }
  })();
  await remoteLoading;
  remoteLoading = null;
}

export async function getRemoteValue(key: string): Promise<string | null> {
  if (!shouldSyncKey(key)) return null;
  if (!REMOTE_SYNC_ENABLED) return null;
  await loadRemoteState();
  return remoteCache && key in remoteCache ? remoteCache[key] : null;
}

export async function fetchRemoteState(): Promise<Record<string, string>> {
  if (!REMOTE_SYNC_ENABLED) return {};
  await loadRemoteState();
  return remoteCache ?? {};
}

function nextSyncDelayMs(): number {
  const base = 800;
  const cappedExp = Math.min(syncFailureCount, 6);
  const backoff = base * (2 ** cappedExp);
  const jitter = Math.floor(Math.random() * 250);
  return Math.min(30_000, backoff + jitter);
}

function scheduleSync(): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void flushUpdates();
  }, nextSyncDelayMs());
}

export function queueRemoteSet(key: string, value: string): void {
  if (!shouldSyncKey(key)) return;
  if (!REMOTE_SYNC_ENABLED) return;
  pendingUpdates[key] = value;
  remoteCache = { ...(remoteCache ?? {}), [key]: value };
  scheduleSync();
}

async function flushUpdates(): Promise<void> {
  if (!isBrowser()) return;
  if (!REMOTE_SYNC_ENABLED) return;
  const updates = pendingUpdates;
  pendingUpdates = {};
  if (Object.keys(updates).length === 0) return;
  const headers = buildHeaders();
  if (!headers["x-device-token"] && !headers.Authorization) return;
  try {
    const ok = await sendJsonWithResilience(
      USER_STATE_ENDPOINT,
      { data: updates },
      { headers },
      { retries: 1, breaker: cloudStoreBreaker }
    );
    if (!ok) {
      syncFailureCount += 1;
      pendingUpdates = { ...updates, ...pendingUpdates };
      scheduleSync();
      return;
    }
    syncFailureCount = 0;
  } catch {
    syncFailureCount += 1;
    pendingUpdates = { ...updates, ...pendingUpdates };
    scheduleSync();
  }
}

export async function pushRemoteState(data: Record<string, string>): Promise<boolean> {
  if (!REMOTE_SYNC_ENABLED) return false;
  const headers = buildHeaders();
  if (!headers["x-device-token"] && !headers.Authorization) return false;
  return sendJsonWithResilience(USER_STATE_ENDPOINT, { data }, { headers }, { retries: 1, breaker: cloudStoreBreaker });
}
