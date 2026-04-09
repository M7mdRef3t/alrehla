/**
 * 🕐 Daily Rituals — نظام العادات والروتين اليومي
 * ================================================
 * يحول المنصة من أداة تحليل إلى نظام تشغيل يومي.
 *
 * المكونات:
 * - DailyRitual: عادة يومية (مثل: تمرين، قراءة، تأمل)
 * - RitualLog: تسجيل إتمام عادة
 * - DailyPlan: خطة اليوم الكاملة
 * - EveningReflection: مراجعة آخر اليوم
 */

import type { LifeDomainId } from "./lifeDomains";

// ─── Time of Day ─────────────────────────────────────────────────
export type TimeOfDay = "morning" | "afternoon" | "evening" | "anytime";

// ─── Frequency ───────────────────────────────────────────────────
export type RitualFrequency = "daily" | "weekdays" | "weekends" | "custom";

// ─── Daily Ritual ────────────────────────────────────────────────
export interface DailyRitual {
  id: string;
  name: string;
  icon: string;
  /** المجال المرتبط بالعادة */
  domainId: LifeDomainId;
  /** وقت اليوم المفضل */
  targetTime: TimeOfDay;
  /** التكرار */
  frequency: RitualFrequency;
  /** أيام مخصصة (0=أحد, 6=سبت) — لو frequency=custom */
  customDays?: number[];
  /** المدة المتوقعة بالدقائق */
  estimatedMinutes: number;
  /** هل العادة مفعّلة؟ */
  isActive: boolean;
  /** هل من العادات المقترحة من المنصة؟ */
  isPreset: boolean;
  /** ترتيب العرض */
  sortOrder: number;
  /** تاريخ الإنشاء */
  createdAt: number;
}

// ─── Ritual Log ──────────────────────────────────────────────────
export interface RitualLog {
  id: string;
  ritualId: string;
  /** تاريخ اليوم (YYYY-MM-DD) */
  logDate: string;
  /** وقت الإتمام */
  completedAt: number;
  /** ملاحظة اختيارية */
  note?: string;
  /** كيف حسيت بعد ما عملتها */
  feelingAfter?: "great" | "good" | "neutral" | "meh";
}

// ─── Day Theme ───────────────────────────────────────────────────
export type DayTheme =
  | "productivity"  // يوم إنتاجية
  | "recovery"      // يوم راحة واستشفاء
  | "social"        // يوم علاقات
  | "growth"        // يوم تعلم ونمو
  | "balance";      // يوم متوازن

export const DAY_THEME_CONFIG: Record<DayTheme, { label: string; icon: string; color: string; description: string }> = {
  productivity: { label: "يوم إنتاجية", icon: "⚡", color: "#f59e0b", description: "فوكس على الشغل والإنجاز" },
  recovery:     { label: "يوم استشفاء", icon: "🌿", color: "#10b981", description: "خذ راحة وجدد طاقتك" },
  social:       { label: "يوم علاقات", icon: "💙", color: "#06b6d4", description: "اهتم بناسك ودوايرك" },
  growth:       { label: "يوم نمو", icon: "🧠", color: "#8b5cf6", description: "اتعلم واتطور" },
  balance:      { label: "يوم متوازن", icon: "☯️", color: "#6366f1", description: "شوية من كل حاجة" }
};

// ─── Daily Plan ──────────────────────────────────────────────────
export interface DailyPlan {
  id: string;
  /** تاريخ اليوم (YYYY-MM-DD) */
  planDate: string;
  /** مستوى الطاقة أول اليوم (1-10) */
  morningEnergy: number | null;
  /** ثيم اليوم (AI-suggested أو manual) */
  dayTheme: DayTheme | null;
  /** أهم 3 أولويات */
  topPriorities: DailyPriority[];
  /** هل بدأ المستخدم يومه (confirmed morning brief) */
  morningStarted: boolean;
  /** مراجعة المساء */
  eveningReflection: EveningReflection | null;
  /** تقييم اليوم الإجمالي (1-10) */
  dayRating: number | null;
  /** وقت الإنشاء */
  createdAt: number;
}

