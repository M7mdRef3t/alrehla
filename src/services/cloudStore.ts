import { getAuthToken } from "../state/authState";

const DEVICE_TOKEN_KEY = "dawayir-device-token";
const EXCLUDED_KEYS = new Set([
  "dawayir-admin-state",
  "dawayir-theme",
  "dawayir-tracking-mode",
  "dawayir-tracking-api-url",
  "dawayir-session-id"
]);

const API_BASE = import.meta.env.VITE_ADMIN_API_BASE ?? "";
const USER_STATE_ENDPOINT = `${API_BASE}/api/user/state`;
const REMOTE_SYNC_ENABLED = Boolean(API_BASE);

let remoteCache: Record<string, string> | null = null;
let remoteLoaded = false;
let remoteLoading: Promise<void> | null = null;
let pendingUpdates: Record<string, string> = {};
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let lastIdentityKey: string | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function shouldSyncKey(key: string): boolean {
  if (!key.startsWith("dawayir-")) return false;
  return !EXCLUDED_KEYS.has(key);
}

function getDeviceToken(): string | null {
  if (!isBrowser()) return null;
  const existing = window.localStorage.getItem(DEVICE_TOKEN_KEY);
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
  window.localStorage.setItem(DEVICE_TOKEN_KEY, token);
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
      const res = await fetch(USER_STATE_ENDPOINT, {
        headers
      });
      if (!res.ok) {
        remoteLoaded = true;
        return;
      }
      const data = await res.json();
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

function scheduleSync(): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    void flushUpdates();
  }, 800);
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
    const res = await fetch(USER_STATE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers
      },
      body: JSON.stringify({ data: updates })
    });
    if (!res.ok) {
      pendingUpdates = { ...updates, ...pendingUpdates };
      scheduleSync();
    }
  } catch {
    pendingUpdates = { ...updates, ...pendingUpdates };
    scheduleSync();
  }
}

export async function pushRemoteState(data: Record<string, string>): Promise<boolean> {
  if (!REMOTE_SYNC_ENABLED) return false;
  const headers = buildHeaders();
  if (!headers["x-device-token"] && !headers.Authorization) return false;
  try {
    const res = await fetch(USER_STATE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers
      },
      body: JSON.stringify({ data })
    });
    return res.ok;
  } catch {
    return false;
  }
}
