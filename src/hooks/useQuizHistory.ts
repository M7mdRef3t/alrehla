/**
 * useQuizHistory — تخزين واسترجاع نتائج الاختبارات من localStorage
 * V2: يحتفظ بـ 5 محاولات لكل اختبار لعرض التطور عبر الزمن
 */
import { useState, useCallback } from "react";

export interface QuizHistoryEntry {
  quizId: string;
  quizTitle: string;
  score: number;
  maxScore: number;
  bandTitle: string;
  bandColor: string;
  timestamp: number;
}

const STORAGE_KEY = "alrehla_quiz_history";

function loadHistory(): QuizHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QuizHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: QuizHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 50)));
  } catch { /* ignore */ }
}

export function useQuizHistory() {
  const [history, setHistory] = useState<QuizHistoryEntry[]>(() => loadHistory());

  const addResult = useCallback((entry: QuizHistoryEntry) => {
    setHistory((prev) => {
      // Keep ALL attempts (up to 5 per quiz), newest first
      const next = [entry, ...prev].slice(0, 50);
      saveHistory(next);
      return next;
    });
  }, []);

  /** Latest result for a given quiz */
  const getLatest = useCallback((quizId: string): QuizHistoryEntry | undefined => {
    return history.find((e) => e.quizId === quizId);
  }, [history]);

  /** All attempts for a given quiz, newest first */
  const getAttempts = useCallback((quizId: string): QuizHistoryEntry[] => {
    return history.filter((e) => e.quizId === quizId).slice(0, 5);
  }, [history]);

  /** IDs of quizzes that have at least one result */
  const completedQuizIds = useCallback((): Set<string> => {
    return new Set(history.map((e) => e.quizId));
  }, [history]);

  /** Total unique quizzes completed */
  const totalCompleted = new Set(history.map((e) => e.quizId)).size;

  const clearHistory = useCallback(() => {
    saveHistory([]);
    setHistory([]);
  }, []);

  return { history, addResult, getLatest, getAttempts, completedQuizIds, totalCompleted, clearHistory };
}
