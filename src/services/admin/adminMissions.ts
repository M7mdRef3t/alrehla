/**
 * adminMissions.ts — Mission CRUD operations.
 */

import { callAdminApi } from "./adminCore";
import type { AdminMission } from "./adminTypes";

export async function fetchMissions(): Promise<AdminMission[] | null> {
  const apiData = await callAdminApi<{ missions: AdminMission[] }>("missions");
  return apiData?.missions ?? null;
}

export async function createMission(mission: Partial<AdminMission>): Promise<AdminMission | null> {
  const apiData = await callAdminApi<{ mission: AdminMission }>("missions", {
    method: "POST",
    body: JSON.stringify(mission)
  });
  return apiData?.mission ?? null;
}

export async function saveMission(mission: Partial<AdminMission>): Promise<AdminMission | null> {
  return createMission(mission);
}

export async function updateMission(id: string, mission: Partial<AdminMission>): Promise<boolean> {
  const apiData = await callAdminApi<{ ok: boolean }>("missions", {
    method: "PATCH",
    body: JSON.stringify({ id, ...mission })
  });
  return Boolean(apiData?.ok);
}

export async function deleteMission(id: string): Promise<boolean> {
  const apiData = await callAdminApi<{ ok: boolean }>("missions", {
    method: "DELETE",
    body: JSON.stringify({ id })
  });
  return Boolean(apiData?.ok);
}
