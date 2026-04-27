/**
 * ورد — Wird Store
 *
 * Smart Dhikr & Tasbeeh: preset adhkar, custom counters,
 * daily tracking, and streak calculation.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandIdbStorage } from '@/utils/idbStorage';


/* ═══════════════════════════════════════════ */
/*                 TYPES                      */
/* ═══════════════════════════════════════════ */

export type DhikrCategory = "morning" | "evening" | "salah" | "general" | "custom";

export interface Dhikr {
  id: string;
  text: string;
  transliteration: string;
  target: number;
  category: DhikrCategory;
  reward: string;
  isCustom: boolean;
}

export interface DhikrProgress {
  dhikrId: string;
  count: number;
  date: string; // YYYY-MM-DD
  completedAt: number | null;
}

export interface Ritual {
  id: string;
  title: string;
  enabled: boolean;
  target: number;
  category: DhikrCategory;
}

export interface TodayCompletion {
  completedRituals: string[];
  totalCount: number;
}

export interface WirdState {
  adhkar: Dhikr[];
  progress: DhikrProgress[];
  activeCounterId: string | null;
  rituals: Ritual[];
  streak: number;

  addCustomDhikr: (data: { text: string; target: number }) => void;
  removeDhikr: (id: string) => void;
  incrementCount: (dhikrId: string) => void;
  resetCount: (dhikrId: string) => void;
  setActiveCounter: (id: string | null) => void;

  getTodayProgress: () => DhikrProgress[];
  getDhikrById: (id: string) => Dhikr | undefined;
  getTodayCount: (dhikrId: string) => number;
  getTotalCompleted: () => number;
  getStreak: () => number;
  getTodayCompletion: () => TodayCompletion;
  getDailyTotal: () => number;
  getCategoryAdhkar: (cat: DhikrCategory) => Dhikr[];
}

/* ═══════════════════════════════════════════ */
/*              CONSTANTS                     */
/* ═══════════════════════════════════════════ */

export const CATEGORY_META: Record<DhikrCategory, { label: string; emoji: string; color: string }> = {
  morning: { label: "أذكار الصباح", emoji: "🌅", color: "#f59e0b" },
  evening: { label: "أذكار المساء", emoji: "🌙", color: "#6366f1" },
  salah:   { label: "بعد الصلاة",   emoji: "🕌", color: "#8b5cf6" },
  general: { label: "عامة",         emoji: "📿", color: "#14b8a6" },
  custom:  { label: "مخصص",         emoji: "✨", color: "#ec4899" },
};

const DEFAULT_ADHKAR: Dhikr[] = [
  { id: "subhanallah", text: "سبحان الله", transliteration: "SubhanAllah", target: 33, category: "salah", reward: "تُغرس لك شجرة في الجنة", isCustom: false },
  { id: "alhamdulillah", text: "الحمد لله", transliteration: "Alhamdulillah", target: 33, category: "salah", reward: "تملأ الميزان", isCustom: false },
  { id: "allahuakbar", text: "الله أكبر", transliteration: "Allahu Akbar", target: 34, category: "salah", reward: "تملأ ما بين السماء والأرض", isCustom: false },
  { id: "lailahaillallah", text: "لا إله إلا الله وحده لا شريك له", transliteration: "La ilaha illallah", target: 10, category: "morning", reward: "كعدل عشر رقاب", isCustom: false },
  { id: "istighfar", text: "أستغفر الله", transliteration: "Astaghfirullah", target: 100, category: "general", reward: "يُفرّج الله همّك", isCustom: false },
  { id: "salawat", text: "اللهم صلّ وسلّم على نبينا محمد", transliteration: "Allahumma salli ala Muhammad", target: 10, category: "general", reward: "صلّى الله عليك عشرا", isCustom: false },
  { id: "hawqala", text: "لا حول ولا قوة إلا بالله", transliteration: "La hawla wa la quwwata illa billah", target: 10, category: "evening", reward: "كنز من كنوز الجنة", isCustom: false },
  { id: "subhanallah-wabihamdih", text: "سبحان الله وبحمده", transliteration: "SubhanAllahi wa bihamdihi", target: 100, category: "morning", reward: "حُطّت خطاياه وإن كانت مثل زبد البحر", isCustom: false },
];

/* ═══════════════════════════════════════════ */
/*               STORE                        */
/* ═══════════════════════════════════════════ */

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const todayKey = () => new Date().toISOString().slice(0, 10);

function buildRituals(adhkar: Dhikr[]): Ritual[] {
  return adhkar.map((dhikr) => ({
    id: dhikr.id,
    title: dhikr.text,
    enabled: true,
    target: dhikr.target,
    category: dhikr.category,
  }));
}

