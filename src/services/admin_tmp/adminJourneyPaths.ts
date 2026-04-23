/**
 * adminJourneyPaths.ts — Journey path generation, simulation, and auditing.
 */

import { callAdminApi } from "./adminCore";
import type { JourneyPath, JourneyPathStep, CognitiveSimulationResult } from "./adminTypes";

export async function generateJourneyPath(intention: string): Promise<JourneyPathStep[] | null> {
  const apiData = await callAdminApi<{ ok: boolean; steps: JourneyPathStep[] }>("paths/generate", {
    method: "POST",
    body: JSON.stringify({ intention })
  });
  if (apiData?.ok && apiData.steps) {
    return apiData.steps;
  }
  return null;
}

export async function simulateJourneyPath(pathSteps: JourneyPathStep[]): Promise<CognitiveSimulationResult[] | null> {
  const apiData = await callAdminApi<{ ok: boolean; simulation: CognitiveSimulationResult[] }>("paths/simulate", {
    method: "POST",
    body: JSON.stringify({ pathSteps })
  });
  if (apiData?.ok && apiData.simulation) {
    return apiData.simulation;
  }
  return null;
}

export async function auditJourneyPath(path: JourneyPath): Promise<any | null> {
  const apiData = await callAdminApi<{ ok: boolean; audit: any }>("paths/audit", {
    method: "POST",
    body: JSON.stringify({ path })
  });
  if (apiData?.ok && apiData.audit) {
    return apiData.audit;
  }
  return null;
}
