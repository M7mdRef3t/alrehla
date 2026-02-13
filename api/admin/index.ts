/**
 * مدخل واحد لجميع مسارات Admin (حد Vercel Hobby: 12 دالة).
 * الـ handlers في server/admin/ حتى لا يحسبهم Vercel كدوال منفصلة.
 */
import { overviewRouter } from "../../server/admin/overview";
import { handleConfig } from "../../server/admin/config";
import { handleUsers } from "../../server/admin/users";
import { handleContent } from "../../server/admin/content";
import { handleRoles } from "../../server/admin/roles";
import { handleMissions } from "../../server/admin/missions";
import { handleBroadcasts } from "../../server/admin/broadcasts";
import { handleAiLogs } from "../../server/admin/ai-logs";
import { handleJourneyMap } from "../../server/admin/journey-map";

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