function calculateStreak(progress: DhikrProgress[], adhkar: Dhikr[]): number {
  if (progress.length === 0) return 0;
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayProgress = progress.filter((p) => p.date === key);
    const hasCompleted = dayProgress.some((p) => {
      const dhikr = adhkar.find((a) => a.id === p.dhikrId);
      return dhikr && p.count >= dhikr.target;
    });
    if (hasCompleted) streak++;
    else if (i > 0) break;
    else if (i === 0 && dayProgress.length === 0) break;
  }
  return streak;
}

function calculateTodayCompletion(progress: DhikrProgress[], adhkar: Dhikr[]): TodayCompletion {
  const today = todayKey();
  const todayProgress = progress.filter((p) => p.date === today);
  const completedRituals = todayProgress
    .filter((p) => {
      const dhikr = adhkar.find((item) => item.id === p.dhikrId);
      return dhikr && p.count >= dhikr.target;
    })
    .map((p) => p.dhikrId);

  return {
    completedRituals,
    totalCount: todayProgress.reduce((sum, item) => sum + item.count, 0),
  };
}

export const useWirdState = create<WirdState>()(
  persist(
    (set, get) => ({
      adhkar: DEFAULT_ADHKAR,
      progress: [],
      activeCounterId: null,
      rituals: buildRituals(DEFAULT_ADHKAR),
      streak: 0,

      addCustomDhikr: ({ text, target }) => {
        const dhikr: Dhikr = { id: genId(), text, transliteration: "", target: target || 33, category: "custom", reward: "", isCustom: true };
        set((s) => {
          const adhkar = [...s.adhkar, dhikr];
          return {
            adhkar,
            rituals: buildRituals(adhkar),
            streak: calculateStreak(s.progress, adhkar),
          };
        });
      },

      removeDhikr: (id) => set((s) => {
        const adhkar = s.adhkar.filter((d) => d.id !== id);
        const progress = s.progress.filter((p) => p.dhikrId !== id);
        return {
          adhkar,
          progress,
          rituals: buildRituals(adhkar),
          streak: calculateStreak(progress, adhkar),
        };
      }),

      incrementCount: (dhikrId) => {
        const today = todayKey();
        const dhikr = get().adhkar.find((d) => d.id === dhikrId);
        set((s) => {
          const existing = s.progress.find((p) => p.dhikrId === dhikrId && p.date === today);
          let progress: DhikrProgress[];
          let justCompleted = false;
          if (existing) {
            const newCount = existing.count + 1;
            const wasComplete = existing.completedAt !== null;
            const isNowComplete = newCount >= (dhikr?.target || 33);
            justCompleted = isNowComplete && !wasComplete;
            progress = s.progress.map((p) => p.dhikrId === dhikrId && p.date === today ? { ...p, count: newCount, completedAt: isNowComplete && !p.completedAt ? Date.now() : p.completedAt } : p);
          } else {
            progress = [...s.progress, { dhikrId, count: 1, date: today, completedAt: null }].slice(0, 2000);
          }

          // ◈ Wird → Hafiz Memory Bridge
          // When a dhikr is completed, record it as a spiritual memory
          if (justCompleted && dhikr) {
            try {
              const { useHafizState } = require('@/modules/hafiz/store/hafiz.store');
              const addMemory = useHafizState.getState().addMemory;
              if (addMemory) {
                addMemory({
                  text: `أتممت "${dhikr.text}" — ${dhikr.target} مرة`,
                  type: 'gratitude',
                  source: 'wird',
                });
              }
            } catch { /* hafiz unavailable */ }
          }

          return {
            progress,
            streak: calculateStreak(progress, s.adhkar),
          };
        });
      },

      resetCount: (dhikrId) => {
        const today = todayKey();
        set((s) => {
          const progress = s.progress.map((p) => p.dhikrId === dhikrId && p.date === today ? { ...p, count: 0, completedAt: null } : p);
          return {
            progress,
            streak: calculateStreak(progress, s.adhkar),
          };
        });
      },

      setActiveCounter: (id) => set({ activeCounterId: id }),

      getTodayProgress: () => get().progress.filter((p) => p.date === todayKey()),
      getDhikrById: (id) => get().adhkar.find((d) => d.id === id),
      getTodayCount: (dhikrId) => get().progress.find((p) => p.dhikrId === dhikrId && p.date === todayKey())?.count || 0,
      getTotalCompleted: () => get().progress.filter((p) => { const d = get().adhkar.find((a) => a.id === p.dhikrId); return d && p.count >= d.target; }).length,
      getStreak: () => calculateStreak(get().progress, get().adhkar),
      getTodayCompletion: () => calculateTodayCompletion(get().progress, get().adhkar),
      getDailyTotal: () => get().progress.filter((p) => p.date === todayKey()).reduce((sum, p) => sum + p.count, 0),
      getCategoryAdhkar: (cat) => get().adhkar.filter((d) => d.category === cat),
    }),
    { name: "alrehla-wird", storage: zustandIdbStorage }
  )
);
