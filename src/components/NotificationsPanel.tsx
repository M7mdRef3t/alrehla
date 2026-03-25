import { memo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Bell, Award } from "lucide-react";
import { useAchievementState } from "../state/achievementState";
import { ACHIEVEMENTS } from "../data/achievements";

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** anchor ref — لو حابب تعرف مكان الزر */
  anchorRef?: React.RefObject<HTMLButtonElement | null>;
}

export const NotificationsPanel = memo(function NotificationsPanel({
  isOpen,
  onClose,
}: NotificationsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Real data from achievement state
  const unlockedIds        = useAchievementState((s) => s.unlockedIds);
  const totalPoints        = useAchievementState((s) => s.totalPoints);
  const lastNewId          = useAchievementState((s) => s.lastNewAchievementId);
  const clearLastNew       = useAchievementState((s) => s.clearLastNew);

  // Build notifications list: unlocked achievements in reverse order (newest first)
  const notifications = [...unlockedIds]
    .reverse()
    .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
    .filter(Boolean)
    .slice(0, 10) as typeof ACHIEVEMENTS;

  const isEmpty = notifications.length === 0;

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Clear badge when panel opens
  useEffect(() => {
    if (isOpen && lastNewId) {
      clearLastNew();
    }
  }, [isOpen, lastNewId, clearLastNew]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          key="notifications-panel"
          role="dialog"
          aria-label="الإشعارات"
          dir="rtl"
          initial={{ opacity: 0, y: -12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-0 top-12 w-80 z-50 rounded-2xl overflow-hidden
                     bg-slate-900/95 backdrop-blur-xl border border-white/10
                     shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-teal-400" />
              <h2 className="text-sm font-bold text-white">الإشعارات</h2>
              {unlockedIds.length > 0 && (
                <span className="text-[10px] text-slate-400">
                  {unlockedIds.length} إنجاز
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="w-7 h-7 rounded-full flex items-center justify-center
                         text-slate-500 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Points summary ── */}
          {totalPoints > 0 && (
            <div className="px-4 py-2.5 bg-teal-500/[0.07] border-b border-teal-500/20">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-teal-400 shrink-0" />
                <p className="text-xs text-teal-300 font-medium">
                  مجموع نقاطك: <span className="font-bold text-teal-200">{totalPoints} نقطة</span>
                </p>
              </div>
            </div>
          )}

          {/* ── List ── */}
          <div className="max-h-80 overflow-y-auto overscroll-contain">
            {isEmpty ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center gap-3 px-4 py-8 text-center">
                <span className="text-3xl">🔔</span>
                <p className="text-slate-400 text-sm leading-relaxed">
                  ما في إشعارات بعد.
                  <br />
                  كمّل رحلتك وافتح إنجازات!
                </p>
              </div>
            ) : (
              <ul className="flex flex-col divide-y divide-white/[0.05]">
                {notifications.map((a, i) => {
                  const isLatest = a.id === unlockedIds[unlockedIds.length - 1];
                  return (
                    <motion.li
                      key={a.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.25 }}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
                    >
                      {/* Icon */}
                      <span className="text-xl shrink-0 mt-0.5">{a.icon}</span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white truncate">{a.title}</p>
                          {isLatest && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-teal-500/20
                                             text-teal-400 text-[9px] font-bold">
                              جديد
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mt-0.5 line-clamp-2">
                          {a.hint}
                        </p>
                      </div>

                      {/* Trophy */}
                      <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-1" />
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* ── Footer ── */}
          {!isEmpty && (
            <div className="px-4 py-2.5 border-t border-white/[0.06]">
              <p className="text-center text-[11px] text-slate-500">
                {unlockedIds.length} من {ACHIEVEMENTS.length} إنجاز مفتوح
              </p>
              {/* Progress bar */}
              <div className="mt-1.5 h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: unlockedIds.length / ACHIEVEMENTS.length }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  style={{ transformOrigin: "right" }}
                  className="h-full bg-gradient-to-l from-teal-400 to-emerald-500 rounded-full"
                />
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});
