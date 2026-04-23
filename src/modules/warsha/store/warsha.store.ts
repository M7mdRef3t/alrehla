/**
 * ورشة — Warsha Store
 *
 * 7-day micro-challenges: pick a challenge, check in daily, earn badge.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { zustandIdbStorage } from '@/utils/idbStorage';


/* ═══════════════════════════════════════════ */
/*                 TYPES                      */
/* ═══════════════════════════════════════════ */

export type ChallengeCategory = "gratitude" | "silence" | "forgive" | "connect" | "reflect" | "move" | "create";

export interface ChallengeDay {
  day: number; // 1-7
  title: string;
  task: string;
}

export interface ChallengeTemplate {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  category: ChallengeCategory;
  color: string;
  days: ChallengeDay[];
}

export interface ActiveChallenge {
  templateId: string;
  startedAt: number;
  completedDays: number[]; // day numbers checked-in
  notes: Record<number, string>; // day -> note
  isComplete: boolean;
  completedAt?: number;
}

export interface WarshaState {
  activeChallenges: ActiveChallenge[];
  completedChallenges: ActiveChallenge[];

  // Actions
  startChallenge: (templateId: string) => void;
  checkInDay: (templateId: string, day: number, note?: string) => void;
  completeChallenge: (templateId: string) => void;
  abandonChallenge: (templateId: string) => void;

  // Getters
  getActive: () => ActiveChallenge[];
  getCompleted: () => ActiveChallenge[];
  isStarted: (templateId: string) => boolean;
  getProgress: (templateId: string) => number;
  getTotalCompleted: () => number;
  getBadgeCount: () => number;
}

/* ═══════════════════════════════════════════ */
/*              CONSTANTS                     */
/* ═══════════════════════════════════════════ */

