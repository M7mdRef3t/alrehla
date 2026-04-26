/**
 * شهادة — Shahada Store
 *
 * Achievement Certificates: earn visual badges for journey milestones,
 * track unlock progress, and showcase accomplishments.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandIdbStorage } from '@/utils/idbStorage';


/* ═══════════════════════════════════════════ */
/*                 TYPES                      */
/* ═══════════════════════════════════════════ */

export type CertTier = "bronze" | "silver" | "gold" | "legendary";
export type CertCategory = "consistency" | "depth" | "courage" | "connection" | "mastery";

export interface Certificate {
  id: string;
  title: string;
  description: string;
  emoji: string;
  tier: CertTier;
  category: CertCategory;
  requirement: string;
  unlocked: boolean;
  unlockedAt: number | null;
  progress: number;  // 0-100
  maxProgress: number;
}

export interface ShahadaState {
  certificates: Certificate[];

  // Actions
  unlockCertificate: (id: string) => void;
  updateProgress: (id: string, value: number) => void;
  resetAll: () => void;

  // Getters
  getUnlocked: () => Certificate[];
  getLocked: () => Certificate[];
  getByCategory: (cat: CertCategory) => Certificate[];
  getByTier: (tier: CertTier) => Certificate[];
  getTotalUnlocked: () => number;
  getCompletionPct: () => number;
}

/* ═══════════════════════════════════════════ */
/*              CONSTANTS                     */
/* ═══════════════════════════════════════════ */

export const TIER_META: Record<CertTier, { label: string; color: string; glow: string }> = {
  bronze:    { label: "برونزي",  color: "#cd7f32", glow: "rgba(205,127,50,0.15)" },
  silver:    { label: "فضي",     color: "#c0c0c0", glow: "rgba(192,192,192,0.15)" },
  gold:      { label: "ذهبي",    color: "#ffd700", glow: "rgba(255,215,0,0.2)" },
  legendary: { label: "أسطوري", color: "#e040fb", glow: "rgba(224,64,251,0.2)" },
};

export const CATEGORY_META: Record<CertCategory, { label: string; emoji: string; color: string }> = {
  consistency: { label: "الاستمرارية", emoji: "🔥", color: "#f59e0b" },
  depth:       { label: "العمق",       emoji: "🌊", color: "#6366f1" },
  courage:     { label: "الشجاعة",     emoji: "⚔️", color: "#ef4444" },
  connection:  { label: "التواصل",     emoji: "🤝", color: "#14b8a6" },
  mastery:     { label: "الإتقان",     emoji: "👑", color: "#8b5cf6" },
};

