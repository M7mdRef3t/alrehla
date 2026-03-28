/**
 * NotificationCenter — لوحة الإشعارات الذكية
 * Wraps the existing Web Notification API + adds beautiful in-app feed
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellOff, X, Check, Zap, Trophy,
  Flame, Clock, BookOpen, CheckCircle2, Info,
  Video, PencilLine, Ban
} from "lucide-react";
import { assignUrl } from "../services/navigation";
import { useNotificationState } from "../state/notificationState";
import { useAchievementState } from "../state/achievementState";
import { useGamificationState } from "../services/gamificationEngine";

/* ══════════════════════════════════════════
   Types
   ══════════════════════════════════════════ */

type NotifType = "achievement" | "xp" | "reminder" | "appointment" | "streak" | "course" | "info";

interface InAppNotif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  timestamp: number;
  read: boolean;
  icon?: string;
  meta?: {
    consultant?: string;
    startsIn?: string;
    sessionTime?: string;
    joinUrl?: string;
    editUrl?: string;
    cancelUrl?: string;
  };
}

const LS_KEY = "alrehla_notif_feed";

const TYPE_CONFIG: Record<NotifType, { icon: typeof Bell; color: string; bg: string }> = {
  achievement: { icon: Trophy,      color: "#FBBF24", bg: "rgba(251,191,36,0.12)" },
  xp:          { icon: Zap,         color: "#A78BFA", bg: "rgba(167,139,250,0.12)" },
  reminder:    { icon: Clock,       color: "#06B6D4", bg: "rgba(6,182,212,0.12)" },
  appointment: { icon: Video,       color: "#67e8f9", bg: "rgba(103,232,249,0.10)" },
  streak:      { icon: Flame,       color: "#F97316", bg: "rgba(249,115,22,0.12)" },
  course:      { icon: BookOpen,    color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  info:        { icon: Info,        color: "#64748b", bg: "rgba(100,116,139,0.12)" },
};

/* ══════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════ */

function loadFeed(): InAppNotif[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as InAppNotif[]; }
  catch { return []; }
}
function saveFeed(feed: InAppNotif[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(feed.slice(0, 50))); } catch { /* noop */ }
}
function relTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "الآن";
  if (diff < 3_600_000) return `منذ ${Math.floor(diff / 60_000)} دقيقة`;
  if (diff < 86_400_000) return `منذ ${Math.floor(diff / 3_600_000)} ساعة`;
  return `منذ ${Math.floor(diff / 86_400_000)} يوم`;
}

/* ══════════════════════════════════════════
   Notification Bell Button
   ══════════════════════════════════════════ */

interface BellButtonProps {
  unread: number;
  onClick: () => void;
}

export function NotificationBell({ unread, onClick }: BellButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      style={{
        position: "relative", background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 14, padding: "8px 10px",
        cursor: "pointer", display: "flex", alignItems: "center",
        color: unread > 0 ? "#FBBF24" : "#64748b",
      }}
      aria-label="الإشعارات"
    >
      {unread > 0 ? <Bell size={18} /> : <Bell size={18} />}
      {unread > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{
            position: "absolute", top: -4, right: -4,
            background: "#EF4444", borderRadius: "50%",
            width: 16, height: 16,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 900, color: "#fff",
          }}
        >
          {unread > 9 ? "9+" : unread}
        </motion.span>
      )}
    </motion.button>
  );
}

/* ══════════════════════════════════════════
   Individual Notification Card
   ══════════════════════════════════════════ */