// ─── Daily Priority ──────────────────────────────────────────────
export interface DailyPriority {
  id: string;
  text: string;
  domainId: LifeDomainId;
  isCompleted: boolean;
  /** مصدر الأولوية */
  source: "user" | "ai" | "system";
}

// ─── Evening Reflection ─────────────────────────────────────────
export interface EveningReflection {
  /** أحلى لحظة في اليوم */
  bestMoment: string;
  /** إيه اللي كان ممكن يكون أحسن */
  couldBeBetter: string;
  /** درس اليوم */
  lessonLearned: string;
  /** المزاج آخر اليوم */
  eveningMood: "great" | "good" | "neutral" | "tired" | "stressed";
  /** مستوى الطاقة آخر اليوم (1-10) */
  eveningEnergy: number;
  /** وقت الحفظ */
  completedAt: number;
}

// ─── Preset Rituals (Suggested) ──────────────────────────────────
export interface PresetRitual {
  name: string;
  icon: string;
  domainId: LifeDomainId;
  targetTime: TimeOfDay;
  estimatedMinutes: number;
  category: "essential" | "growth" | "wellness";
}

export const PRESET_RITUALS: PresetRitual[] = [
  // Essential
  { name: "تأمل صباحي", icon: "🧘", domainId: "spirit", targetTime: "morning", estimatedMinutes: 10, category: "essential" },
  { name: "تمرين رياضي", icon: "💪", domainId: "body", targetTime: "morning", estimatedMinutes: 30, category: "essential" },
  { name: "قراءة", icon: "📖", domainId: "knowledge", targetTime: "evening", estimatedMinutes: 20, category: "essential" },
  { name: "شكر وامتنان", icon: "🙏", domainId: "spirit", targetTime: "morning", estimatedMinutes: 5, category: "essential" },
  { name: "نوم بدري", icon: "😴", domainId: "body", targetTime: "evening", estimatedMinutes: 0, category: "essential" },

  // Growth
  { name: "تعلم مهارة جديدة", icon: "🎯", domainId: "knowledge", targetTime: "afternoon", estimatedMinutes: 30, category: "growth" },
  { name: "كتابة يوميات", icon: "✍️", domainId: "self", targetTime: "evening", estimatedMinutes: 10, category: "growth" },
  { name: "مراجعة أهداف", icon: "🗺️", domainId: "dreams", targetTime: "morning", estimatedMinutes: 5, category: "growth" },
  { name: "ميزانية يومية", icon: "💰", domainId: "finance", targetTime: "evening", estimatedMinutes: 5, category: "growth" },

  // Wellness
  { name: "مشي", icon: "🚶", domainId: "body", targetTime: "anytime", estimatedMinutes: 20, category: "wellness" },
  { name: "شرب مية كفاية", icon: "💧", domainId: "body", targetTime: "anytime", estimatedMinutes: 0, category: "wellness" },
  { name: "تواصل مع حد قريب", icon: "📱", domainId: "relations", targetTime: "afternoon", estimatedMinutes: 10, category: "wellness" },
  { name: "وقت بدون شاشات", icon: "📵", domainId: "self", targetTime: "evening", estimatedMinutes: 30, category: "wellness" },
  { name: "أكل صحي", icon: "🥗", domainId: "body", targetTime: "anytime", estimatedMinutes: 0, category: "wellness" },
];

// ─── Helpers ─────────────────────────────────────────────────────

/** Get today's date as YYYY-MM-DD */
export function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Check if a Date is today */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayDate();
}

/** Get current time of day */
export function getCurrentTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  return "evening";
}

/** Check if a ritual should be shown today */
export function isRitualScheduledToday(ritual: DailyRitual): boolean {
  if (!ritual.isActive) return false;
  const dayOfWeek = new Date().getDay(); // 0=Sunday

  switch (ritual.frequency) {
    case "daily": return true;
    case "weekdays": return dayOfWeek >= 1 && dayOfWeek <= 5;
    case "weekends": return dayOfWeek === 0 || dayOfWeek === 6;
    case "custom": return ritual.customDays?.includes(dayOfWeek) ?? false;
    default: return true;
  }
}