export const CATEGORY_META: Record<ChallengeCategory, { label: string; emoji: string; color: string }> = {
  gratitude: { label: "امتنان",  emoji: "🙏", color: "#10b981" },
  silence:   { label: "صمت",    emoji: "🤫", color: "#6366f1" },
  forgive:   { label: "مسامحة", emoji: "🕊️", color: "#a78bfa" },
  connect:   { label: "تواصل",  emoji: "🤝", color: "#f59e0b" },
  reflect:   { label: "تأمل",   emoji: "🪞", color: "#8b5cf6" },
  move:      { label: "حركة",   emoji: "🏃", color: "#ef4444" },
  create:    { label: "إبداع",  emoji: "🎨", color: "#ec4899" },
};

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    id: "gratitude-7",
    title: "7 أيام امتنان",
    subtitle: "اكتشف ما تملكه بالفعل",
    emoji: "🙏",
    category: "gratitude",
    color: "#10b981",
    days: [
      { day: 1, title: "شخص", task: "اكتب 3 أشياء ممتن لها في شخص قريب منك" },
      { day: 2, title: "جسدك", task: "اشكر جسدك على 3 أشياء يفعلها لك كل يوم" },
      { day: 3, title: "لحظة", task: "صوّر أو اكتب عن لحظة جميلة حدثت اليوم" },
      { day: 4, title: "تحدّي", task: "اكتب عن تحدّي مررت به وعلّمك شيئاً" },
      { day: 5, title: "مكان", task: "ما المكان الذي تشعر فيه بالسلام؟ ولماذا؟" },
      { day: 6, title: "مهارة", task: "ما المهارة التي تملكها وتنسى أن تشكرها؟" },
      { day: 7, title: "أنت", task: "اكتب رسالة شكر لنفسك — بصدق" },
    ],
  },
  {
    id: "silence-7",
    title: "7 أيام صمت واعي",
    subtitle: "اسمع ما لا يُقال",
    emoji: "🤫",
    category: "silence",
    color: "#6366f1",
    days: [
      { day: 1, title: "5 دقائق", task: "اجلس 5 دقائق في صمت تام — لاحظ أفكارك فقط" },
      { day: 2, title: "بلا هاتف", task: "ساعة واحدة بدون هاتف — ماذا لاحظت؟" },
      { day: 3, title: "استمع", task: "في حوار اليوم — استمع فقط بدون مقاطعة" },
      { day: 4, title: "الطبيعة", task: "اخرج واجلس 10 دقائق — اسمع أصوات الطبيعة" },
      { day: 5, title: "ملاحظة", task: "لاحظ كم مرة أردت التكلم ولم تفعل — كيف شعرت؟" },
      { day: 6, title: "كتابة", task: "اكتب بدل ما تتكلم — دوّن أفكارك 10 دقائق" },
      { day: 7, title: "صمت كامل", task: "ساعة كاملة صمت واعي — ثم اكتب ماذا اكتشفت" },
    ],
  },
  {
    id: "forgive-7",
    title: "7 أيام مسامحة",
    subtitle: "خفّف قلبك خطوة بخطوة",
    emoji: "🕊️",
    category: "forgive",
    color: "#a78bfa",
    days: [
      { day: 1, title: "التعرّف", task: "اكتب اسم شخص تحتاج أن تسامحه (أو نفسك)" },
      { day: 2, title: "القصة", task: "اكتب ما حدث — بدون حكم — فقط الحقائق" },
      { day: 3, title: "المشاعر", task: "ما المشاعر التي تحملها تجاه هذا الموقف؟" },
      { day: 4, title: "الدرس", task: "ما الذي تعلّمته من هذا الموقف؟" },
      { day: 5, title: "التعاطف", task: "حاول أن تفهم وجهة نظر الآخر — لماذا فعل ذلك؟" },
      { day: 6, title: "الرسالة", task: "اكتب رسالة مسامحة — لا تحتاج إرسالها" },
      { day: 7, title: "الإطلاق", task: "اقرأ رسالتك بصوت عالٍ ثم أغلق هذا الفصل" },
    ],
  },
  {
    id: "connect-7",
    title: "7 أيام تواصل حقيقي",
    subtitle: "ابنِ جسوراً حقيقية",
    emoji: "🤝",
    category: "connect",
    color: "#f59e0b",
    days: [
      { day: 1, title: "رسالة", task: "أرسل رسالة لشخص لم تتواصل معه منذ فترة" },
      { day: 2, title: "سؤال عميق", task: "اسأل شخص قريب: 'كيف حالك فعلاً؟'" },
      { day: 3, title: "استماع", task: "في حوار اليوم — استمع أكثر مما تتكلم" },
      { day: 4, title: "شكر", task: "قل لشخص 'شكراً' على شيء محدد فعله لك" },
      { day: 5, title: "مساعدة", task: "ساعد شخصاً بدون أن يطلب — ماذا فعلت؟" },
      { day: 6, title: "حضور", task: "اجلس مع شخص عزيز بدون هاتف — حضور كامل" },
      { day: 7, title: "اعتذار", task: "هل تحتاج أن تعتذر لأحد؟ اليوم هو اليوم" },
    ],
  },
  {
    id: "reflect-7",
    title: "7 أيام تأمل ذاتي",
    subtitle: "اعرف نفسك أعمق",
    emoji: "🪞",
    category: "reflect",
    color: "#8b5cf6",
    days: [
      { day: 1, title: "القيم", task: "ما أهم 3 قيم في حياتك؟ ولماذا؟" },
      { day: 2, title: "الخوف", task: "ما أكبر خوف يمنعك من التقدم؟" },
      { day: 3, title: "النجاح", task: "ما معنى النجاح بالنسبة لك — بصدق؟" },
      { day: 4, title: "الطفل", task: "ماذا كان يحلم به طفلك الداخلي؟" },
      { day: 5, title: "الإنجاز", task: "ما أكبر إنجاز تفتخر به؟ ولماذا لا تحتفل به؟" },
      { day: 6, title: "التغيير", task: "لو غيّرت شيئاً واحداً في حياتك اليوم — ما هو؟" },
      { day: 7, title: "الرسالة", task: "اكتب رسالة لنفسك بعد سنة من الآن" },
    ],
  },
  {
    id: "move-7",
    title: "7 أيام حركة واعية",
    subtitle: "جسدك يتكلم — اسمعه",
    emoji: "🏃",
    category: "move",
    color: "#ef4444",
    days: [
      { day: 1, title: "مشي", task: "امشِ 15 دقيقة بدون هاتف — لاحظ ما حولك" },
      { day: 2, title: "تمدد", task: "5 دقائق تمدد صباحي — كيف شعر جسدك؟" },
      { day: 3, title: "تنفس", task: "4 جولات تنفس عميق: 4 ثوانٍ شهيق، 4 زفير" },
      { day: 4, title: "رقص", task: "أغنية واحدة — ارقص كما تشاء — بدون حكم" },
      { day: 5, title: "قوة", task: "10 تمارين ضغط أو 20 سكوات — ابدأ صغيراً" },
      { day: 6, title: "ماء", task: "اشرب 8 أكواب ماء اليوم — سجّل كل كوب" },
      { day: 7, title: "نوم", task: "نم 30 دقيقة أبكر الليلة — لاحظ الفرق غداً" },
    ],
  },
];