function NotifCard({ notif, onDismiss, onRead }: {
  notif: InAppNotif;
  onDismiss: (id: string) => void;
  onRead: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[notif.type];
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.95 }}
      onClick={() => onRead(notif.id)}
      style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        padding: "12px 14px", borderRadius: 14, marginBottom: 8,
        background: notif.read ? "rgba(255,255,255,0.02)" : cfg.bg,
        border: `1px solid ${notif.read ? "rgba(255,255,255,0.05)" : cfg.color + "30"}`,
        cursor: "pointer", position: "relative",
      }}
    >
      {/* Type icon */}
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: `${cfg.color}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {notif.icon
          ? <span style={{ fontSize: 18 }}>{notif.icon}</span>
          : <Icon size={16} color={cfg.color} />}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: notif.read ? 600 : 800, color: "#e2e8f0" }}>
          {notif.title}
        </p>
        <p style={{ margin: "2px 0 4px", fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>
          {notif.body}
        </p>
        <p style={{ margin: 0, fontSize: 9, color: "#334155" }}>{relTime(notif.timestamp)}</p>
      </div>

      {/* Dismiss */}
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(notif.id); }}
        style={{
          background: "none", border: "none", cursor: "pointer",
          padding: 2, color: "#334155", flexShrink: 0,
          display: "flex", alignItems: "center",
        }}
      >
        <X size={12} />
      </button>

      {/* Unread dot */}
      {!notif.read && (
        <div style={{
          position: "absolute", top: 10, left: 10,
          width: 6, height: 6, borderRadius: "50%", background: cfg.color,
        }} />
      )}
    </motion.div>
  );
}

function AppointmentReminderCard({
  notif,
  onDismiss,
  onRead,
}: {
  notif: InAppNotif;
  onDismiss: (id: string) => void;
  onRead: (id: string) => void;
}) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const startsIn = notif.meta?.startsIn ?? "Starting in 10 minutes";
  const consultant = notif.meta?.consultant ?? "Dr. Sarah Al-Farsi";
  const sessionTime = notif.meta?.sessionTime ?? "02:00 PM";
  const joinUrl = notif.meta?.joinUrl ?? "/dawayir-live";
  const editUrl = notif.meta?.editUrl ?? "/dawayir-live/book";
  const cancelUrl = notif.meta?.cancelUrl ?? "/dawayir-live/book";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.95 }}
      onClick={() => onRead(notif.id)}
      style={{
        padding: 14,
        borderRadius: 18,
        marginBottom: 10,
        background: "linear-gradient(180deg, rgba(103,232,249,0.10), rgba(8,11,21,0.90))",
        border: "1px solid rgba(103,232,249,0.16)",
        boxShadow: "0 16px 34px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.05)",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 20% 0%, rgba(103,232,249,0.12), transparent 35%), radial-gradient(circle at 80% 100%, rgba(168,85,247,0.10), transparent 38%)", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: "rgba(103,232,249,0.12)",
              border: "1px solid rgba(103,232,249,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px rgba(103,232,249,0.12)",
            }}>
              <Video size={16} color="#bff8ff" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "#7dd3fc", fontWeight: 800 }}>Ethereal Insight</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#eef7ff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {consultant}
              </div>
            </div>
          </div>
          <span style={{
            padding: "6px 10px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#cbd5e1",
            fontSize: 10,
            fontWeight: 800,
          }}>
            NOW
          </span>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 28, lineHeight: 1.05, fontWeight: 900, letterSpacing: "-0.04em", color: "#e2f0ff" }}>
            {consultant}
          </div>
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, color: "#c7d2fe", fontSize: 13 }}>
            <Clock size={14} />
            <span>{startsIn} ({sessionTime})</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={(e) => {
              e.stopPropagation();
              onRead(notif.id);
              assignUrl(joinUrl);
            }}
            style={{
              flex: 1,
              minHeight: 56,
              borderRadius: 18,
              border: "1px solid rgba(191,248,255,0.22)",
              background: "linear-gradient(135deg, #bff8ff, #81e6ff)",
              color: "#0d3b44",
              fontWeight: 900,
              fontSize: 16,
              boxShadow: "0 14px 30px rgba(110,231,249,0.20)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Video size={16} />
            Join Now
          </motion.button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={(e) => {
              e.stopPropagation();
              assignUrl(editUrl);
            }}
            style={{
              minHeight: 46,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.045)",
              color: "#d1d9e6",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <PencilLine size={14} />
            Edit
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(notif.id);
            }}
            style={{
              minHeight: 46,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.045)",
              color: "#d1d9e6",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            Dismiss
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={(e) => {
              e.stopPropagation();
              if (!confirmCancel) {
                setConfirmCancel(true);
                return;
              }
              assignUrl(cancelUrl);
              onDismiss(notif.id);
            }}
            style={{
              minHeight: 46,
              borderRadius: 14,
              border: confirmCancel ? "1px solid rgba(248,113,113,0.34)" : "1px solid rgba(255,255,255,0.08)",
              background: confirmCancel ? "rgba(248,113,113,0.10)" : "rgba(255,255,255,0.045)",
              color: confirmCancel ? "#fecaca" : "#d1d9e6",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Ban size={14} />
            {confirmCancel ? "Confirm Cancel" : "Cancel"}
          </motion.button>
        </div>

        {confirmCancel && (
          <div style={{
            marginTop: 10,
            padding: "10px 12px",
            borderRadius: 14,
            border: "1px solid rgba(248,113,113,0.18)",
            background: "rgba(248,113,113,0.08)",
            color: "#fecaca",
            fontSize: 12,
            lineHeight: 1.6,
          }}>
            Press Cancel again to confirm. We will keep your booking safe until you finish.
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Main NotificationCenter Panel
   ══════════════════════════════════════════ */

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: Props) {
  const [feed, setFeed] = useState<InAppNotif[]>(() => loadFeed());
  const { permission, requestPermission, isLoading } = useNotificationState();
  const unlockedCount = useAchievementState((s) => s.unlockedIds.length);
  const { level, xp } = useGamificationState();

  // Inject seed notifications on first open
  useEffect(() => {
    if (!isOpen) return;
    const existing = loadFeed();
    if (existing.length > 0) { setFeed(existing); return; }

    const seed: InAppNotif[] = [
      {
        id: "seed-appointment",
        type: "appointment",
        title: "Your next session is almost here",
        body: "Starting in 10 minutes with Dr. Sarah Al-Farsi.",
        timestamp: Date.now() - 90_000,
        read: false,
        meta: {
          consultant: "Dr. Sarah Al-Farsi",
          startsIn: "Starting in 10 minutes",
          sessionTime: "02:00 PM",
          joinUrl: "/dawayir-live",
          editUrl: "/dawayir-live/book",
          cancelUrl: "/dawayir-live/book",
        },
      },
      {
        id: "seed-welcome",
        type: "info",
        title: "مرحباً في مركز الإشعارات 🔔",
        body: "ستتلقى هنا تنبيهات عن إنجازاتك والخطوات القادمة في رحلتك.",
        timestamp: Date.now() - 60_000,
        read: false,
      },
      {
        id: "seed-streak",
        type: "streak",
        title: "استمر في تسلسلك! 🔥",
        body: "لا تكسر سلسلة أيامك — سجّل نبضة اليوم الآن.",
        timestamp: Date.now() - 3_600_000,
        read: false,
      },
    ];

    if (unlockedCount > 0) {
      seed.unshift({
        id: "seed-achievement",
        type: "achievement",
        title: `لديك ${unlockedCount} إنجاز مفتوح 🏆`,
        body: "تحقق من صفحة الإنجازات لمشاهدة ما حققته.",
        timestamp: Date.now() - 1_800_000,
        read: false,
        icon: "🏆",
      });
    }

    if (xp > 0) {
      seed.splice(1, 0, {
        id: "seed-xp",
        type: "xp",
        title: `لديك ${xp} نقطة خبرة! ⚡`,
        body: `أنت في المستوى ${level} — استمر لتصعد أعلى.`,
        timestamp: Date.now() - 7_200_000,
        read: false,
        icon: "⚡",
      });
    }

    setFeed(seed);
    saveFeed(seed);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const unread = feed.filter(n => !n.read).length;

  const dismiss = useCallback((id: string) => {
    setFeed(prev => {
      const next = prev.filter(n => n.id !== id);
      saveFeed(next);
      return next;
    });
  }, []);

  const markRead = useCallback((id: string) => {
    setFeed(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
      saveFeed(next);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setFeed(prev => {
      const next = prev.map(n => ({ ...n, read: true }));
      saveFeed(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setFeed([]);
    saveFeed([]);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 8000, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
          />

          {/* Panel */}
          <motion.div
            dir="rtl"
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            style={{
              position: "fixed", top: 60, right: 16, zIndex: 8001,
              width: "min(400px, calc(100vw - 32px))",
              background: "rgba(8,11,21,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20, overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
              backdropFilter: "blur(20px)",
              maxHeight: "80vh", display: "flex", flexDirection: "column",
            }}
          >
            {/* Header */}
            <div style={{
              padding: "14px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "linear-gradient(135deg, rgba(251,191,36,0.06), transparent)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Bell size={18} color="#FBBF24" />
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#e2e8f0" }}>الإشعارات</h2>
                {unread > 0 && (
                  <span style={{
                    background: "#EF4444", borderRadius: 20,
                    padding: "1px 7px", fontSize: 9, fontWeight: 900, color: "#fff",
                  }}>{unread}</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {unread > 0 && (
                  <button onClick={markAllRead} style={{
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10, padding: "4px 10px", cursor: "pointer",
                    fontSize: 10, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <CheckCircle2 size={11} /> قرأت الكل
                  </button>
                )}
                {feed.length > 0 && (
                  <button onClick={clearAll} style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 10, color: "#334155",
                  }}>
                    مسح الكل
                  </button>
                )}
                <button onClick={onClose} style={{
                  background: "none", border: "none", cursor: "pointer", color: "#475569",
                  display: "flex", alignItems: "center",
                }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Push Permission Banner */}
            {permission !== "granted" && (
              <div style={{
                padding: "10px 16px",
                background: "rgba(6,182,212,0.06)",
                borderBottom: "1px solid rgba(6,182,212,0.15)",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <BellOff size={14} color="#06B6D4" />
                <p style={{ margin: 0, fontSize: 11, color: "#7dd3fc", flex: 1 }}>
                  فعّل إشعارات المتصفح لتلقي تنبيهات حتى وأنت خارج التطبيق
                </p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => void requestPermission()}
                  disabled={isLoading}
                  style={{
                    background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)",
                    borderRadius: 10, padding: "5px 12px",
                    color: "#06B6D4", fontSize: 10, fontWeight: 700, cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  {isLoading ? "..." : "تفعيل"}
                </motion.button>
              </div>
            )}
            {permission === "granted" && (
              <div style={{ padding: "6px 16px", background: "rgba(16,185,129,0.05)", borderBottom: "1px solid rgba(16,185,129,0.1)", display: "flex", alignItems: "center", gap: 6 }}>
                <Check size={12} color="#10B981" />
                <p style={{ margin: 0, fontSize: 10, color: "#10B981" }}>إشعارات المتصفح مفعّلة ✓</p>
              </div>
            )}

            {/* Feed */}
            <div style={{ overflowY: "auto", flex: 1, padding: "12px 12px" }}>
              <AnimatePresence initial={false}>
                {feed.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ textAlign: "center", padding: "40px 0", color: "#334155" }}
                  >
                    <Bell size={32} color="#1e293b" style={{ marginBottom: 8 }} />
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>لا توجد إشعارات</p>
                    <p style={{ margin: "4px 0 0", fontSize: 10 }}>سيتم إشعارك عند حدوث تحديثات مهمة</p>
                  </motion.div>
                ) : (
                  feed.map((notif) =>
                    notif.type === "appointment" ? (
                      <AppointmentReminderCard
                        key={notif.id}
                        notif={notif}
                        onDismiss={dismiss}
                        onRead={markRead}
                      />
                    ) : (
                      <NotifCard
                        key={notif.id}
                        notif={notif}
                        onDismiss={dismiss}
                        onRead={markRead}
                      />
                    )
                  )
                )}
              </AnimatePresence>
            </div>

            {/* Footer hint */}
            <div style={{ padding: "8px 16px", borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 9, color: "#1e293b" }}>
                الإشعارات تُحفظ على جهازك فقط
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════
   Public helper to push a new in-app notif
   ══════════════════════════════════════════ */

// eslint-disable-next-line react-refresh/only-export-components
export function pushInAppNotification(notif: Omit<InAppNotif, "id" | "timestamp" | "read">) {
  const existing = loadFeed();
  const newNotif: InAppNotif = {
    ...notif,
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
    read: false,
  };
  const updated = [newNotif, ...existing].slice(0, 50);
  saveFeed(updated);
  // Also fire browser notification if permitted
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      new Notification(notif.title, {
        body: notif.body,
        icon: "/icon-192.png",
        tag: newNotif.id,
      });
    } catch { /* silent */ }
  }
}
