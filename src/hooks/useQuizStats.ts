/**
 * useQuizStats — streak, weekly count, all-time stats from quiz history
 * Reads from localStorage (alrehla_quiz_history) — privacy-first, no backend.
 */

import { useMemo } from "react";
import { useQuizHistory } from "./useQuizHistory";

export interface QuizWeekDay {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface QuizStats {
  streak: number;           // consecutive days with at least one quiz
  weeklyCount: number;      // quizzes completed in past 7 days
  weeklyDays: QuizWeekDay[]; // per-day counts for last 7 days (for spark bar)
  allTimeCount: number;     // total unique quizzes completed
  pendingCount: number;     // # of quizzes not yet done
  topBandTitle: string | null; // most frequent result band title
}

const ALL_QUIZ_COUNT = 7; // total quizzes in the hub

function toDateStr(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export function useQuizStats(): QuizStats {
  const { history, totalCompleted } = useQuizHistory();

  return useMemo(() => {
    // Build a map of date -> count
    const dateMap: Record<string, number> = {};
    for (const entry of history) {
      const d = toDateStr(entry.timestamp);
      dateMap[d] = (dateMap[d] ?? 0) + 1;
    }

    // Streak: count consecutive days with quizzes from today backwards
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      if (dateMap[key] && dateMap[key] > 0) {
        streak++;
      } else if (i > 0) {
        // Only break on gaps after day 0 (today might not have a quiz yet)
        break;
      }
    }

    // Weekly: last 7 days
    const weeklyDays: QuizWeekDay[] = [];
    let weeklyCount = 0;
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const count = dateMap[key] ?? 0;
      weeklyDays.push({ date: key, count });
      weeklyCount += count;
    }

    // Top band title (most frequent)
    const bandCount: Record<string, number> = {};
    for (const e of history) {
      bandCount[e.bandTitle] = (bandCount[e.bandTitle] ?? 0) + 1;
    }
    const topBandTitle =
      Object.keys(bandCount).length > 0
        ? Object.entries(bandCount).sort((a, b) => b[1] - a[1])[0][0]
        : null;

    const pendingCount = Math.max(0, ALL_QUIZ_COUNT - totalCompleted);

    return {
      streak,
      weeklyCount,
      weeklyDays,
      allTimeCount: totalCompleted,
      pendingCount,
      topBandTitle,
    };
  }, [history, totalCompleted]);
}
