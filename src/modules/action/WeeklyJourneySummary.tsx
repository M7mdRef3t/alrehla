/**
 * WeeklyJourneySummary — ملخص الرحلة الأسبوعية
 * ================================================
 * يُطلق تلقائياً مرة واحدة بعد 7+ أيام من أول دخول.
 * يعرض: الـ streak، عدد الـ nodes، الـ pulses، رسالة تحفيزية.
 * الهدف: منح المستخدم "AHA Moment" — يرى تقدمه الحقيقي.
 */

/* eslint-disable react-refresh/only-export-components */
import { type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Users, Heart, Trophy } from "lucide-react";
import { useMapState } from '@/modules/map/dawayirIndex';
import { loadStreak } from "@/services/streakSystem";

const WEEKLY_SHOWN_KEY = "dawayir-weekly-summary-shown";

/** هل يجب إظهار الملخص الأسبوعي؟ */
export function shouldShowWeeklySummary(journeyStartedAt: number | null): boolean {
  if (!journeyStartedAt) return false;
  const daysSinceStart = (Date.now() - journeyStartedAt) / (1000 * 60 * 60 * 24);
  if (daysSinceStart < 7) return false;

  // لا يُعرض أكثر من مرة في الأسبوع
  try {
    const lastShown = localStorage.getItem(WEEKLY_SHOWN_KEY);
    if (!lastShown) return true;
    const daysSinceShown = (Date.now() - Number(lastShown)) / (1000 * 60 * 60 * 24);
    return daysSinceShown >= 7;
  } catch {
    return true;
  }
}

export function markWeeklySummaryShown(): void {
  try {
    localStorage.setItem(WEEKLY_SHOWN_KEY, String(Date.now()));
  } catch { /* noop */ }
}

interface WeeklyJourneySummaryProps {
  isOpen: boolean;
  journeyStartedAt: number | null;
  onClose: () => void;
  onShare?: () => void;
}

const MOTIVATIONAL = [
  "الاستمرار هو السر. كل يوم بترجع للرحلة هو فوز.",
  "التعافي مش سباق — هو وعي يومي. وأنت واعي.",
  "كل نبضة سجّلتها دي شجاعة حقيقية.",
  "أنت بتكتب قصة تستحق تتروى.",
  "الحل مش في يوم واحد — هو في الأيام المتراكمة زي دي.",
];

export const WeeklyJourneySummary: FC<WeeklyJourneySummaryProps> = ({
  isOpen,
  journeyStartedAt,
  onClose,
  onShare,
}) => {
  const nodes = useMapState((s) => s.nodes);
  const streak = loadStreak();

  const activeNodes = nodes.filter((n) => !n.isNodeArchived);
  const greenNodes = activeNodes.filter((n) => n.ring === "green").length;

  const journeyDays = journeyStartedAt
    ? Math.floor((Date.now() - journeyStartedAt) / (1000 * 60 * 60 * 24))
    : 0;

  const motivation = MOTIVATIONAL[journeyDays % MOTIVATIONAL.length];

  const stats = [
    { icon: <Flame className="w-5 h-5 text-orange-400" />, value: streak.currentStreak, label: "يوم streak", color: "rgba(251,146,60,0.15)", border: "rgba(251,146,60,0.25)" },
    { icon: <Users className="w-5 h-5 text-teal-400" />, value: activeNodes.length, label: "في دوايرك", color: "rgba(45,212,191,0.12)", border: "rgba(45,212,191,0.22)" },
    { icon: <Heart className="w-5 h-5 text-rose-400" />, value: greenNodes, label: "علاقة آمنة", color: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.22)" },
    { icon: <Trophy className="w-5 h-5 text-amber-400" />, value: journeyDays, label: "يوم في الرحلة", color: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.22)" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
            className="w-full max-w-sm rounded-3xl overflow-hidden"
            style={{
              background: "rgba(13,19,36,0.98)",
              border: "1px solid rgba(45,212,191,0.18)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(45,212,191,0.06)",
            }}
          >
            {/* Header */}
            <div className="relative p-6 pb-4 text-center">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-4xl mb-3">🌟</div>
              <h2 className="text-lg font-bold text-white mb-1">رحلتك الأسبوعية</h2>
              <p className="text-xs text-slate-400">
                {journeyDays} يوم من لما بدأت — إليك ما أنجزته
              </p>
            </div>

            {/* Stats Grid */}
            <div className="px-5 pb-4 grid grid-cols-2 gap-3">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  className="rounded-2xl p-4 text-center"
                  style={{ background: stat.color, border: `1px solid ${stat.border}` }}
                >
                  <div className="flex justify-center mb-2">{stat.icon}</div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Motivational message */}
            <div
              className="mx-5 mb-4 p-4 rounded-2xl text-center"
              style={{
                background: "rgba(45,212,191,0.06)",
                border: "1px solid rgba(45,212,191,0.12)",
              }}
            >
              <p className="text-sm text-slate-200 leading-relaxed font-medium">
                "{motivation}"
              </p>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 flex flex-col gap-2">
              {onShare && (
                <button
                  type="button"
                  onClick={() => { onShare(); onClose(); }}
                  className="w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                  style={{
                    background: "rgba(45,212,191,0.15)",
                    border: "1px solid rgba(45,212,191,0.3)",
                    color: "rgba(45,212,191,0.9)",
                  }}
                >
                  🎉 شارك إنجازك
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl text-sm font-bold text-slate-400 hover:text-slate-200 transition-colors"
              >
                استمر في الرحلة ←
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
