/**
 * صدى — Sada: محرك التنبيهات الذكية
 *
 * المنصة تتكلم معاك — مش بس تستناك:
 * - Smart Nudge Generator — يقرأ من كل المصادر
 * - Nudge Feed — timeline تنبيهات
 * - Morning Brief — ملخص صباحي
 * - Celebrations — احتفالات تلقائية
 * - Settings — تحكم في كل نوع
 */

import type { FC } from "react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellOff, Sun, Moon, AlertTriangle, TrendingUp,
  Flame, Heart, Compass, Sparkles, Settings, Trash2,
  Check, CheckCheck, ChevronLeft, X, Volume2, VolumeX,
} from "lucide-react";
import { useSadaState, type NudgeType } from "./store/sada.store";
import { usePulseState } from "@/domains/consciousness/store/pulse.store";
import { useGamificationState } from "@/domains/gamification/store/gamification.store";
import { useWirdState } from "@/modules/wird/store/wird.store";
import { useBawsalaState } from "@/modules/bawsala/store/bawsala.store";
import { useNadhirState } from "@/modules/nadhir/store/nadhir.store";

/* ═══════════════════════════════════════════ */
/*               CONSTANTS                    */
/* ═══════════════════════════════════════════ */

type ViewMode = "feed" | "settings";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const PRIORITY_STYLES = {
  high: { bg: "rgba(239,68,68,0.05)", border: "rgba(239,68,68,0.1)", dot: "#ef4444" },
  medium: { bg: "rgba(251,191,36,0.04)", border: "rgba(251,191,36,0.08)", dot: "#fbbf24" },
  low: { bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.04)", dot: "#64748b" },
};

/* ═══════════════════════════════════════════ */
/*         NUDGE GENERATOR HOOK               */
/* ═══════════════════════════════════════════ */

