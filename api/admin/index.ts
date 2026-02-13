/**
 * مدخل واحد لجميع مسارات Admin (حد Vercel Hobby: 12 دالة).
 * الفرونت يطلب: /api/admin?path=config أو /api/admin?path=overview&kind=...
 */
import { overviewRouter } from "./overview";
import { handleConfig } from "./config";
import { handleUsers } from "./users";
import { handleContent } from "./content";
import { handleRoles } from "./roles";
import { handleMissions } from "./missions";
import { handleBroadcasts } from "./broadcasts";
import { handleAiLogs } from "./ai-logs";
import { handleJourneyMap } from "./journey-map";

const ROUTES: Record<string, (req: any, res: any) => Promise<void>> = {
  overview: overviewRouter,
  config: handleConfig,
  users: handleUsers,
  content: handleContent,
  roles: handleRoles,
  missions: handleMissions,
  broadcasts: handleBroadcasts,
  "ai-logs": handleAiLogs,
  "journey-map": handleJourneyMap
};

function getPathFromUrl(req: any): string {
  const pathParam = req.query?.path;
  if (typeof pathParam === "string" && pathParam.trim()) return pathParam.trim().toLowerCase();
  const url = req.url ?? "";
  const pathname = url.split("?")[0] ?? "";
  const segments = pathname.replace(/^\/+/, "").split("/");
  const adminIndex = segments.indexOf("admin");
  const next = segments[adminIndex + 1];
  return typeof next === "string" ? next : "overview";
}

export default async function handler(req: any, res: any) {
  const path = getPathFromUrl(req);
  const route = ROUTES[path] ?? overviewRouter;
  return route(req, res);
}
