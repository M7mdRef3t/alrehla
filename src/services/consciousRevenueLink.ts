import type { WeeklyReport } from "./admin/adminTypes";

export interface ConsciousRevenueMetrics {
  averageConsciousnessLevel: number;
  revenueSignal: number;
  alignmentScore: number;
  status: "strong" | "watch" | "critical";
  note: string;
}

const clamp = (value: number, min = 0, max = 100): number =>
  Math.max(min, Math.min(max, Math.round(value)));

export function computeConsciousRevenueMetrics(report: WeeklyReport | null): ConsciousRevenueMetrics | null {
  if (!report) return null;

  const pathStarts = Number(report.typeCounts?.path_started ?? 0);
  const taskCompleted = Number(report.typeCounts?.task_completed ?? 0);
  const moodLogged = Number(report.typeCounts?.mood_logged ?? 0);
  const activeSessions = Math.max(1, Number(report.uniqueSessions ?? 0));

  const taskPerSession = taskCompleted / activeSessions;
  const moodPerSession = moodLogged / activeSessions;
  const completionVsStarts = pathStarts > 0 ? taskCompleted / pathStarts : 0;

  const gatePenalty = report.gate7?.status === "critical" ? 18 : 0;
  const averageConsciousnessLevel = clamp(
    taskPerSession * 32 + moodPerSession * 18 + completionVsStarts * 50 - gatePenalty
  );

  const ctr = Number(report.affiliate?.ctr ?? 0);
  const revenueSignal = clamp(ctr * 8 + (report.gate7?.status === "ok" ? 24 : 0));

  const alignmentScore = clamp(averageConsciousnessLevel * 0.7 + revenueSignal * 0.3);

  const status: ConsciousRevenueMetrics["status"] =
    alignmentScore >= 70 ? "strong" : alignmentScore >= 45 ? "watch" : "critical";

  const note =
    status === "strong"
      ? "الوعي يتحول تلقائيا إلى عائد. استمر على نفس مسار الرحلة."
      : status === "watch"
      ? "العائد موجود لكن وعي الرحلة متوسط. زد خطوات الإكمال قبل أي دفع إعلاني."
      : "العائد غير مستقر لأن وعي الرحلة منخفض. أوقف التوسع التسويقي واصلح مسار الرحلة أولا.";

  return {
    averageConsciousnessLevel,
    revenueSignal,
    alignmentScore,
    status,
    note,
  };
}
