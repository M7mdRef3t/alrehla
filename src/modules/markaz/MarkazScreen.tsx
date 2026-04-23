/**
 * مركز — Markaz: غرفة القيادة
 *
 * Unified Command Center — aggregates all 17 products:
 * - Health Matrix with status dots
 * - Today's Summary
 * - Attention Queue
 * - Quick Actions
 * - Journey Map
 *
 * Sources: ALL stores
 */

import type { FC } from "react";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  LayoutGrid, Activity, Flame, Shield, BookOpen, Compass,
  Brain, FileText, Scale, Users, Eye, Wind, Map,
  Target, ChevronLeft, Zap, AlertTriangle, Heart,
  TrendingUp, CheckCircle, Clock, Star,
} from "lucide-react";
import { usePulseState } from "@/domains/consciousness/store/pulse.store";
import { useGamificationState } from "@/domains/gamification/store/gamification.store";
import { useDailyJournalState } from "@/domains/journey/store/journal.store";
import { useBawsalaState } from "@/modules/bawsala/store/bawsala.store";
import { useNadhirState } from "@/modules/nadhir/store/nadhir.store";
import { useWirdState } from "@/modules/wird/store/wird.store";

/* ═══════════════════════════════════════════ */
/*               TYPES                        */
/* ═══════════════════════════════════════════ */

type ProductStatus = "green" | "yellow" | "red" | "neutral";

interface ProductCard {
  id: string;
  name: string;
  emoji: string;
  icon: typeof Activity;
  status: ProductStatus;
  metric: string;
  detail: string;
  color: string;
  route: string;
}

interface AttentionItem {
  id: string;
  emoji: string;
  message: string;
  priority: "high" | "medium" | "low";
  action: string;
  route: string;
}

/* ═══════════════════════════════════════════ */
/*               HELPERS                      */
/* ═══════════════════════════════════════════ */

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const STATUS_COLORS: Record<ProductStatus, string> = {
  green: "#10b981",
  yellow: "#fbbf24",
  red: "#ef4444",
  neutral: "#64748b",
};

/* ═══════════════════════════════════════════ */
/*              MAIN COMPONENT                */
/* ═══════════════════════════════════════════ */

