import type { BroadcastAudience } from "@/utils/broadcastAudience";
import { getBroadcastAudienceFromId } from "@/utils/broadcastAudience";
import { getWindowOrNull } from "./clientRuntime";
import { CircuitBreaker } from "../architecture/circuitBreaker";
import { fetchJsonWithResilience } from "../architecture/resilientHttp";

export interface PublicBroadcast {
  id: string;
  title: string;
  body: string;
  audience: BroadcastAudience;
  createdAt: number;
}

const broadcastsBreaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 20_000 });

export async function fetchPublicBroadcasts(): Promise<PublicBroadcast[] | null> {
  const json = await fetchJsonWithResilience<{ broadcasts?: Array<Record<string, unknown>> }>(
    "/api/user/broadcasts",
    { method: "GET" },
    { retries: 1, breaker: broadcastsBreaker }
  );
  if (!json) {
    return null;
  }
  const rows = json.broadcasts ?? [];
  return rows.map((row) => {
    const id = String(row.id ?? "");
    return {
      id,
      title: String(row.title ?? ""),
      body: String(row.body ?? ""),
      audience: getBroadcastAudienceFromId(id),
      createdAt: new Date(String(row.created_at ?? Date.now())).getTime()
    };
  });
}

export function doesBroadcastMatchAudience(
  audience: BroadcastAudience,
  context: { isLoggedIn: boolean; isInstalled: boolean }
): boolean {
  if (audience === "all") return true;
  if (audience === "users") return context.isLoggedIn;
  if (audience === "visitors") return !context.isLoggedIn;
  if (audience === "installed") return context.isInstalled;
  return false;
}

export function isAppInstalledMode(): boolean {
  const windowRef = getWindowOrNull();
  if (!windowRef) return false;
  const standaloneMatch = windowRef.matchMedia?.("(display-mode: standalone)")?.matches ?? false;
  const iosStandalone = Boolean((windowRef.navigator as Navigator & { standalone?: boolean }).standalone);
  return standaloneMatch || iosStandalone;
}
