import { create } from "zustand";
import { getFromLocalStorage, setInLocalStorage } from "@/services/browserStorage";

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
    // Ensure we always have an array
    set({ entries: Array.isArray(entries) ? entries : [] });
  },

  saveAnswer: (questionId, questionText, answer) => {
    const today = getTodayDate();
    const existing = get().entries;
    // Ensure existing is an array
    const existingArray = Array.isArray(existing) ? existing : [];

    // لو أجاب على نفس السؤال النهارده، نحدّث الإجابة
    const alreadyIdx = existingArray.findIndex((e) => e.date === today);
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
        ...existingArray.slice(0, alreadyIdx),
        newEntry,
        ...existingArray.slice(alreadyIdx + 1),
      ];
    } else {
      updated = [newEntry, ...existingArray];
    }

    persistEntries(updated);
    set({ entries: updated });
  },

  hasAnsweredToday: () => {
    const today = getTodayDate();
    const entries = get().entries;
    // Safety check: ensure entries is an array
    if (!Array.isArray(entries)) return false;
    return entries.some((e) => e.date === today && e.answer.length > 0);
  },

  getEntryByDate: (date) => {
    const entries = get().entries;
    if (!Array.isArray(entries)) return undefined;
    return entries.find((e) => e.date === date);
  },

  getSortedEntries: () => {
    const entries = get().entries;
    if (!Array.isArray(entries)) return [];
    return [...entries].sort((a, b) => b.savedAt - a.savedAt);
  },

  totalAnswers: () => {
    const entries = get().entries;
    if (!Array.isArray(entries)) return 0;
    return entries.filter((e) => e.answer.length > 0).length;
  },
}));
