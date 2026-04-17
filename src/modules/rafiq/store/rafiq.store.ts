/**
 * رفيق — Rafiq Store
 *
 * Smart Journey Companion: reads ecosystem state and generates
 * personalized tool suggestions, daily greetings, and nudges.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ═══════════════════════════════════════════ */
/*                 TYPES                      */
/* ═══════════════════════════════════════════ */

export type SuggestionPriority = "high" | "medium" | "low";
export type MoodTone = "warm" | "calm" | "energize" | "comfort" | "celebrate";

export interface Suggestion {
  id: string;
  toolId: string;
  toolName: string;
  emoji: string;
  reason: string;
  priority: SuggestionPriority;
  color: string;
  dismissed: boolean;
}

export interface DailyGreeting {
  date: string;
  message: string;
  tone: MoodTone;
  emoji: string;
}

export interface RafiqState {
  suggestions: Suggestion[];
  greeting: DailyGreeting | null;
  lastRefresh: number;
  dismissedIds: string[];

  // Actions
  setSuggestions: (suggestions: Suggestion[]) => void;
  setGreeting: (greeting: DailyGreeting) => void;
  dismissSuggestion: (id: string) => void;
  resetDismissals: () => void;

  // Getters
  getActiveSuggestions: () => Suggestion[];
  getTopSuggestion: () => Suggestion | null;
}

/* ═══════════════════════════════════════════ */
/*              CONSTANTS                     */
/* ═══════════════════════════════════════════ */

export const TOOL_REGISTRY: Record<string, { name: string; emoji: string; color: string; screen: string }> = {
  tazkiya:  { name: "تزكية",   emoji: "🕊️", color: "#a78bfa", screen: "tazkiya" },
  jisr:     { name: "جسر",     emoji: "🌉", color: "#10b981", screen: "jisr" },
  risala:   { name: "رسالة",   emoji: "💌", color: "#06b6d4", screen: "risala" },
  khalwa:   { name: "خلوة",    emoji: "🧘", color: "#8b5cf6", screen: "khalwa" },
  warsha:   { name: "ورشة",    emoji: "🏋️", color: "#f97316", screen: "warsha" },
  kanz:     { name: "كنز",     emoji: "💎", color: "#f59e0b", screen: "kanz" },
  bathra:   { name: "بذرة",    emoji: "🌱", color: "#10b981", screen: "bathra" },
  mithaq:   { name: "ميثاق",   emoji: "🤝", color: "#fbbf24", screen: "mithaq" },
  qalb:     { name: "قلب",     emoji: "❤️", color: "#ef4444", screen: "qalb" },
  athar:    { name: "أثر",     emoji: "📜", color: "#10b981", screen: "athar" },
  shahada:  { name: "شهادة",   emoji: "🏆", color: "#eab308", screen: "shahada" },
  wird:     { name: "وِرد",    emoji: "📿", color: "#6366f1", screen: "wird" },
};

export const GREETINGS: Record<MoodTone, string[]> = {
  warm: [
    "أهلاً يا مسافر ✨ رحلتك تستمر اليوم",
    "مرحباً بعودتك 🌅 كل يوم خطوة جديدة",
    "يومك الجديد فرصة — استثمرها 🌟",
  ],
  calm: [
    "خذ نفساً عميقاً 🌿 أنت في المكان الصحيح",
    "لا تستعجل — الرحلة تحتاج صبر 🕊️",
    "السكينة بداية كل وضوح 🧘",
  ],
  energize: [
    "جاهز لتحدي جديد؟ 🔥 يلا نبدأ!",
    "طاقتك عالية — استغلها! ⚡",
    "اليوم يوم إنجاز 🚀",
  ],
  comfort: [
    "مهما كان يومك — أنت تفعل ما بوسعك 💛",
    "لا بأس أن تبطئ أحياناً 🫂",
    "كل خطوة صغيرة تحسب 🌱",
  ],
  celebrate: [
    "أنت تتقدم حقاً 🎉 تستحق الاحتفال!",
    "مبروك على التقدم — استمر! 🏆",
    "رحلتك ملهمة — واصل ✨",
  ],
};

/* ═══════════════════════════════════════════ */
/*               STORE                        */
/* ═══════════════════════════════════════════ */

export const useRafiqState = create<RafiqState>()(
  persist(
    (set, get) => ({
      suggestions: [],
      greeting: null,
      lastRefresh: 0,
      dismissedIds: [],

      setSuggestions: (suggestions) => set({ suggestions, lastRefresh: Date.now() }),
      setGreeting: (greeting) => set({ greeting }),
      dismissSuggestion: (id) => set((s) => ({
        dismissedIds: [...s.dismissedIds, id],
      })),
      resetDismissals: () => set({ dismissedIds: [] }),

      getActiveSuggestions: () => {
        const { suggestions, dismissedIds } = get();
        return suggestions.filter((s) => !dismissedIds.includes(s.id));
      },
      getTopSuggestion: () => {
        const active = get().getActiveSuggestions();
        return active.length > 0 ? active[0] : null;
      },
    }),
    { name: "alrehla-rafiq" }
  )
);