function useNudgeGenerator() {
  const { addNudge, preferences, lastGeneratedDate, setLastGeneratedDate, nudges } = useSadaState();
  const rawLogs = usePulseState((s) => s.logs);
  const logs = useMemo(() => rawLogs ?? [], [rawLogs]);
  const { badges, streak: gameStreak, level } = useGamificationState();
  const wirdState = useWirdState();
  const { decisions } = useBawsalaState();
  const { safeContacts } = useNadhirState();

  const isEnabled = useCallback((type: NudgeType) => preferences.find((p) => p.type === type)?.enabled ?? true, [preferences]);

  useEffect(() => {
    const key = todayKey();
    if (lastGeneratedDate === key) return;

    const newNudges: Parameters<typeof addNudge>[0][] = [];
    const now = new Date();
    const hour = now.getHours();

    // ── Morning Brief (6am-11am) ──
    if (hour >= 6 && hour <= 11 && isEnabled("morning_brief")) {
      const wirdEnabled = wirdState.rituals.filter((r) => r.enabled).length;
      const todayLogs = logs.filter((l) => new Date(l.timestamp).toDateString() === now.toDateString());

      newNudges.push({
        type: "morning_brief",
        emoji: "🌅",
        title: "صباح الخير — ملخصك",
        message: todayLogs.length > 0
          ? `سجّلت ${todayLogs.length} نبضة اليوم. وِردك فيه ${wirdEnabled} طقس ينتظرك.`
          : `يوم جديد. عندك ${wirdEnabled} طقس في الوِرد — ابدأ بالنبضة الأولى.`,
        action: { label: "ابدأ يومك", route: "wird" },
        priority: "medium",
      });
    }

    // ── Energy Alert ──
    if (isEnabled("energy_alert")) {
      const recent = logs.filter((l) => Date.now() - l.timestamp < 72 * 3600000);
      if (recent.length >= 3) {
        const avgEnergy = recent.reduce((s, l) => s + l.energy, 0) / recent.length;
        if (avgEnergy < 4) {
          newNudges.push({
            type: "energy_alert",
            emoji: "⚡",
            title: "طاقتك تحتاج اهتمام",
            message: `متوسط طاقتك الأخير ${avgEnergy.toFixed(1)}/10 — خذ وقت لنفسك واستخدم أدوات نذير.`,
            action: { label: "تنفّس", route: "nadhir" },
            priority: "high",
          });
        }
      }
    }

    // ── Pattern Alert (negative mood streak) ──
    if (isEnabled("pattern_alert")) {
      const last5 = logs.slice(0, 5);
      const negativeMoods = ["angry", "overwhelmed", "sad", "tense", "anxious"];
      const negativeCount = last5.filter((l) => negativeMoods.includes(l.mood)).length;
      if (negativeCount >= 3) {
        newNudges.push({
          type: "pattern_alert",
          emoji: "⚠️",
          title: "نمط ملفت في مزاجك",
          message: `${negativeCount} من آخر 5 نبضات كانت مشاعر صعبة — توقّف وراجع رحلتك.`,
          action: { label: "راجع", route: "riwaya" },
          priority: "high",
        });
      }
    }

    // ── Streak Warning ──
    if (isEnabled("streak_warning") && wirdState.streak > 0) {
      const wirdToday = wirdState.getTodayCompletion();
      const wirdEnabled = wirdState.rituals.filter((r) => r.enabled).length;
      if (wirdToday.completedRituals.length === 0 && wirdEnabled > 0 && hour >= 18) {
        newNudges.push({
          type: "streak_warning",
          emoji: "🔥",
          title: `Streak ${wirdState.streak} في خطر!`,
          message: `لم تكمل أي طقس اليوم — كمّل واحد على الأقل للحفاظ على streak.`,
          action: { label: "أنقذ الـ streak", route: "wird" },
          priority: "high",
        });
      }
    }

    // ── Celebrations ──
    if (isEnabled("celebration")) {
      if (wirdState.streak === 7 || wirdState.streak === 14 || wirdState.streak === 30 || wirdState.streak === 60 || wirdState.streak === 100) {
        newNudges.push({
          type: "celebration",
          emoji: "🎉",
          title: `${wirdState.streak} يوم streak! 🏆`,
          message: `ثباتك مذهل — ${wirdState.streak} يوم متواصل في الوِرد. فخور فيك!`,
          priority: "low",
        });
      }

      if (badges.length > 0) {
        const lastBadge = badges[badges.length - 1];
        const badgeName = lastBadge.id ?? "جديد";
        const alreadyCelebrated = nudges.some((n) => n.type === "celebration" && n.message.includes(badgeName));
        if (!alreadyCelebrated) {
          newNudges.push({
            type: "celebration",
            emoji: "🏅",
            title: "وسام جديد!",
            message: `حصلت على وسام "${badgeName}" — كل خطوة تحسب.`,
            priority: "low",
          });
        }
      }
    }

    // ── Follow Up on Decisions ──
    if (isEnabled("follow_up")) {
      const weekOldDecisions = decisions.filter(
        (d) => d.status === "decided" && Date.now() - d.createdAt > 7 * 24 * 3600000
      );
      if (weekOldDecisions.length > 0) {
        newNudges.push({
          type: "follow_up",
          emoji: "🧭",
          title: "متابعة قراراتك",
          message: `عندك ${weekOldDecisions.length} قرار مر عليه أسبوع — كيف ماشي الحال؟`,
          action: { label: "راجع", route: "bawsala" },
          priority: "medium",
        });
      }
    }

    // ── Care Nudge (no pulse in 2 days) ──
    if (isEnabled("care_nudge") && logs.length > 0) {
      const lastLog = logs[0];
      const daysSince = (Date.now() - lastLog.timestamp) / (24 * 3600000);
      if (daysSince >= 2) {
        newNudges.push({
          type: "care_nudge",
          emoji: "💚",
          title: "وحشتنا",
          message: `مرّ ${Math.floor(daysSince)} يوم بدون نبضة — كيف حالك؟ مجرد تسجيل بسيط.`,
          action: { label: "سجّل نبضة", route: "pulse" },
          priority: "medium",
        });
      }
    }

    // ── Weekly Digest (Fridays) ──
    if (isEnabled("weekly_digest") && now.getDay() === wirdState.streak) {
      const weekLogs = logs.filter((l) => Date.now() - l.timestamp < 7 * 24 * 3600000);
      if (weekLogs.length > 0) {
        const avgE = (weekLogs.reduce((s, l) => s + l.energy, 0) / weekLogs.length).toFixed(1);
        newNudges.push({
          type: "weekly_digest",
          emoji: "📊",
          title: "ملخصك الأسبوعي",
          message: `هالأسبوع: ${weekLogs.length} نبضة · متوسط طاقة ${avgE}/10 · streak: ${wirdState.streak} يوم`,
          action: { label: "تفاصيل", route: "markaz" },
          priority: "low",
        });
      }
    }

    // Dispatch all
    if (newNudges.length > 0) {
      newNudges.forEach((n) => addNudge(n));
      setLastGeneratedDate(key);
    }
  }, [lastGeneratedDate, addNudge, isEnabled, wirdState, logs, badges, decisions, nudges, setLastGeneratedDate]);
}

