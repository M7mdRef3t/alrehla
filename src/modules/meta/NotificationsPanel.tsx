import { memo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Bell, Award, AlertCircle } from "lucide-react";
import { useAchievementState } from "@/domains/gamification/store/achievement.store";
import { useNotificationState } from "@/domains/notifications/store/notification.store";
import { ACHIEVEMENTS } from "@/data/achievements";
import { useMemo } from "react";

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  /** anchor ref — لو حابب تعرف مكان الزر */
  anchorRef?: React.RefObject<HTMLButtonElement | null>;
}

export const NotificationsPanel = memo(function NotificationsPanel({
  isOpen,
  onClose,
  anchorRef,
}: NotificationsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Real data from achievement state
  const unlockedIds        = useAchievementState((s) => s.unlockedIds);
  const totalPoints        = useAchievementState((s) => s.totalPoints);
  const lastNewId          = useAchievementState((s) => s.lastNewAchievementId);
  const clearLastNew       = useAchievementState((s) => s.clearLastNew);
  
  // Behavioral alerts from notification store
  const behavioralAlerts   = useNotificationState((s) => s.behavioralAlerts);
  const acknowledgeAlert   = useNotificationState((s) => s.acknowledgeBehavioralAlert);

  // Build notifications list: merged achievements and behavioral alerts
  const notifications = useMemo(() => {
    const achs = unlockedIds.flatMap((id) => {
      const found = ACHIEVEMENTS.find((a) => a.id === id);
      return found ? [{ ...found, type: 'achievement' as const, timestamp: Date.now() }] : [];
    });

    const alerts = behavioralAlerts.map(a => ({
      id: a.id,
      title: 'تنبيه سلوكي',
      hint: a.message,
      icon: '⚠️',
      type: 'alert' as const,
      timestamp: Date.now(), // ideally we use a real timestamp from DB
      is_read: a.is_read
    }));

    // Merge and sort (simple merge for now, prioritizing alerts)
    return [...alerts, ...achs].slice(0, 15);
  }, [unlockedIds, behavioralAlerts]);

  const isEmpty = notifications.length === 0;

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      // If clicking inside panel, do nothing
      if (panelRef.current && panelRef.current.contains(e.target as Node)) {
        return;
      }
      // If clicking the anchor (the bell button), let the button's own onClick handle it
      if (anchorRef?.current && anchorRef.current.contains(e.target as Node)) {
        return;
      }
      // Otherwise close
      onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose, anchorRef]);

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
    if (isOpen) {
      if (lastNewId) clearLastNew();
      // Optionally mark all behavioral alerts as read? 
      // User might want to click them individually.
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
          className="fixed inset-x-4 top-20 md:absolute md:left-0 md:right-auto md:top-12 md:w-80 z-50 rounded-2xl overflow-hidden
                     bg-[rgba(2,4,10,0.7)] backdrop-blur-3xl border border-white/10
                     shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
        >
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[var(--teal)] drop-shadow-[0_0_8px_var(--cyan-glow)]" />
              <h2 className="text-sm font-bold text-white">إشعارات الرحلة</h2>
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
            <div className="px-4 py-2.5 bg-[var(--cyan-glow)] border-b border-[var(--teal)]/20">
              <div className="flex items-center gap-2">
                < Award className="w-4 h-4 text-[var(--teal)] shrink-0" />
                <p className="text-xs text-[var(--teal)] font-medium">
                  مجموع نقاطك: <span className="font-bold text-white">{totalPoints} نقطة</span>
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
                {notifications.map((n, i) => {
                  const isAchievement = n.type === 'achievement';
                  const isUnreadAlert = !isAchievement && !n.is_read;
                  
                  return (
                    <motion.li
                      key={n.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.25 }}
                      onClick={() => {
                        if (!isAchievement) acknowledgeAlert(n.id);
                      }}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer ${isUnreadAlert ? 'bg-rose-500/[0.03]' : ''}`}
                    >
                      {/* Icon */}
                      <span className="text-xl shrink-0 mt-0.5">{n.icon}</span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-semibold truncate ${isUnreadAlert ? 'text-rose-400' : 'text-white'}`}>
                            {n.title}
                          </p>
                          {isUnreadAlert && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-rose-500/20
                                             text-rose-400 text-[9px] font-bold border border-rose-500/20">
                              جديد
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mt-0.5 line-clamp-2">
                          {n.hint}
                        </p>
                      </div>

                      {/* Side Icon */}
                      {isAchievement ? (
                        <Trophy className="w-3.5 h-3.5 text-[var(--gold)] shrink-0 mt-1" />
                      ) : (
                        <AlertCircle className={`w-3.5 h-3.5 shrink-0 mt-1 ${isUnreadAlert ? 'text-rose-400' : 'text-slate-500'}`} />
                      )}
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
                  className="h-full bg-gradient-to-l from-[var(--teal)] to-[var(--gold)] rounded-full"
                />
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});
