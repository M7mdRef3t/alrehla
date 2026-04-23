/**
 * وصية — Wasiyya Store
 *
 * Sealed letters to your future self.
 * Write a letter → seal it with a date → it unlocks when the time comes.
 * Features: mood tag, growth area, seal animation, unsealed reading
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandIdbStorage } from '@/utils/idbStorage';


/* ═══════════════════════════════════════════ */
/*                 TYPES                      */
/* ═══════════════════════════════════════════ */

export type LetterMood = "hope" | "fear" | "gratitude" | "promise" | "reflection" | "challenge";

export interface Letter {
  id: string;
  /** The letter content — hidden until unsealed */
  content: string;
  /** Short title / subject */
  title: string;
  /** Mood tag */
  mood: LetterMood;
  /** Emoji chosen by user */
  emoji: string;
  /** When the letter was written */
  writtenAt: number;
  /** When the letter should unlock */
  unlockAt: number;
  /** When the letter was actually opened (null = still sealed) */
  openedAt?: number;
  /** Reflection written after reading */
  afterReflection?: string;
}

export interface WasiyyaState {
  letters: Letter[];

  // Actions
  writeLetter: (data: {
    title: string;
    content: string;
    mood: LetterMood;
    emoji: string;
    unlockAt: number;
  }) => void;
  unsealLetter: (id: string) => void;
  addReflection: (id: string, reflection: string) => void;
  deleteLetter: (id: string) => void;

  // Getters
  getSealedLetters: () => Letter[];
  getUnsealedLetters: () => Letter[];
  getReadyToOpen: () => Letter[];
  getStats: () => {
    total: number;
    sealed: number;
    unsealed: number;
    readyToOpen: number;
    nextUnlock: number | null;
  };
}

/* ═══════════════════════════════════════════ */
/*              CONSTANTS                     */
/* ═══════════════════════════════════════════ */

export const MOOD_META: Record<LetterMood, { label: string; emoji: string; color: string }> = {
  hope:       { label: "أمل",      emoji: "🌅", color: "#fbbf24" },
  fear:       { label: "خوف",      emoji: "🌊", color: "#64748b" },
  gratitude:  { label: "امتنان",   emoji: "🙏", color: "#10b981" },
  promise:    { label: "وعد",      emoji: "🤝", color: "#8b5cf6" },
  reflection: { label: "تأمل",     emoji: "🪷", color: "#a78bfa" },
  challenge:  { label: "تحدي",     emoji: "⚡", color: "#f59e0b" },
};

export const SEAL_DURATIONS = [
  { label: "أسبوع",    days: 7 },
  { label: "شهر",      days: 30 },
  { label: "3 أشهر",   days: 90 },
  { label: "6 أشهر",   days: 180 },
  { label: "سنة",      days: 365 },
];

/* ═══════════════════════════════════════════ */
/*               HELPERS                      */
/* ═══════════════════════════════════════════ */

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/* ═══════════════════════════════════════════ */
/*               STORE                        */
/* ═══════════════════════════════════════════ */

export const useWasiyyaState = create<WasiyyaState>()(
  persist(
    (set, get) => ({
      letters: [],

      writeLetter: ({ title, content, mood, emoji, unlockAt }) => {
        const letter: Letter = {
          id: genId(),
          title,
          content,
          mood,
          emoji,
          writtenAt: Date.now(),
          unlockAt,
        };
        set((s) => ({ letters: [...s.letters, letter] }));
      },

      unsealLetter: (id) => {
        set((s) => ({
          letters: s.letters.map((l) =>
            l.id === id && !l.openedAt ? { ...l, openedAt: Date.now() } : l
          ),
        }));
      },

      addReflection: (id, reflection) => {
        set((s) => ({
          letters: s.letters.map((l) =>
            l.id === id ? { ...l, afterReflection: reflection } : l
          ),
        }));
      },

      deleteLetter: (id) => {
        set((s) => ({ letters: s.letters.filter((l) => l.id !== id) }));
      },

      // Getters
      getSealedLetters: () => {
        const now = Date.now();
        return get().letters.filter((l) => !l.openedAt && l.unlockAt > now);
      },

      getUnsealedLetters: () => {
        return get().letters.filter((l) => !!l.openedAt);
      },

      getReadyToOpen: () => {
        const now = Date.now();
        return get().letters.filter((l) => !l.openedAt && l.unlockAt <= now);
      },

      getStats: () => {
        const letters = get().letters;
        const now = Date.now();
        const sealed = letters.filter((l) => !l.openedAt && l.unlockAt > now);
        const unsealed = letters.filter((l) => !!l.openedAt);
        const readyToOpen = letters.filter((l) => !l.openedAt && l.unlockAt <= now);

        const nextUnlock = sealed.length > 0
          ? Math.min(...sealed.map((l) => l.unlockAt))
          : null;

        return {
          total: letters.length,
          sealed: sealed.length,
          unsealed: unsealed.length,
          readyToOpen: readyToOpen.length,
          nextUnlock,
        };
      },
    }),
    { name: "alrehla-wasiyya", storage: zustandIdbStorage }
  )
);