const DEFAULT_CERTIFICATES: Certificate[] = [
  // Consistency
  { id: "first-step", title: "الخطوة الأولى", description: "فتحت المنصة لأول مرة", emoji: "👣", tier: "bronze", category: "consistency", requirement: "افتح المنصة", unlocked: true, unlockedAt: Date.now(), progress: 100, maxProgress: 100 },
  { id: "week-streak", title: "أسبوع متواصل", description: "7 أيام متتالية في الرحلة", emoji: "🔥", tier: "silver", category: "consistency", requirement: "7 أيام streak", unlocked: false, unlockedAt: null, progress: 0, maxProgress: 7 },
  { id: "month-warrior", title: "محارب الشهر", description: "30 يوم بدون انقطاع", emoji: "⚡", tier: "gold", category: "consistency", requirement: "30 يوم streak", unlocked: false, unlockedAt: null, progress: 0, maxProgress: 30 },
  { id: "hundred-days", title: "المئوي", description: "100 يوم في الرحلة", emoji: "💯", tier: "legendary", category: "consistency", requirement: "100 يوم", unlocked: false, unlockedAt: null, progress: 0, maxProgress: 100 },

  // Depth
  { id: "first-journal", title: "أول كلمة", description: "كتبت أول إدخال في الوثيقة", emoji: "✍️", tier: "bronze", category: "depth", requirement: "إدخال واحد في وثيقة", unlocked: false, unlockedAt: null, progress: 0, maxProgress: 1 },
  { id: "deep-diver", title: "الغوّاص", description: "10 إدخالات في الوثيقة", emoji: "🌊", tier: "silver", category: "depth", requirement: "10 إدخالات", unlocked: false, unlockedAt: null, progress: 0, maxProgress: 10 },
  { id: "soul-mapper", title: "رسّام الروح", description: "أكملت خريطة الرحلة كاملة", emoji: "🗺️", tier: "gold", category: "depth", requirement: "خريطة رحلة كاملة", unlocked: false, unlockedAt: null, progress: 0, maxProgress: 100 },
  { id: "mirror-gazer", title: "ناظر المرآة", description: "استخدمت مرايا 5 مرات", emoji: "🪞", tier: "silver", category: "depth", requirement: "5 جلسات مرايا", unlocked: false, unlockedAt: null, progress: 0, maxProgress: 5 },

  // Courage
  { id: "first-boundary", title: "أول حد", description: "رسمت أول حدود شخصية", emoji: "🛡️", tier: "bronze", category: "courage", requirement: "حد واحد", unlocked: false, unlockedAt: null, progress: 0, maxProgress: 1 },
  { id: "hard-truth", title: "الحقيقة الصعبة", description: "واجهت نتيجة تحليل سلوكي صعبة", emoji: "💎", tier: "silver", category: "courage", requirement: "تحليل سلوكي", unlocked: false, unlockedAt: null, progress: 0, maxProgress: 1 },
  { id: "bridge-builder", title: "بانِي الجسور", description: "أكملت 3 محاولات إصلاح في جسر", emoji: "🌉", tier: "gold", category: "courage", requirement: "3 جسور", unlocked: false, unlockedAt: null, progress: 0, maxProgress: 3 },

  // Connection
  { id: "first-risala", title: "أول رسالة", description: "أرسلت رسالة تشجيع لمسافر", emoji: "💌", tier: "bronze", category: "connection", requirement: "رسالة واحدة", unlocked: false, unlockedAt: null, progress: 0, maxProgress: 1 },
  { id: "rifaq-join", title: "رفيق الطريق", description: "انضممت لمجموعة رفاق", emoji: "👥", tier: "silver", category: "connection", requirement: "مجموعة واحدة", unlocked: false, unlockedAt: null, progress: 0, maxProgress: 1 },

  // Mastery
  { id: "wird-master", title: "صاحب الورد", description: "أكملت 100 تسبيحة في يوم واحد", emoji: "📿", tier: "bronze", category: "mastery", requirement: "100 تسبيحة/يوم", unlocked: false, unlockedAt: null, progress: 0, maxProgress: 100 },
  { id: "niyya-setter", title: "صاحب النية", description: "حددت نية 7 أيام متتالية", emoji: "🎯", tier: "silver", category: "mastery", requirement: "7 أيام نية", unlocked: false, unlockedAt: null, progress: 0, maxProgress: 7 },
  { id: "ecosystem-explorer", title: "مستكشف المنظومة", description: "زرت 10 أدوات مختلفة", emoji: "🧭", tier: "gold", category: "mastery", requirement: "10 أدوات", unlocked: false, unlockedAt: null, progress: 0, maxProgress: 10 },
  { id: "sovereign-soul", title: "الروح السيادية", description: "أكملت كل الشهادات الذهبية", emoji: "👑", tier: "legendary", category: "mastery", requirement: "كل الذهبيات", unlocked: false, unlockedAt: null, progress: 0, maxProgress: 100 },
];

/* ═══════════════════════════════════════════ */
/*               STORE                        */
/* ═══════════════════════════════════════════ */

export const useShahadaState = create<ShahadaState>()(
  persist(
    (set, get) => ({
      certificates: DEFAULT_CERTIFICATES,

      unlockCertificate: (id) => set((s) => ({
        certificates: s.certificates.map((c) =>
          c.id === id && !c.unlocked ? { ...c, unlocked: true, unlockedAt: Date.now(), progress: c.maxProgress } : c
        ),
      })),

      updateProgress: (id, value) => set((s) => ({
        certificates: s.certificates.map((c) => {
          if (c.id !== id || c.unlocked) return c;
          const newProgress = Math.min(value, c.maxProgress);
          const shouldUnlock = newProgress >= c.maxProgress;
          return { ...c, progress: newProgress, unlocked: shouldUnlock, unlockedAt: shouldUnlock ? Date.now() : null };
        }),
      })),

      resetAll: () => set({ certificates: DEFAULT_CERTIFICATES }),

      getUnlocked: () => get().certificates.filter((c) => c.unlocked),
      getLocked: () => get().certificates.filter((c) => !c.unlocked),
      getByCategory: (cat) => get().certificates.filter((c) => c.category === cat),
      getByTier: (tier) => get().certificates.filter((c) => c.tier === tier),
      getTotalUnlocked: () => get().certificates.filter((c) => c.unlocked).length,
      getCompletionPct: () => {
        const certs = get().certificates;
        return certs.length > 0 ? Math.round((certs.filter((c) => c.unlocked).length / certs.length) * 100) : 0;
      },
    }),
    { name: "alrehla-shahada", storage: zustandIdbStorage }
  )
);
