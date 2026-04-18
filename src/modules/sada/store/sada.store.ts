/**
 * صدى — Sada Store
 *
 * Smart Nudges: behavior-driven notifications,
 * daily tips, milestone celebrations, and gentle reminders.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ═══════════════════════════════════════════ */
/*                 TYPES                      */
/* ═══════════════════════════════════════════ */

export type NudgeType = "reminder" | "milestone" | "insight" | "encouragement" | "warning" | "celebration";
export type NudgePriority = "low" | "medium" | "high";

export interface Nudge {
  id: string;
  type: NudgeType;
  title: string;
  body: string;
  emoji: string;
  priority: NudgePriority;
  read: boolean;
  dismissed: boolean;
  createdAt: number;
  expiresAt: number | null;
  actionLabel?: string;
  actionScreen?: string;
}

export interface SadaState {
  nudges: Nudge[];
  lastGeneratedAt: number;

  // Actions
  addNudge: (data: Omit<Nudge, "id" | "read" | "dismissed" | "createdAt">) => void;
  markRead: (id: string) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  clearExpired: () => void;
  generateDailyNudges: () => void;

  // Getters
  getUnread: () => Nudge[];
  getActive: () => Nudge[];
  getUnreadCount: () => number;
  getByType: (type: NudgeType) => Nudge[];
}

/* ═══════════════════════════════════════════ */
/*              CONSTANTS                     */
/* ═══════════════════════════════════════════ */

export const NUDGE_TYPE_META: Record<NudgeType, { label: string; emoji: string; color: string }> = {
  reminder:      { label: "تذكير",    emoji: "🔔", color: "#f59e0b" },
  milestone:     { label: "إنجاز",    emoji: "🏆", color: "#22c55e" },
  insight:       { label: "بصيرة",    emoji: "💡", color: "#6366f1" },
  encouragement: { label: "تشجيع",    emoji: "💪", color: "#14b8a6" },
  warning:       { label: "تنبيه",    emoji: "⚠️", color: "#ef4444" },
  celebration:   { label: "احتفال",   emoji: "🎉", color: "#ec4899" },
};

const DAILY_NUDGE_TEMPLATES: Array<Omit<Nudge, "id" | "read" | "dismissed" | "createdAt">> = [
  { type: "reminder", title: "وقت الورد", body: "لسانك رطب بذكر الله؟ 📿 دقيقتين تغيّر يومك.", emoji: "📿", priority: "medium", expiresAt: null, actionLabel: "افتح الورد", actionScreen: "wird" },
  { type: "encouragement", title: "أنت على الطريق", body: "كل خطوة صغيرة في رحلتك تُحسب — استمر.", emoji: "🚶", priority: "low", expiresAt: null },
  { type: "insight", title: "لحظة تأمل", body: "متى آخر مرة سألت نفسك: 'أنا فعلاً بخير؟'", emoji: "🪞", priority: "medium", expiresAt: null },
  { type: "reminder", title: "تنفّس", body: "خذ نفس عميق الآن. 4 ثواني شهيق، 4 زفير. كرّر 3 مرات.", emoji: "🌬️", priority: "low", expiresAt: null, actionLabel: "افتح صمت", actionScreen: "samt" },
  { type: "encouragement", title: "جذورك صلبة", body: "راجع قيمك اليوم — هل عشتها؟ 🌱", emoji: "🧬", priority: "medium", expiresAt: null, actionLabel: "افتح جذر", actionScreen: "jathr" },
  { type: "insight", title: "أحلامك رسائل", body: "هل حلمت شيء مهم أمس؟ سجّله قبل ما تنساه.", emoji: "🔮", priority: "low", expiresAt: null, actionLabel: "افتح رؤيا", actionScreen: "ruya" },
  { type: "reminder", title: "نيّتك اليوم", body: "حدّد نية واحدة لهذا اليوم — خطوة صغيرة بوعي.", emoji: "🎯", priority: "high", expiresAt: null, actionLabel: "افتح نية", actionScreen: "niyya" },
  { type: "encouragement", title: "الصبر قوة", body: "الرحلة مش سباق. كل يوم تقدر تبدأ من جديد.", emoji: "🌅", priority: "low", expiresAt: null },
  { type: "insight", title: "علاقاتك مرآة", body: "العلاقة اللي تستنزفك — ليه لسه موجودة؟ فكّر بهدوء.", emoji: "🪞", priority: "medium", expiresAt: null },
  { type: "celebration", title: "مسافر شجاع", body: "مجرد إنك هنا — ده إنجاز بيستحق الاحتفال 🎊", emoji: "🎉", priority: "low", expiresAt: null },
  { type: "reminder", title: "جسمك محتاجك", body: "اشرب ماء، تمدّد، خذ نفس. جسمك شريك رحلتك.", emoji: "💧", priority: "low", expiresAt: null },
  { type: "insight", title: "الأثر التراكمي", body: "70 يوم من خطوات صغيرة = تحوّل جذري لا يُصدّق.", emoji: "📈", priority: "medium", expiresAt: null },
];

/* ═══════════════════════════════════════════ */
/*               STORE                        */
/* ═══════════════════════════════════════════ */

const genId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const todayKey = () => new Date().toISOString().slice(0, 10);

export const useSadaState = create<SadaState>()(
  persist(
    (set, get) => ({
      nudges: [],
      lastGeneratedAt: 0,

      addNudge: (data) => {
        const nudge: Nudge = { ...data, id: genId(), read: false, dismissed: false, createdAt: Date.now() };
        set((s) => ({ nudges: [nudge, ...s.nudges].slice(0, 200) }));
      },

      markRead: (id) => set((s) => ({ nudges: s.nudges.map((n) => n.id === id ? { ...n, read: true } : n) })),

      dismiss: (id) => set((s) => ({ nudges: s.nudges.map((n) => n.id === id ? { ...n, dismissed: true } : n) })),

      dismissAll: () => set((s) => ({ nudges: s.nudges.map((n) => ({ ...n, dismissed: true })) })),

      clearExpired: () => {
        const now = Date.now();
        set((s) => ({ nudges: s.nudges.filter((n) => !n.expiresAt || n.expiresAt > now) }));
      },

      generateDailyNudges: () => {
        const today = todayKey();
        const lastDate = new Date(get().lastGeneratedAt).toISOString().slice(0, 10);
        if (lastDate === today) return; // Already generated today

        // Pick 3 random nudges for the day
        const shuffled = [...DAILY_NUDGE_TEMPLATES].sort(() => Math.random() - 0.5);
        const picks = shuffled.slice(0, 3);

        picks.forEach((template) => {
          get().addNudge(template);
        });

        set({ lastGeneratedAt: Date.now() });
      },

      getUnread: () => get().nudges.filter((n) => !n.read && !n.dismissed),
      getActive: () => get().nudges.filter((n) => !n.dismissed),
      getUnreadCount: () => get().nudges.filter((n) => !n.read && !n.dismissed).length,
      getByType: (type) => get().nudges.filter((n) => n.type === type && !n.dismissed),
    }),
    { name: "alrehla-sada" }
  )
);