/* ═══════════════════════════════════════════ */
/*              MAIN COMPONENT                */
/* ═══════════════════════════════════════════ */

export const SadaScreen: FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("feed");
  const {
    nudges, preferences,
    markRead, markAllRead, clearNudge, clearAll,
    togglePreference, getUnreadCount,
  } = useSadaState();

  // Generate nudges on mount
  useNudgeGenerator();

  const unreadCount = getUnreadCount();
  const navigate = (route: string) => { window.location.hash = route; };

  const groupedNudges = useMemo(() => {
    const today: typeof nudges = [];
    const earlier: typeof nudges = [];
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    nudges.forEach((n) => {
      if (n.timestamp >= todayStart.getTime()) today.push(n);
      else earlier.push(n);
    });
    return { today, earlier };
  }, [nudges]);

  const renderNudge = (nudge: typeof nudges[0]) => {
    const style = PRIORITY_STYLES[nudge.priority];
    return (
      <motion.div key={nudge.id}
        layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10, height: 0 }}
        className="p-4 rounded-xl relative"
        style={{
          background: style.bg,
          border: `1px solid ${style.border}`,
          opacity: nudge.read ? 0.5 : 1,
        }}
      >
        {/* Unread dot */}
        {!nudge.read && (
          <div className="absolute top-3 left-3 w-2 h-2 rounded-full"
            style={{ background: style.dot, boxShadow: `0 0 4px ${style.dot}40` }}
          />
        )}

        <div className="flex items-start gap-3">
          <span className="text-lg mt-0.5">{nudge.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">{nudge.title}</p>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{nudge.message}</p>

            {/* Action + Meta */}
            <div className="flex items-center gap-2 mt-2">
              {nudge.action && (
                <button onClick={() => { markRead(nudge.id); navigate(nudge.action!.route); }}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95"
                  style={{ background: `${style.dot}15`, color: style.dot, border: `1px solid ${style.dot}20` }}
                >
                  {nudge.action.label}
                </button>
              )}
              <span className="text-[8px] text-slate-600 mr-auto">
                {formatTime(nudge.timestamp)}
              </span>
              {!nudge.read && (
                <button onClick={() => markRead(nudge.id)} className="p-1 opacity-30 hover:opacity-60">
                  <Check className="w-3 h-3 text-slate-400" />
                </button>
              )}
              <button onClick={() => clearNudge(nudge.id)} className="p-1 opacity-20 hover:opacity-50">
                <X className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen pb-32 select-none" dir="rtl"
      style={{ background: "linear-gradient(180deg, #080a14 0%, #0c1020 40%, #080a18 100%)" }}
    >
      {/* ═══ Header ═══ */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center relative"
              style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.25)" }}
            >
              <Bell className="w-6 h-6 text-cyan-400" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-[9px] font-black text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">صدى</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {unreadCount > 0 ? `${unreadCount} تنبيه جديد` : "كل شيء مقروء"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="p-2 rounded-xl transition-all active:scale-95"
                style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.12)" }}
              >
                <CheckCheck className="w-4 h-4 text-cyan-400" />
              </button>
            )}
            <button onClick={() => setViewMode(viewMode === "feed" ? "settings" : "feed")}
              className="p-2 rounded-xl transition-all active:scale-95"
              style={{
                background: viewMode === "settings" ? "rgba(6,182,212,0.12)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${viewMode === "settings" ? "rgba(6,182,212,0.2)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              <Settings className="w-4 h-4" style={{ color: viewMode === "settings" ? "#06b6d4" : "#64748b" }} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ═══ Feed View ═══ */}
      {viewMode === "feed" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-4">
          {nudges.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <Bell className="w-10 h-10 text-cyan-400/10 mx-auto" />
              <p className="text-sm text-slate-500 font-bold">لا توجد تنبيهات</p>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                صدى يراقب بياناتك ويرسلك تنبيهات ذكية —
                <br />
                سجّل نبضات وطقوس عشان يبدأ يشتغل.
              </p>
            </div>
          ) : (
            <>
              {/* Today */}
              {groupedNudges.today.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] text-cyan-400/50 font-bold flex items-center gap-1">
                    <Sun className="w-3 h-3" /> اليوم
                  </p>
                  <AnimatePresence>
                    {groupedNudges.today.map(renderNudge)}
                  </AnimatePresence>
                </div>
              )}

              {/* Earlier */}
              {groupedNudges.earlier.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                    <Moon className="w-3 h-3" /> سابقاً
                  </p>
                  <AnimatePresence>
                    {groupedNudges.earlier.map(renderNudge)}
                  </AnimatePresence>
                </div>
              )}

              {/* Clear All */}
              {nudges.length > 3 && (
                <button onClick={clearAll}
                  className="w-full py-2.5 rounded-xl text-[10px] font-bold text-slate-600 hover:text-slate-400 transition-all"
                >
                  مسح الكل
                </button>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* ═══ Settings View ═══ */}
      {viewMode === "settings" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 space-y-2">
          <p className="text-[10px] text-slate-500 font-bold mb-3">تحكّم في أنواع التنبيهات</p>

          {preferences.map((pref) => (
            <button key={pref.type} onClick={() => togglePreference(pref.type)}
              className="w-full p-3.5 rounded-xl flex items-center gap-3 transition-all text-right"
              style={{
                background: pref.enabled ? "rgba(6,182,212,0.04)" : "rgba(255,255,255,0.01)",
                border: `1px solid ${pref.enabled ? "rgba(6,182,212,0.08)" : "rgba(255,255,255,0.03)"}`,
              }}
            >
              <span className="text-lg">{pref.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${pref.enabled ? "text-white" : "text-slate-600"}`}>{pref.label}</p>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-all ${pref.enabled ? "bg-cyan-500/20" : "bg-white/5"}`}>
                <motion.div animate={{ x: pref.enabled ? 0 : 20 }}
                  className="absolute top-0.5 w-4 h-4 rounded-full"
                  style={{ background: pref.enabled ? "#06b6d4" : "#334155", right: pref.enabled ? 1 : undefined, left: pref.enabled ? undefined : 1 }}
                />
              </div>
            </button>
          ))}

          {/* Info */}
          <div className="p-4 rounded-xl mt-4"
            style={{ background: "rgba(6,182,212,0.03)", border: "1px solid rgba(6,182,212,0.06)" }}
          >
            <p className="text-[10px] text-slate-500 leading-relaxed">
              صدى يحلّل بياناتك يومياً ويرسلك تنبيهات مخصصة.
              <br />
              التنبيهات تُولّد مرة واحدة يومياً عند فتح التطبيق.
            </p>
          </div>
        </motion.div>
      )}

      {/* ═══ Footer ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="mx-5 mt-8 p-4 rounded-2xl text-center"
        style={{ background: "rgba(6,182,212,0.03)", border: "1px solid rgba(6,182,212,0.06)" }}
      >
        <Bell className="w-5 h-5 text-cyan-400/20 mx-auto mb-2" />
        <p className="text-[10px] text-slate-600 leading-relaxed max-w-xs mx-auto">
          صدى يسمعك حتى لما تنسى تفتح.
          <br />
          كل تنبيه مبني على بياناتك الحقيقية — مش عشوائي.
        </p>
      </motion.div>
    </div>
  );
};

/* ═══════════════════════════════════════════ */
/*               HELPERS                      */
/* ═══════════════════════════════════════════ */

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return "الآن";
  if (diff < 3600000) return `منذ ${Math.floor(diff / 60000)} دقيقة`;
  if (diff < 86400000) return `منذ ${Math.floor(diff / 3600000)} ساعة`;
  return `منذ ${Math.floor(diff / 86400000)} يوم`;
}

export default SadaScreen;
