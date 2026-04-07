import type { PulseEntry, WeekdayLabels } from "@/state/pulseState";

export const PULSE_DAY_NAMES = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const DAY_NAMES = PULSE_DAY_NAMES;

export function getWeeklyPulseInsight(
  logs: PulseEntry[],
  weekdayLabels?: WeekdayLabels | null
): { title: string; body: string } | null {
  if (!logs || logs.length < 5) return null;
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recent = logs.filter((entry) => entry.timestamp >= sevenDaysAgo);
  if (recent.length < 5) return null;

  const dayBuckets = new Map<number, { total: number; count: number }>();
  for (const entry of recent) {
    const day = new Date(entry.timestamp).getDay();
    const current = dayBuckets.get(day) ?? { total: 0, count: 0 };
    current.total += entry.energy;
    current.count += 1;
    dayBuckets.set(day, current);
  }

  if (dayBuckets.size < 3) return null;

  let lowestDay = -1;
  let lowestAvg = Infinity;
  dayBuckets.forEach((value, day) => {
    const avg = value.total / value.count;
    if (avg < lowestAvg) {
      lowestAvg = avg;
      lowestDay = day;
    }
  });

  if (lowestDay === -1) return null;

  const dayName = DAY_NAMES[lowestDay] ?? "اليوم";
  const rounded = Math.round(lowestAvg * 10) / 10;
  const labelForDay = weekdayLabels?.[lowestDay]?.trim();

  const baseBody = `لاحظنا إن طاقتك بتقل غالبًا يوم ${dayName}. متوسط طاقتك فيه حوالي ${rounded}/10.`;
  const body = labelForDay
    ? `${baseBody} ده اليوم اللي عندك فيه ${labelForDay}.. تعال نجهز له بشكل مختلف.`
    : `${baseBody} لو ده يوم ضغط متكرر، خلّي فيه خطوة خفيفة بدل مواجهة.`;

  return {
    title: "تقرير النبض الأسبوعي",
    body
  };
}
