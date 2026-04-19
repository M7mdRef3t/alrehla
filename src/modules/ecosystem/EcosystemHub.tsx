/**
 * مركز القيادة الموحّد — Ecosystem Command Center
 *
 * Unified dashboard pulling live stats from ALL 27 products.
 * Provides at-a-glance ecosystem health + quick navigation.
 */

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Moon, Mail, Flame, TrendingUp, Eye, Brain, Compass,
  BookOpen, AlertTriangle, LayoutGrid, Bell, ScrollText,
  Droplets, Scale, Users, FileText, Sparkles, Gem,
  Shield, Timer, Star, Zap, ArrowUpRight,
} from "lucide-react";

// Import stores to aggregate data
import { useMapState } from "@/modules/map/dawayirIndex";
import { useMithaqState } from "@/modules/mithaq/store/mithaq.store";
import { useSullamState } from "@/modules/sullam/store/sullam.store";
import { useBathraState } from "@/modules/bathra/store/bathra.store";
import { useWasiyyaState } from "@/modules/wasiyya/store/wasiyya.store";
import { useKhalwaState } from "@/modules/khalwa/store/khalwa.store";

/* ═══════════════════════════════════════════ */
/*               TYPES                        */
/* ═══════════════════════════════════════════ */

interface ProductPulse {
  id: string;
  name: string;
  emoji: string;
  color: string;
  /** Main stat number */
  stat: number;
  /** Label for the stat */
  statLabel: string;
  /** Is this product active/has data? */
  hasActivity: boolean;
  /** Navigation target */
  screen: string;
}

/* ═══════════════════════════════════════════ */
/*           NAVIGATION HANDLER               */
/* ═══════════════════════════════════════════ */

interface EcosystemHubProps {
  onNavigate?: (screen: string) => void;
}

/* ═══════════════════════════════════════════ */
/*           MAIN COMPONENT                   */
/* ═══════════════════════════════════════════ */

