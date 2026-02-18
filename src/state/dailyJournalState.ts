import { create } from "zustand";
import { getFromLocalStorage, setInLocalStorage } from "../services/browserStorage";

const STORAGE_KEY = "dawayir-daily-journal";

export interface DailyJournalEntry {
  id: string;
  date: string;           // "YYYY-MM-DD"
  questionId: number;
  questionText: string;
  answer: string;
  savedAt: number;        // timestamp
}

interface DailyJournalState {
  entries: DailyJournalEntry[];
  /** حفظ إجابة جديدة */
  saveAnswer: (questionId: number, questionText: string, answer: string) => void;
  /** هل أجاب المستخدم على سؤال النهاردة؟ */
  hasAnsweredToday: () => boolean;
  /** رجوع إجابة يوم معين */
  getEntryByDate: (date: string) => DailyJournalEntry | undefined;
  /** كل الإجابات مرتبة من الأحدث للأقدم */
  getSortedEntries: () => DailyJournalEntry[];
  /** عدد الإجابات الكلي */
  totalAnswers: () => number;
  /** تحميل البيانات من localStorage */
  hydrate: () => void;
}

function getTodayDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function loadEntries(): DailyJournalEntry[] {
  try {
    const raw = getFromLocalStorage(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DailyJournalEntry[];
  } catch {
    return [];
  }
}

function persistEntries(entries: DailyJournalEntry[]) {
  try {
    setInLocalStorage(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

export const useDailyJournalState = create<DailyJournalState>((set, get) => ({
  entries: [],

  hydrate: () => {
    const entries = loadEntries();
    set({ entries });
  },

  saveAnswer: (questionId, questionText, answer) => {
    const today = getTodayDate();
    const existing = get().entries;

    // لو أجاب على نفس السؤال النهارده، نحدّث الإجابة
    const alreadyIdx = existing.findIndex((e) => e.date === today);
    let updated: DailyJournalEntry[];

    const newEntry: DailyJournalEntry = {
      id: `${today}-${questionId}`,
      date: today,
      questionId,
      questionText,
      answer: answer.trim(),
      savedAt: Date.now(),
    };

    if (alreadyIdx !== -1) {
      updated = [
        ...existing.slice(0, alreadyIdx),
        newEntry,
        ...existing.slice(alreadyIdx + 1),
      ];
    } else {
      updated = [newEntry, ...existing];
    }

    persistEntries(updated);
    set({ entries: updated });
  },

  hasAnsweredToday: () => {
    const today = getTodayDate();
    return get().entries.some((e) => e.date === today && e.answer.length > 0);
  },

  getEntryByDate: (date) => {
    return get().entries.find((e) => e.date === date);
  },

  getSortedEntries: () => {
    return [...get().entries].sort((a, b) => b.savedAt - a.savedAt);
  },

  totalAnswers: () => get().entries.filter((e) => e.answer.length > 0).length,
}));
