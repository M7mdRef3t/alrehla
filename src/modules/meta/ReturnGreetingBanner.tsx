/**
 * ReturnGreetingBanner — بانر الترحيب بالعائد
 * ================================================
 * يظهر في أعلى الـ Dashboard للمستخدم العائد
 * الذي لم يسجّل نبضته اليوم بعد.
 * الهدف: إعادة الارتباط الهادي — لا ضغط، فقط تذكير لطيف.
 */

import { type FC, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X } from "lucide-react";
import { loadUserMemory, resolveDisplayName } from "@/services/userMemory";
import { usePulseState } from "@/domains/consciousness/store/pulse.store";

interface ReturnGreetingBannerProps {
  onOpenPulseCheck: () => void;
}

export const ReturnGreetingBanner: FC<ReturnGreetingBannerProps> = ({ onOpenPulseCheck }) => {
  const [dismissed, setDismissed] = useState(false);
  const lastPulse = usePulseState((s) => s.lastPulse);
  const memory = loadUserMemory();

  // لا يظهر للمستخدم الجديد (أول زيارة)
  if (memory.totalSessions === 0) return null;

  // لا يظهر لو سجّل نبضة اليوم
  if (lastPulse) {
    const today = new Date();
    const pulseDate = new Date(lastPulse.timestamp);
    const isTodayPulse =
      pulseDate.getFullYear() === today.getFullYear() &&
      pulseDate.getMonth() === today.getMonth() &&
      pulseDate.getDate() === today.getDate();
    if (isTodayPulse) return null;
  }

  if (dismissed) return null;

  const displayName = resolveDisplayName();
  const greeting = displayName
    ? `أهلاً ${displayName}، أهلاً بعودتك 💙`
    : "أهلاً بعودتك 💙";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        dir="rtl"
        className="overflow-hidden"
      >
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl mb-2"
          style={{
            background: "rgba(45,212,191,0.06)",
            border: "1px solid rgba(45,212,191,0.18)",
          }}
        >
          {/* Icon */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: "rgba(45,212,191,0.12)",
              border: "1px solid rgba(45,212,191,0.22)",
            }}
          >
            <Heart className="w-4 h-4 text-teal-400" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0 text-right">
            <p className="text-xs font-bold text-white leading-snug">{greeting}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">كيف حالك اليوم؟ نبضة واحدة تكفي 💙</p>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={onOpenPulseCheck}
            className="text-[11px] font-bold px-3 py-1.5 rounded-lg shrink-0 transition-all active:scale-95"
            style={{
              background: "rgba(45,212,191,0.15)",
              border: "1px solid rgba(45,212,191,0.3)",
              color: "rgba(45,212,191,0.9)",
            }}
          >
            سجّل نبضتي
          </button>

          {/* Dismiss */}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