export const MarkazScreen: FC = () => {
  // ── All Data Sources ──
  const rawLogs = usePulseState((s) => s.logs);
  const logs = useMemo(() => rawLogs ?? [], [rawLogs]);
  const { badges, streak, level, xp } = useGamificationState();
  const rawJournalEntries = useDailyJournalState((s) => s.entries);
  const journalEntries = useMemo(() => rawJournalEntries ?? [], [rawJournalEntries]);
  const { decisions } = useBawsalaState();
  const { crisisHistory, safeContacts, safetyPlan } = useNadhirState();
  const wirdState = useWirdState();

  // ── Computed Metrics ──
  const recentLogs = useMemo(() => logs.filter((l) => Date.now() - l.timestamp < 48 * 3600000), [logs]);
  const avgEnergy = useMemo(() => {
    if (recentLogs.length === 0) return 0;
    return Math.round((recentLogs.reduce((s, l) => s + l.energy, 0) / recentLogs.length) * 10) / 10;
  }, [recentLogs]);

  const wirdToday = useMemo(() => wirdState.getTodayCompletion(), [wirdState]);
  const wirdEnabled = useMemo(() => wirdState.rituals.filter((r) => r.enabled).length, [wirdState.rituals]);
  const wirdProgress = wirdEnabled > 0 ? Math.round((wirdToday.completedRituals.length / wirdEnabled) * 100) : 0;

  const activeDecisions = useMemo(() => decisions.filter((d) => d.status === "active").length, [decisions]);
  const totalJournals = useMemo(() => journalEntries.filter((e) => e.answer?.length > 0).length, [journalEntries]);

  // ── Product Health Matrix ──
  const products = useMemo<ProductCard[]>(() => [
    {
      id: "pulse", name: "نبض", emoji: "💓", icon: Activity,
      status: recentLogs.length > 0 ? (avgEnergy >= 6 ? "green" : avgEnergy >= 3 ? "yellow" : "red") : "neutral",
      metric: recentLogs.length > 0 ? `${avgEnergy}/10` : "—",
      detail: `${recentLogs.length} نبضة`, color: "#ef4444", route: "/#pulse",
    },
    {
      id: "wird", name: "وِرد", emoji: "🔥", icon: Flame,
      status: wirdProgress >= 80 ? "green" : wirdProgress >= 30 ? "yellow" : wirdProgress > 0 ? "red" : "neutral",
      metric: `${wirdProgress}%`, detail: `streak: ${wirdState.streak}`,
      color: "#fbbf24", route: "/#wird",
    },
    {
      id: "gamification", name: "أوسمة", emoji: "🏅", icon: Star,
      status: badges.length > 0 ? "green" : "neutral",
      metric: `Lv ${level}`, detail: `${badges.length} وسام`,
      color: "#a855f7", route: "/#home",
    },
    {
      id: "watheeqa", name: "وثيقة", emoji: "📝", icon: FileText,
      status: totalJournals > 0 ? "green" : "neutral",
      metric: `${totalJournals}`, detail: "تدوينة",
      color: "#f97316", route: "/#watheeqa",
    },
    {
      id: "bawsala", name: "بوصلة", emoji: "🧭", icon: Compass,
      status: activeDecisions > 0 ? "yellow" : decisions.length > 0 ? "green" : "neutral",
      metric: activeDecisions > 0 ? `${activeDecisions}` : `${decisions.length}`,
      detail: activeDecisions > 0 ? "قيد التفكير" : "قرار",
      color: "#06b6d4", route: "/#bawsala",
    },
    {
      id: "nadhir", name: "نذير", emoji: "🛡️", icon: Shield,
      status: safeContacts.length > 0 ? "green" : "yellow",
      metric: safeContacts.length > 0 ? "محمي" : "أضف",
      detail: `${safeContacts.length} جهة آمنة`,
      color: "#ef4444", route: "/#nadhir",
    },
    {
      id: "masarat", name: "مسارات", emoji: "🛤️", icon: Target,
      status: "green", metric: "نشط", detail: "الأهداف",
      color: "#10b981", route: "/#masarat",
    },
    {
      id: "dawayir", name: "دوائر", emoji: "🔵", icon: Map,
      status: "green", metric: "نشط", detail: "العلاقات",
      color: "#3b82f6", route: "/#dawayir",
    },
    {
      id: "murshid", name: "مرشد", emoji: "🧠", icon: Brain,
      status: logs.length >= 3 ? "green" : "neutral",
      metric: logs.length >= 3 ? "نشط" : "بيانات",
      detail: "الذكاء الموجّه",
      color: "#8b5cf6", route: "/#murshid",
    },
    {
      id: "taqrir", name: "تقرير", emoji: "📊", icon: FileText,
      status: logs.length >= 5 ? "green" : "neutral",
      metric: logs.length >= 5 ? "جاهز" : "—",
      detail: "التقرير الذكي",
      color: "#06b6d4", route: "/#taqrir",
    },
    {
      id: "riwaya", name: "رواية", emoji: "📖", icon: BookOpen,
      status: logs.length > 0 ? "green" : "neutral",
      metric: `${logs.length + totalJournals}`, detail: "حدث في القصة",
      color: "#fb923c", route: "/#riwaya",
    },
    {
      id: "mizan", name: "ميزان", emoji: "⚖️", icon: Scale,
      status: logs.length >= 3 ? "green" : "neutral",
      metric: logs.length >= 3 ? "نشط" : "—", detail: "التقدم",
      color: "#14b8a6", route: "/#mizan",
    },
    {
      id: "rifaq", name: "رفاق", emoji: "🤝", icon: Users,
      status: "green", metric: "نشط", detail: "الرفاق",
      color: "#ec4899", route: "/#rifaq",
    },
    {
      id: "baseera", name: "بصيرة", emoji: "👁️", icon: Eye,
      status: "green", metric: "نشط", detail: "الوعي",
      color: "#6366f1", route: "/#baseera",
    },
    {
      id: "atmosfera", name: "أتموسفيرا", emoji: "🌌", icon: Wind,
      status: "green", metric: "نشط", detail: "الحسّ",
      color: "#0ea5e9", route: "/#atmosfera",
    },
  ], [recentLogs, avgEnergy, wirdProgress, wirdState.streak, badges, level, totalJournals, activeDecisions, decisions, safeContacts, logs]);

  // ── Attention Queue ──
  const attentionItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];

    // No pulse today
    const todayLogs = logs.filter((l) => {
      const d = new Date(l.timestamp);
      return d.toDateString() === new Date().toDateString();
    });
    if (todayLogs.length === 0) {
      items.push({ id: "pulse", emoji: "💓", message: "لم تسجّل نبضة اليوم", priority: "high", action: "سجّل الآن", route: "/#pulse" });
    }

    // Wird not started
    if (wirdProgress === 0 && wirdEnabled > 0) {
      items.push({ id: "wird", emoji: "🔥", message: "وِردك لم يبدأ اليوم", priority: "high", action: "ابدأ", route: "/#wird" });
    } else if (wirdProgress > 0 && wirdProgress < 100) {
      items.push({ id: "wird-partial", emoji: "📿", message: `وِردك ${wirdProgress}% — كمّل`, priority: "medium", action: "أكمل", route: "/#wird" });
    }

    // Active decisions pending
    if (activeDecisions > 0) {
      items.push({ id: "bawsala", emoji: "🧭", message: `${activeDecisions} قرار ينتظر`, priority: "medium", action: "حلّل", route: "/#bawsala" });
    }

    // Low energy trend
    if (avgEnergy > 0 && avgEnergy < 4) {
      items.push({ id: "energy", emoji: "⚠️", message: "طاقتك منخفضة — اهتم بنفسك", priority: "high", action: "تنفّس", route: "/#nadhir" });
    }

    // No safe contacts
    if (safeContacts.length === 0) {
      items.push({ id: "safe", emoji: "📞", message: "أضف شخص آمن في نذير", priority: "low", action: "أضف", route: "/#nadhir" });
    }

    // No journal entries
    if (totalJournals === 0) {
      items.push({ id: "journal", emoji: "📝", message: "وثّق أول لحظة في وثيقة", priority: "low", action: "اكتب", route: "/#watheeqa" });
    }

    return items;
  }, [logs, wirdProgress, wirdEnabled, activeDecisions, avgEnergy, safeContacts, totalJournals]);

  // ── Overall Health Score ──
  const healthScore = useMemo(() => {
    const greenCount = products.filter((p) => p.status === "green").length;
    return Math.round((greenCount / products.length) * 100);
  }, [products]);

  const navigate = (route: string) => { window.location.hash = route.replace("/#", ""); };

  const cardVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.03, duration: 0.25 } }),
  };

  return (
    <div className="min-h-screen pb-32 select-none" dir="rtl"
      style={{ background: "linear-gradient(180deg, #060812 0%, #0a0e1f 40%, #06081a 100%)" }}
    >
      {/* ═══ Header ═══ */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-8 pb-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}
            >
              <LayoutGrid className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">مركز</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">غرفة القيادة — كل شيء في نظرة</p>
            </div>
          </div>

          {/* Health Score */}
          <div className="w-14 h-14 relative">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx={50} cy={50} r={40} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={5} />
              <motion.circle cx={50} cy={50} r={40} fill="none"
                stroke={healthScore >= 60 ? "#10b981" : healthScore >= 30 ? "#fbbf24" : "#ef4444"}
                strokeWidth={5} strokeLinecap="round"
                strokeDasharray={`${(healthScore / 100) * 251} 251`}
                initial={{ strokeDasharray: "0 251" }}
                animate={{ strokeDasharray: `${(healthScore / 100) * 251} 251` }}
                transition={{ duration: 1.2 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-black" style={{ color: healthScore >= 60 ? "#10b981" : healthScore >= 30 ? "#fbbf24" : "#ef4444" }}>
                {healthScore}%
              </span>
            </div>
          </div>
        </div>

        {/* Today's Quick Stats */}
        <div className="flex gap-2">
          {[
            { label: "طاقة", value: avgEnergy > 0 ? `${avgEnergy}` : "—", emoji: "⚡", color: "#fbbf24" },
            { label: "streak", value: `${wirdState.streak}`, emoji: "🔥", color: "#ef4444" },
            { label: "مستوى", value: `${level}`, emoji: "⭐", color: "#a855f7" },
            { label: "وِرد", value: `${wirdProgress}%`, emoji: "📿", color: "#10b981" },
          ].map((s) => (
            <div key={s.label} className="flex-1 p-2.5 rounded-xl text-center"
              style={{ background: `${s.color}06`, border: `1px solid ${s.color}10` }}
            >
              <span className="text-xs">{s.emoji}</span>
              <p className="text-sm font-black text-white mt-0.5">{s.value}</p>
              <p className="text-[7px] text-slate-500 font-bold">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ═══ Attention Queue ═══ */}
      {attentionItems.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 mb-5">
          <p className="text-[10px] text-slate-500 font-bold mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> يحتاج انتباهك
          </p>
          <div className="space-y-1.5">
            {attentionItems.slice(0, 4).map((item) => (
              <motion.button key={item.id} onClick={() => navigate(item.route)}
                className="w-full p-3 rounded-xl flex items-center gap-2.5 text-right transition-all active:scale-98"
                style={{
                  background: item.priority === "high" ? "rgba(239,68,68,0.04)" : item.priority === "medium" ? "rgba(251,191,36,0.04)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${item.priority === "high" ? "rgba(239,68,68,0.08)" : item.priority === "medium" ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.04)"}`,
                }}
              >
                <span className="text-sm">{item.emoji}</span>
                <p className="flex-1 text-[11px] text-slate-300 font-medium">{item.message}</p>
                <span className="text-[9px] font-bold px-2 py-1 rounded-lg"
                  style={{
                    background: item.priority === "high" ? "rgba(239,68,68,0.1)" : "rgba(6,182,212,0.1)",
                    color: item.priority === "high" ? "#ef4444" : "#06b6d4",
                  }}
                >{item.action}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* ═══ Product Health Matrix ═══ */}
      <div className="px-5 mb-5">
        <p className="text-[10px] text-slate-500 font-bold mb-2 flex items-center gap-1">
          <LayoutGrid className="w-3 h-3" /> حالة المنظومة ({products.filter((p) => p.status === "green").length}/{products.length} نشط)
        </p>

        <div className="grid grid-cols-3 gap-2">
          {products.map((product, idx) => (
            <motion.button key={product.id}
              custom={idx} variants={cardVariants} initial="hidden" animate="visible"
              onClick={() => navigate(product.route)}
              className="p-3 rounded-xl text-center transition-all active:scale-95 relative overflow-hidden"
              style={{
                background: `${product.color}05`,
                border: `1px solid ${product.color}10`,
              }}
            >
              {/* Status Dot */}
              <div className="absolute top-2 left-2 w-2 h-2 rounded-full"
                style={{
                  background: STATUS_COLORS[product.status],
                  boxShadow: product.status !== "neutral" ? `0 0 4px ${STATUS_COLORS[product.status]}40` : "none",
                }}
              />

              <span className="text-lg block mb-1">{product.emoji}</span>
              <p className="text-[10px] font-black text-white">{product.name}</p>
              <p className="text-sm font-black mt-0.5" style={{ color: product.color }}>{product.metric}</p>
              <p className="text-[7px] text-slate-500 mt-0.5">{product.detail}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ═══ Journey Phase ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="mx-5 mb-5 p-5 rounded-2xl relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(168,85,247,0.04) 100%)", border: "1px solid rgba(99,102,241,0.1)" }}
      >
        <div className="absolute top-0 left-0 w-24 h-24 rounded-full bg-indigo-500/5 blur-3xl" />

        <p className="text-[10px] text-indigo-400/60 font-bold flex items-center gap-1 mb-3">
          <TrendingUp className="w-3 h-3" /> مرحلة الرحلة
        </p>

        {/* Phase Bar */}
        <div className="flex gap-1 mb-3">
          {[
            { label: "بداية", threshold: 0 },
            { label: "استكشاف", threshold: 25 },
            { label: "بناء", threshold: 50 },
            { label: "تمكّن", threshold: 75 },
          ].map((phase, i) => (
            <div key={phase.label} className="flex-1">
              <div className="h-1.5 rounded-full mb-1"
                style={{ background: healthScore >= phase.threshold ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.04)" }}
              />
              <p className="text-[7px] text-center"
                style={{ color: healthScore >= phase.threshold ? "#818cf8" : "#334155" }}
              >{phase.label}</p>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="flex items-center justify-between text-[9px] text-slate-500 pt-2 border-t border-white/5">
          <span>{logs.length} نبضة إجمالية</span>
          <span>{badges.length} أوسمة</span>
          <span>{totalJournals} تدوينة</span>
          <span>{decisions.length} قرار</span>
        </div>
      </motion.div>

      {/* ═══ Footer ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="mx-5 mt-4 p-4 rounded-2xl text-center"
        style={{ background: "rgba(99,102,241,0.03)", border: "1px solid rgba(99,102,241,0.06)" }}
      >
        <LayoutGrid className="w-5 h-5 text-indigo-400/20 mx-auto mb-2" />
        <p className="text-[10px] text-slate-600 leading-relaxed max-w-xs mx-auto">
          المركز يجمع كل أدواتك في مكان واحد.
          <br />
          كل نقطة خضراء = جزء من رحلتك شغّال.
        </p>
      </motion.div>
    </div>
  );
};

export default MarkazScreen;