export default function EcosystemHub({ onNavigate }: EcosystemHubProps) {
  // Pull data from all stores
  const mapNodes = useMapState((s) => s.nodes);
  const pledges = useMithaqState((s) => s.pledges);
  const goals = useSullamState((s) => s.goals);
  const seeds = useBathraState((s) => s.seeds);
  const letters = useWasiyyaState((s) => s.letters);
  const khalwaSessions = useKhalwaState((s) => s.sessions);
  const khalwaMinutes = useKhalwaState((s) => s.getTotalMinutes());

  const wirdStreak = 0; // wird doesn't expose currentStreak yet

  // Build product pulses
  const products: ProductPulse[] = useMemo(() => [
    // Core Ecosystem
    { id: "dawayir", name: "دوائر", emoji: "🔵", color: "#6366f1", stat: mapNodes?.length ?? 0, statLabel: "عقدة", hasActivity: (mapNodes?.length ?? 0) > 0, screen: "map" },
    { id: "maraya", name: "مرايا", emoji: "🪞", color: "#a78bfa", stat: 0, statLabel: "انعكاس", hasActivity: false, screen: "maraya" },
    { id: "atmosfera", name: "أتموسفيرا", emoji: "🌤️", color: "#f472b6", stat: 0, statLabel: "حالة", hasActivity: false, screen: "atmosfera" },
    { id: "masarat", name: "مسارات", emoji: "🛤️", color: "#f59e0b", stat: 0, statLabel: "مسار", hasActivity: false, screen: "masarat" },
    { id: "baseera", name: "بصيرة", emoji: "👁️", color: "#14b8a6", stat: 0, statLabel: "رؤية", hasActivity: false, screen: "baseera" },
    { id: "watheeqa", name: "وثيقة", emoji: "📜", color: "#e879f9", stat: 0, statLabel: "وثيقة", hasActivity: false, screen: "watheeqa" },
    // Balance & Social
    { id: "mizan", name: "ميزان", emoji: "⚖️", color: "#f97316", stat: 0, statLabel: "تقييم", hasActivity: false, screen: "mizan" },
    { id: "rifaq", name: "رفاق", emoji: "👥", color: "#22c55e", stat: 0, statLabel: "رفيق", hasActivity: false, screen: "rifaq" },
    { id: "murshid", name: "مرشد", emoji: "🧠", color: "#8b5cf6", stat: 0, statLabel: "توجيه", hasActivity: false, screen: "murshid" },
    // Reports & Navigation
    { id: "taqrir", name: "تقرير", emoji: "📊", color: "#06b6d4", stat: 0, statLabel: "تقرير", hasActivity: false, screen: "taqrir" },
    { id: "bawsala", name: "بوصلة", emoji: "🧭", color: "#06b6d4", stat: 0, statLabel: "قرار", hasActivity: false, screen: "bawsala" },
    { id: "riwaya", name: "رواية", emoji: "📖", color: "#fb923c", stat: 0, statLabel: "فصل", hasActivity: false, screen: "riwaya" },
    // Safety & Protection
    { id: "nadhir", name: "نذير", emoji: "🛡️", color: "#ef4444", stat: 0, statLabel: "تنبيه", hasActivity: false, screen: "nadhir" },
    // Habits & Rituals
    { id: "wird", name: "وِرد", emoji: "🔥", color: "#fbbf24", stat: wirdStreak, statLabel: "يوم", hasActivity: wirdStreak > 0, screen: "wird" },
    { id: "mithaq", name: "ميثاق", emoji: "🤝", color: "#fbbf24", stat: pledges?.length ?? 0, statLabel: "عقد", hasActivity: (pledges?.length ?? 0) > 0, screen: "mithaq" },
    { id: "sullam", name: "سُلّم", emoji: "📈", color: "#84cc16", stat: goals?.length ?? 0, statLabel: "هدف", hasActivity: (goals?.length ?? 0) > 0, screen: "sullam" },
    { id: "bathra", name: "بذرة", emoji: "🌱", color: "#10b981", stat: seeds?.length ?? 0, statLabel: "بذرة", hasActivity: (seeds?.length ?? 0) > 0, screen: "bathra" },
    // Memory & Focus
    { id: "markaz", name: "مركز", emoji: "🏢", color: "#6366f1", stat: 0, statLabel: "أمر", hasActivity: false, screen: "markaz" },
    { id: "sada", name: "صدى", emoji: "🔔", color: "#06b6d4", stat: 0, statLabel: "تنبيه", hasActivity: false, screen: "sada" },
    { id: "hafiz", name: "حافظ", emoji: "💎", color: "#a855f7", stat: 0, statLabel: "ذكرى", hasActivity: false, screen: "hafiz" },
    { id: "mirah", name: "مرآة", emoji: "🔮", color: "#c084fc", stat: 0, statLabel: "رؤية", hasActivity: false, screen: "mirah" },
    { id: "sijil", name: "سِجل", emoji: "📋", color: "#10b981", stat: 0, statLabel: "حدث", hasActivity: false, screen: "sijil" },
    { id: "naba", name: "نبع", emoji: "💧", color: "#06b6d4", stat: 0, statLabel: "رشفة", hasActivity: false, screen: "naba" },
    // New Modules
    { id: "observatory", name: "المرصد", emoji: "🕸️", color: "#818cf8", stat: 0, statLabel: "نمط", hasActivity: false, screen: "observatory" },
    { id: "wasiyya", name: "وصية", emoji: "✉️", color: "#fbbf24", stat: letters?.length ?? 0, statLabel: "رسالة", hasActivity: (letters?.length ?? 0) > 0, screen: "wasiyya" },
    { id: "khalwa", name: "خلوة", emoji: "🧘", color: "#8b5cf6", stat: khalwaSessions?.length ?? 0, statLabel: "جلسة", hasActivity: (khalwaSessions?.length ?? 0) > 0, screen: "khalwa" },
  ], [mapNodes, pledges, goals, seeds, letters, khalwaSessions, wirdStreak]);

  const activeProducts = products.filter((p) => p.hasActivity);
  const totalActive = activeProducts.length;

  // Ecosystem health — percentage of products with activity
  const healthPct = Math.round((totalActive / products.length) * 100);

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full top-[-15%] right-[-10%]"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 65%)" }} />
        <div className="absolute w-[400px] h-[400px] rounded-full bottom-[-10%] left-[-5%]"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 65%)" }} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-indigo-900/15 border border-indigo-500/20">
            <LayoutGrid className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">مركز القيادة</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">27 منتج — نظرة واحدة</p>
          </div>
        </div>
      </motion.div>

      {/* Ecosystem Health Ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 px-5 py-6"
      >
        <div className="flex items-center justify-center gap-8">
          {/* Health Ring */}
          <div className="relative w-28 h-28">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(51,65,85,0.2)" strokeWidth="6" />
              <motion.circle
                cx="50" cy="50" r="42" fill="none"
                stroke="url(#healthGrad)" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - healthPct / 100) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-white">{healthPct}%</span>
              <span className="text-[8px] text-slate-500 font-bold">صحة النظام</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-3">
            {[
              { label: "منتج فعّال", value: totalActive, color: "#10b981", icon: <Zap className="w-3 h-3" /> },
              { label: "إجمالي المنتجات", value: products.length, color: "#6366f1", icon: <LayoutGrid className="w-3 h-3" /> },
              { label: "دقائق خلوة", value: khalwaMinutes, color: "#8b5cf6", icon: <Timer className="w-3 h-3" /> },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `${s.color}15`, color: s.color }}>
                  {s.icon}
                </div>
                <div>
                  <span className="text-sm font-black text-white">{s.value}</span>
                  <span className="text-[9px] text-slate-500 mr-1">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Active Products Highlight */}
      {activeProducts.length > 0 && (
        <div className="relative z-10 px-5 mb-4">
          <h3 className="text-[10px] text-slate-500 font-bold mb-3 uppercase tracking-wider">🟢 منتجات نشطة</h3>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {activeProducts.map((p, i) => (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                onClick={() => onNavigate?.(p.screen)}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
                style={{
                  background: `${p.color}10`,
                  border: `1px solid ${p.color}25`,
                }}
              >
                <span className="text-sm">{p.emoji}</span>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-white block">{p.name}</span>
                  <span className="text-[9px] font-bold" style={{ color: p.color }}>{p.stat} {p.statLabel}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Full Product Grid */}
      <div className="relative z-10 px-5">
        <h3 className="text-[10px] text-slate-500 font-bold mb-3 uppercase tracking-wider">🌌 المنظومة الكاملة</h3>
        <div className="grid grid-cols-3 gap-2">
          {products.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.02 }}
              onClick={() => onNavigate?.(p.screen)}
              className="relative rounded-xl p-3 text-center transition-all group"
              style={{
                background: p.hasActivity ? `${p.color}08` : "rgba(15,23,42,0.4)",
                border: `1px solid ${p.hasActivity ? `${p.color}25` : "rgba(51,65,85,0.2)"}`,
              }}
            >
              {/* Activity dot */}
              {p.hasActivity && (
                <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full" style={{ background: p.color }}>
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ background: p.color }}
                    animate={{ scale: [1, 2], opacity: [0.6, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              )}

              <span className="text-xl block mb-1">{p.emoji}</span>
              <span className="text-[10px] font-bold block" style={{ color: p.hasActivity ? "#fff" : "#64748b" }}>
                {p.name}
              </span>
              {p.hasActivity && (
                <span className="text-[9px] font-bold mt-0.5 block" style={{ color: p.color }}>
                  {p.stat} {p.statLabel}
                </span>
              )}

              {/* Hover arrow */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-3 h-3 text-slate-500" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 mx-5 mt-8 p-4 rounded-2xl text-center"
        style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}
      >
        <p className="text-[10px] text-slate-600 leading-relaxed">
          🌌 مركز القيادة — كل أدوات رحلتك في نظرة واحدة
        </p>
      </motion.div>
    </div>
  );
}
