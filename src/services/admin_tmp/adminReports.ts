/**
 * adminReports.ts — Daily/Weekly/Cron reports + Ops/Executive/Security/Health reports.
 */

import { callAdminApi } from "./adminCore";
import type {
  DailyReport,
  WeeklyReport,
  CronReportResponse,
  OpsInsights,
  ExecutiveReport,
  SystemHealthReport,
  SecuritySignalsReport,
  OwnerOpsReport,
} from "./adminTypes";

export async function fetchDailyReport(date?: string): Promise<DailyReport | null> {
  const query = date ? `daily-report?date=${encodeURIComponent(date)}` : "daily-report";
  const apiData = await callAdminApi<DailyReport>(query);
  return apiData ?? null;
}

export async function fetchWeeklyReport(days: 7 | 14 | 30 = 7): Promise<WeeklyReport | null> {
  const apiData = await callAdminApi<WeeklyReport>(`weekly-report?days=${days}`);
  return apiData ?? null;
}

export async function runCronReport(period: "daily" | "weekly"): Promise<CronReportResponse | null> {
  const apiData = await callAdminApi<CronReportResponse>(`overview?kind=cron-report&type=${period}`, {
    method: "POST"
  });
  return apiData ?? null;
}

export async function exportFullData(limit = 2000): Promise<Record<string, unknown> | null> {
  const apiData = await callAdminApi<Record<string, unknown>>(`full-export?limit=${limit}`);
  return apiData ?? null;
}

// ─── Ops & Executive Reports ────────────────────────────────────────
export async function fetchOpsInsights(): Promise<OpsInsights | null> {
  const apiData = await callAdminApi<OpsInsights>("overview?kind=ops-insights");
  return apiData ?? null;
}

export async function fetchExecutiveReport(): Promise<ExecutiveReport | null> {
  const apiData = await callAdminApi<ExecutiveReport>("overview?kind=executive-report");
  return apiData ?? null;
}

export async function fetchSystemHealth(): Promise<SystemHealthReport | null> {
  const apiData = await callAdminApi<SystemHealthReport>("overview?kind=system-health");
  return apiData ?? null;
}

export async function fetchSecuritySignals(): Promise<SecuritySignalsReport | null> {
  const apiData = await callAdminApi<SecuritySignalsReport>("overview?kind=security-signals");
  return apiData ?? null;
}

export async function fetchOwnerOpsReport(): Promise<OwnerOpsReport | null> {
  const apiData = await callAdminApi<OwnerOpsReport>("overview?kind=owner-ops");
  return apiData ?? null;
}
