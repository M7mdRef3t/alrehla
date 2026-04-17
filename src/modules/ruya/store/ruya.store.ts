/**
 * رؤيا — Ruya Store
 *
 * Dream Journal & Night Reflections: capture dreams, tag moods,
 * track recurring themes, and reflect before sleep.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ═══════════════════════════════════════════ */
/*                 TYPES                      */
/* ═══════════════════════════════════════════ */

export type DreamMood = "peaceful" | "anxious" | "inspiring" | "confusing" | "joyful" | "dark" | "neutral";
export type DreamClarity = "vivid" | "moderate" | "foggy";
export type ReflectionType = "gratitude" | "lesson" | "worry" | "hope" | "dua";

export interface DreamEntry {
  id: string;
  content: string;
  mood: DreamMood;
  clarity: DreamClarity;
  tags: string[];
  isRecurring: boolean;
  isStarred: boolean;
  timestamp: number;
}

export interface NightReflection {
  id: string;
  date: string; // YYYY-MM-DD
  type: ReflectionType;
  content: string;
  timestamp: number;
}

export interface RuyaState {
  dreams: DreamEntry[];
  reflections: NightReflection[];

  // Actions
  addDream: (data: { content: string; mood: DreamMood; clarity: DreamClarity; tags?: string[]; isRecurring?: boolean }) => void;
  removeDream: (id: string) => void;
  toggleStarDream: (id: string) => void;
  addReflection: (data: { type: ReflectionType; content: string }) => void;
  removeReflection: (id: string) => void;

  // Getters
  getRecentDreams: (n: number) => DreamEntry[];
  getStarredDreams: () => DreamEntry[];
  getDreamsByMood: (mood: DreamMood) => DreamEntry[];
  getRecurringDreams: () => DreamEntry[];
  getTonightReflections: () => NightReflection[];
  getMoodBreakdown: () => { mood: DreamMood; count: number }[];
  getTopTags: () => { tag: string; count: number }[];
  getTotalDreams: () => number;
  getStreak: () => number;
}

/* ═══════════════════════════════════════════ */
/*              CONSTANTS                     */
/* ═══════════════════════════════════════════ */

export const DREAM_MOOD_META: Record<DreamMood, { label: string; emoji: string; color: string }> = {
  peaceful:  { label: "سلام",    emoji: "🌙", color: "#8b5cf6" },
  anxious:   { label: "قلق",     emoji: "😰", color: "#ef4444" },
  inspiring: { label: "إلهام",   emoji: "✨", color: "#f59e0b" },
  confusing: { label: "حيرة",    emoji: "🌀", color: "#6366f1" },
  joyful:    { label: "فرح",     emoji: "😊", color: "#10b981" },
  dark:      { label: "ظلام",    emoji: "🌑", color: "#475569" },
  neutral:   { label: "محايد",   emoji: "😶", color: "#94a3b8" },
};

export const DREAM_CLARITY_META: Record<DreamClarity, { label: string; emoji: string }> = {
  vivid:    { label: "واضح جداً", emoji: "🔮" },
  moderate: { label: "متوسط",     emoji: "🌤️" },
  foggy:    { label: "ضبابي",     emoji: "🌫️" },
};

export const REFLECTION_META: Record<ReflectionType, { label: string; emoji: string; color: string }> = {
  gratitude: { label: "امتنان",   emoji: "🤲", color: "#10b981" },
  lesson:    { label: "درس",      emoji: "📖", color: "#f59e0b" },
  worry:     { label: "قلق",      emoji: "💭", color: "#ef4444" },
  hope:      { label: "أمل",      emoji: "🌅", color: "#06b6d4" },
  dua:       { label: "دعاء",     emoji: "🕌", color: "#8b5cf6" },
};

/* ═══════════════════════════════════════════ */
/*               STORE                        */
/* ═══════════════════════════════════════════ */

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const todayKey = () => new Date().toISOString().slice(0, 10);

export const useRuyaState = create<RuyaState>()(
  persist(
    (set, get) => ({
      dreams: [],
      reflections: [],

      addDream: ({ content, mood, clarity, tags, isRecurring }) => {
        const entry: DreamEntry = {
          id: genId(),
          content,
          mood,
          clarity,
          tags: tags || [],
          isRecurring: isRecurring || false,
          isStarred: false,
          timestamp: Date.now(),
        };
        set((s) => ({ dreams: [entry, ...s.dreams].slice(0, 300) }));
      },

      removeDream: (id) => set((s) => ({ dreams: s.dreams.filter((d) => d.id !== id) })),

      toggleStarDream: (id) => set((s) => ({
        dreams: s.dreams.map((d) => d.id === id ? { ...d, isStarred: !d.isStarred } : d),
      })),

      addReflection: ({ type, content }) => {
        const entry: NightReflection = {
          id: genId(),
          date: todayKey(),
          type,
          content,
          timestamp: Date.now(),
        };
        set((s) => ({ reflections: [entry, ...s.reflections].slice(0, 300) }));
      },

      removeReflection: (id) => set((s) => ({ reflections: s.reflections.filter((r) => r.id !== id) })),

      getRecentDreams: (n) => get().dreams.slice(0, n),
      getStarredDreams: () => get().dreams.filter((d) => d.isStarred),
      getDreamsByMood: (mood) => get().dreams.filter((d) => d.mood === mood),
      getRecurringDreams: () => get().dreams.filter((d) => d.isRecurring),
      getTonightReflections: () => get().reflections.filter((r) => r.date === todayKey()),

      getMoodBreakdown: () => {
        const dreams = get().dreams;
        return (Object.keys(DREAM_MOOD_META) as DreamMood[])
          .map((mood) => ({ mood, count: dreams.filter((d) => d.mood === mood).length }))
          .filter((m) => m.count > 0)
          .sort((a, b) => b.count - a.count);
      },

      getTopTags: () => {
        const tagMap = new Map<string, number>();
        get().dreams.forEach((d) => d.tags.forEach((t) => tagMap.set(t, (tagMap.get(t) || 0) + 1)));
        return Array.from(tagMap.entries())
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
      },

      getTotalDreams: () => get().dreams.length,

      getStreak: () => {
        const dreams = get().dreams;
        if (dreams.length === 0) return 0;
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 90; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          if (dreams.some((dr) => new Date(dr.timestamp).toISOString().slice(0, 10) === key)) {
            streak++;
          } else break;
        }
        return streak;
      },
    }),
    { name: "alrehla-ruya" }
  )
);