/* ═══════════════════════════════════════════ */
/*               STORE                        */
/* ═══════════════════════════════════════════ */

export const useWarshaState = create<WarshaState>()(
  persist(
    (set, get) => ({
      activeChallenges: [],
      completedChallenges: [],

      startChallenge: (templateId) => {
        if (get().activeChallenges.some((c) => c.templateId === templateId)) return;
        const challenge: ActiveChallenge = {
          templateId,
          startedAt: Date.now(),
          completedDays: [],
          notes: {},
          isComplete: false,
        };
        set((s) => ({ activeChallenges: [challenge, ...s.activeChallenges] }));
      },

      checkInDay: (templateId, day, note) => {
        set((s) => ({
          activeChallenges: s.activeChallenges.map((c) => {
            if (c.templateId !== templateId) return c;
            if (c.completedDays.includes(day)) return c;
            const newDays = [...c.completedDays, day].sort((a, b) => a - b);
            const newNotes = { ...c.notes };
            if (note) newNotes[day] = note;
            const isComplete = newDays.length >= 7;
            return { ...c, completedDays: newDays, notes: newNotes, isComplete, completedAt: isComplete ? Date.now() : undefined };
          }),
        }));
        // Auto-complete
        const updated = get().activeChallenges.find((c) => c.templateId === templateId);
        if (updated?.isComplete) {
          get().completeChallenge(templateId);
        }
      },

      completeChallenge: (templateId) => {
        const challenge = get().activeChallenges.find((c) => c.templateId === templateId);
        if (!challenge) return;
        set((s) => ({
          activeChallenges: s.activeChallenges.filter((c) => c.templateId !== templateId),
          completedChallenges: [{ ...challenge, isComplete: true, completedAt: challenge.completedAt || Date.now() }, ...s.completedChallenges],
        }));
      },

      abandonChallenge: (templateId) => {
        set((s) => ({
          activeChallenges: s.activeChallenges.filter((c) => c.templateId !== templateId),
        }));
      },

      getActive: () => get().activeChallenges,
      getCompleted: () => get().completedChallenges,
      isStarted: (templateId) => get().activeChallenges.some((c) => c.templateId === templateId),
      getProgress: (templateId) => {
        const c = get().activeChallenges.find((c) => c.templateId === templateId);
        return c ? Math.round((c.completedDays.length / 7) * 100) : 0;
      },
      getTotalCompleted: () => get().completedChallenges.length,
      getBadgeCount: () => get().completedChallenges.length,
    }),
    { name: "alrehla-warsha", storage: zustandIdbStorage }
  )
);
