import { useEffect } from "react";
import { getQuestionOfDay, type DailyQuestion } from "@/data/dailyQuestions";
import { useDailyJournalState } from "@/state/dailyJournalState";

export interface UseDailyQuestionReturn {
  question: DailyQuestion;
  hasAnsweredToday: boolean;
  answer: string;
  saveAnswer: (text: string) => void;
  totalAnswers: number;
}

export function useDailyQuestion(): UseDailyQuestionReturn {
  const question = getQuestionOfDay();
  const hydrate = useDailyJournalState((s) => s.hydrate);
  const saveAnswerFn = useDailyJournalState((s) => s.saveAnswer);
  const hasAnsweredToday = useDailyJournalState((s) => s.hasAnsweredToday());
  const totalAnswers = useDailyJournalState((s) => s.totalAnswers());
  const getTodayEntry = useDailyJournalState((s) => s.getEntryByDate);

  // تحميل البيانات عند أول render
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const todayEntry = getTodayEntry(todayStr);

  const saveAnswer = (text: string) => {
    if (!text.trim()) return;
    saveAnswerFn(question.id, question.text, text);
  };

  return {
    question,
    hasAnsweredToday,
    answer: todayEntry?.answer ?? "",
    saveAnswer,
    totalAnswers,
  };
}
