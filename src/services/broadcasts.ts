import type { BroadcastAudience } from "../utils/broadcastAudience";
import { getBroadcastAudienceFromId } from "../utils/broadcastAudience";
import { getWindowOrNull } from "./clientRuntime";

export interface PublicBroadcast {
  id: string;
  title: string;
  body: string;
  audience: BroadcastAudience;
  createdAt: number;
}

export async function fetchPublicBroadcasts(): Promise<PublicBroadcast[] | null> {
  try {
    const res = await fetch("/api/user/broadcasts");
    if (!res.ok) return null;
    const json = (await res.json()) as { broadcasts?: Array<Record<string, unknown>> };
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
  } catch {
    return null;
  }
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

