/**
 * adminBroadcasts.ts — Broadcast CRUD + send operations.
 */

import { callAdminApi } from "./adminCore";
import type { AdminBroadcast } from "./adminTypes";

export async function fetchBroadcasts(): Promise<AdminBroadcast[] | null> {
  const apiData = await callAdminApi<{ broadcasts: AdminBroadcast[] }>("broadcasts");
  return apiData?.broadcasts ?? null;
}

export async function createBroadcast(broadcast: Partial<AdminBroadcast>): Promise<AdminBroadcast | null> {
  const apiData = await callAdminApi<{ broadcast: AdminBroadcast }>("broadcasts", {
    method: "POST",
    body: JSON.stringify(broadcast)
  });
  return apiData?.broadcast ?? null;
}

export async function saveBroadcast(broadcast: Partial<AdminBroadcast>): Promise<AdminBroadcast | null> {
  return createBroadcast(broadcast);
}

export async function updateBroadcast(id: string, broadcast: Partial<AdminBroadcast>): Promise<boolean> {
  const apiData = await callAdminApi<{ ok: boolean }>("broadcasts", {
    method: "PATCH",
    body: JSON.stringify({ id, ...broadcast })
  });
  return Boolean(apiData?.ok);
}

export async function sendBroadcast(id: string): Promise<boolean> {
  const apiData = await callAdminApi<{ ok: boolean }>("broadcasts", {
    method: "POST",
    body: JSON.stringify({ action: "send", id })
  });
  return Boolean(apiData?.ok);
}

export async function deleteBroadcast(id: string): Promise<boolean> {
  const apiData = await callAdminApi<{ ok: boolean }>("broadcasts", {
    method: "DELETE",
    body: JSON.stringify({ id })
  });
  return Boolean(apiData?.ok);
}
