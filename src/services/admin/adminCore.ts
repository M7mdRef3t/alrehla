/**
 * adminCore.ts — Core HTTP infrastructure for the Admin API.
 * Contains callAdminApi, circuit breakers, path helpers, and security webhook.
 */

import { getAuthToken } from "@/domains/auth/store/auth.store";

import { runtimeEnv } from "@/config/runtimeEnv";
import { CircuitBreaker } from "../../architecture/circuitBreaker";
import { fetchJsonWithResilience, sendJsonWithResilience } from "../../architecture/resilientHttp";

// ─── Constants ──────────────────────────────────────────────────────
export const SETTINGS_TABLE = "system_settings";
export const ADMIN_API_BASE = runtimeEnv.adminApiBase;
export const ADMIN_API_PATH = `${ADMIN_API_BASE}/api/admin`;

// ─── Circuit Breakers ───────────────────────────────────────────────
// cooldownMs: 5 min — after a 401/403 auth failure, stop polling for 5 minutes.
export const adminApiBreaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 300_000 });
export const securityWebhookBreaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 60_000 });

// ─── Hobby Plan Path Remapping ──────────────────────────────────────
const HOBBY_REMAP_BASES = new Set([
  "daily-report",
  "weekly-report",
  "full-export",
  "user-state",
  "user-state-export",
  "user-state-import"
]);

function remapAdminPathForHobby(path: string): string {
  const [base, ...rest] = path.split("?");
  if (!HOBBY_REMAP_BASES.has(base)) return path;
  const query = rest.join("?");
  return `overview?kind=${encodeURIComponent(base)}${query ? `&${query}` : ""}`;
}

/** بناء مسار الاستعلام لدالة admin الموحدة (?path=...) */
function buildAdminQuery(path: string): string {
  const effectivePath = remapAdminPathForHobby(path);
  const [pathPart, ...queryParts] = effectivePath.split("?");
  const queryPart = queryParts.join("?");
  return `path=${encodeURIComponent(pathPart)}${queryPart ? `&${queryPart}` : ""}`;
}

function isCrossOriginDevAdminApi(): boolean {
  if (typeof window === "undefined") return false;
  if (!runtimeEnv.isDev || !ADMIN_API_BASE) return false;
  try {
    const apiOrigin = new URL(ADMIN_API_BASE, window.location.origin).origin;
    return apiOrigin !== window.location.origin;
  } catch {
    return false;
  }
}

// ─── Core API Caller ────────────────────────────────────────────────
export async function callAdminApi<T>(path: string, options?: RequestInit): Promise<T | null> {
  // In local dev, avoid calling a cross-origin admin API directly from browser
  // to prevent CORS console noise and fallback to local sources gracefully.
  if (isCrossOriginDevAdminApi()) return null;
  const bearer = getAuthToken();
  if (!bearer) return null;
  const query = buildAdminQuery(path);
  return fetchJsonWithResilience<T>(
    `${ADMIN_API_PATH}?${query}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${bearer}`,
        ...(options?.headers ?? {})
      }
    },
    { retries: 1, breaker: adminApiBreaker, timeoutMs: runtimeEnv.isDev ? 25000 : 8000 }
  );
}

// ─── Security Webhook ───────────────────────────────────────────────
export async function sendOwnerSecurityWebhook(payload: any): Promise<boolean> {
  const url = runtimeEnv.ownerSecurityWebhookUrl;
  if (!url) return false;
  return sendJsonWithResilience(url, { source: "dawayir-sentinel", ...payload }, {}, { retries: 1, breaker: securityWebhookBreaker });
}
