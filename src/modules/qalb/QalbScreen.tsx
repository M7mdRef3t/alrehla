/**
 * قلب — Qalb Screen
 * Heart Health Meter: pulsing heart + 9 dimensions + daily history
 */

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useQalbState,
  ZONE_META,
  DIMENSION_DEFS,
  scoreToZone,
  type HeartDimension,
  type DailyPulse,
} from "./store/qalb.store";
import { useTazkiyaState } from "@/modules/tazkiya/store/tazkiya.store";
import { useJisrState } from "@/modules/jisr/store/jisr.store";
import { useRisalaState } from "@/modules/risala/store/risala.store";
import { useKhalwaState } from "@/modules/khalwa/store/khalwa.store";
import { useWarshaState } from "@/modules/warsha/store/warsha.store";
import { useKanzState } from "@/modules/kanz/store/kanz.store";
import { useBathraState } from "@/modules/bathra/store/bathra.store";
import { useMithaqState } from "@/modules/mithaq/store/mithaq.store";
import {
  Heart,
  TrendingUp,
  Calendar,
  Zap,
} from "lucide-react";

/* ═══════════════════════════════════════════ */
/*           PULSING HEART                    */
/* ═══════════════════════════════════════════ */

function PulsingHeart({ score, zone }: { score: number; zone: string }) {
  const meta = ZONE_META[zone as keyof typeof ZONE_META] || ZONE_META.healing;

  return (
    <div className="relative flex items-center justify-center py-8">
      {/* Outer glow rings */}
      {[1, 2, 3].map((ring) => (
        <motion.div
          key={ring}
          className="absolute rounded-full"
          style={{
            width: 120 + ring * 40,
            height: 120 + ring * 40,
            border: `1px solid ${meta.color}${15 - ring * 4}`,
          }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: meta.pulseSpeed + ring * 0.3, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Heart container */}
      <motion.div
        className="relative z-10 w-32 h-32 flex items-center justify-center rounded-full"
        style={{ background: meta.bgColor, border: `2px solid ${meta.color}30` }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: meta.pulseSpeed, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Inner glow */}
        <div className="absolute inset-0 rounded-full"
          style={{ background: `radial-gradient(circle, ${meta.color}15, transparent 70%)` }} />

        <div className="relative z-10 text-center">
          <span className="text-5xl block">{meta.emoji}</span>
          <motion.span
            className="text-2xl font-black block mt-1"
            style={{ color: meta.color }}
            key={score}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {score}%
          </motion.span>
        </div>
      </motion.div>

      {/* Floating particles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{ background: meta.color }}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{
            x: (Math.random() - 0.5) * 150,
            y: -60 - Math.random() * 80,
            opacity: [0, 0.6, 0],
          }}
          transition={{ duration: 2.5 + Math.random(), repeat: Infinity, delay: i * 0.5 }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*        DIMENSION BAR                       */
/* ═══════════════════════════════════════════ */

function DimensionBar({ dim }: { dim: HeartDimension }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg w-7 text-center">{dim.emoji}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-white">{dim.label}</span>
          <span className="text-[10px] font-black" style={{ color: dim.color }}>{dim.score}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: dim.color }}
            initial={{ width: 0 }}
            animate={{ width: `${dim.score}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*        HISTORY CHART (mini)                */
/* ═══════════════════════════════════════════ */

function MiniChart({ history }: { history: DailyPulse[] }) {
  if (history.length < 2) return null;
  const recent = history.slice(0, 14).reverse();
  const max = Math.max(...recent.map((p) => p.score), 1);

  return (
    <div className="flex items-end gap-1 h-16">
      {recent.map((p, i) => {
        const h = (p.score / max) * 100;
        const zone = ZONE_META[p.zone];
        return (
          <motion.div
            key={p.date}
            className="flex-1 rounded-t"
            style={{ background: zone.color, minWidth: 4 }}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ delay: i * 0.03, duration: 0.4 }}
          />
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════ */
/*           MAIN SCREEN                      */
/* ═══════════════════════════════════════════ */

export default function QalbScreen() {
  const { recordPulse, getToday, getHistory, getStreak, getAverageScore, getBestScore, history } = useQalbState();

  // Gather ecosystem data
  const tazkiyaCycles = useTazkiyaState((s) => s.cycles.filter((c) => c.isComplete).length);
  const tazkiyaAvgLight = useTazkiyaState((s) => {
    const complete = s.cycles.filter((c) => c.isComplete && c.lightnessScore);
    return complete.length > 0 ? Math.round(complete.reduce((sum, c) => sum + (c.lightnessScore || 0), 0) / complete.length) : 0;
  });
  const bridgesBuilt = useJisrState((s) => s.bridges.length);
  const bridgesCompleted = useJisrState((s) => s.bridges.filter((b) => b.isComplete).length);
  const sentMessages = useRisalaState((s) => s.sentMessages.length);
  const bottlesSent = useRisalaState((s) => s.bottlesSent);
  const khalwaMinutes = useKhalwaState((s) => s.getTotalMinutes());
  const warshaCompleted = useWarshaState((s) => s.completedChallenges.length);
  const warshaActive = useWarshaState((s) => s.activeChallenges.length);
  const kanzGems = useKanzState((s) => s.gems.length);
  const seedsActive = useBathraState((s) => s.getActiveSeeds().length);
  const seedsTreed = useBathraState((s) => s.seeds.filter((s2) => s2.stage === "tree").length);
  const pledgesKept = useMithaqState((s) => s.pledges.filter((p) => p.status === "completed").length);
  const pledgesActive = useMithaqState((s) => s.pledges.filter((p) => p.status === "active").length);

  // Calculate dimensions
  const dimensions: HeartDimension[] = useMemo(() => {
    const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

    return DIMENSION_DEFS.map((def) => {
      let score = 0;
      switch (def.id) {
        case "purification":
          score = clamp(tazkiyaCycles > 0 ? Math.min(tazkiyaCycles * 10, 60) + tazkiyaAvgLight * 0.4 : 0);
          break;
        case "connection":
          score = clamp(bridgesBuilt * 15 + bridgesCompleted * 10);
          break;
        case "giving":
          score = clamp(sentMessages * 8 + bottlesSent * 5);
          break;
        case "stillness":
          score = clamp(khalwaMinutes * 1.5);
          break;
        case "growth":
          score = clamp(warshaCompleted * 25 + warshaActive * 10);
          break;
        case "wisdom":
          score = clamp(kanzGems * 7);
          break;
        case "discipline":
          // wird not measured here — base on general activity
          score = clamp((tazkiyaCycles + bridgesBuilt + sentMessages + kanzGems) * 3);
          break;
        case "nurture":
          score = clamp(seedsActive * 10 + seedsTreed * 20);
          break;
        case "integrity":
          score = clamp(pledgesKept * 25 + pledgesActive * 10);
          break;
      }
      return { ...def, score };
    });
  }, [tazkiyaCycles, tazkiyaAvgLight, bridgesBuilt, bridgesCompleted, sentMessages, bottlesSent, khalwaMinutes, warshaCompleted, warshaActive, kanzGems, seedsActive, seedsTreed, pledgesKept, pledgesActive]);

  const overallScore = useMemo(() => {
    if (dimensions.length === 0) return 0;
    return Math.round(dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length);
  }, [dimensions]);

  const zone = useMemo(() => scoreToZone(overallScore), [overallScore]);
  const zoneMeta = ZONE_META[zone];

  // Record today's pulse on mount
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    recordPulse({ date: today, score: overallScore, zone, dimensions });
  }, [overallScore, zone]);

  const todayPulse = useMemo(() => getToday(), [history]);
  const recentHistory = useMemo(() => getHistory(14), [history]);
  const streak = useMemo(() => getStreak(), [history]);
  const avgScore = useMemo(() => getAverageScore(), [history]);
  const bestScore = useMemo(() => getBestScore(), [history]);

  // Sort dimensions by score (highest first)
  const sortedDimensions = useMemo(() => [...dimensions].sort((a, b) => b.score - a.score), [dimensions]);

  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-32" dir="rtl">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full top-[-15%] left-[50%] -translate-x-1/2"
          style={{ background: `radial-gradient(circle, ${zoneMeta.color}08, transparent 65%)` }} />
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 px-5 pt-14 pb-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: zoneMeta.bgColor, border: `1px solid ${zoneMeta.color}25` }}>
            <Heart className="w-6 h-6" style={{ color: zoneMeta.color }} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">قلب</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">صحة قلبك العاطفي</p>
          </div>
        </div>
      </motion.div>

      {/* Pulsing Heart */}
      <PulsingHeart score={overallScore} zone={zone} />

      {/* Zone Badge */}
      <div className="relative z-10 flex justify-center mb-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full"
          style={{ background: zoneMeta.bgColor, border: `1px solid ${zoneMeta.color}30` }}>
          <span className="text-lg">{zoneMeta.emoji}</span>
          <span className="text-sm font-black" style={{ color: zoneMeta.color }}>{zoneMeta.label}</span>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="relative z-10 px-5 mb-5">
        <div className="flex gap-3">
          {[
            { label: "سلسلة", value: `${streak} يوم`, color: "#f59e0b", icon: "🔥" },
            { label: "متوسط", value: `${avgScore}%`, color: "#06b6d4", icon: "📊" },
            { label: "أعلى", value: `${bestScore}%`, color: "#10b981", icon: "⭐" },
          ].map((s) => (
            <div key={s.label} className="flex-1 rounded-xl p-3 text-center"
              style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
              <span className="text-xs block mb-0.5">{s.icon}</span>
              <div className="text-sm font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-slate-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mini History Chart */}
      {recentHistory.length >= 2 && (
        <div className="relative z-10 px-5 mb-5">
          <div className="rounded-2xl p-4"
            style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> آخر 14 يوم
              </span>
              <span className="text-[9px] text-slate-600">{recentHistory.length} قراءة</span>
            </div>
            <MiniChart history={recentHistory} />
          </div>
        </div>
      )}

      {/* Dimensions */}
      <div className="relative z-10 px-5 mb-5">
        <h3 className="text-[10px] text-slate-500 font-bold mb-3 uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-amber-400" /> أبعاد القلب
        </h3>
        <div className="rounded-2xl p-4 space-y-3"
          style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.3)" }}>
          {sortedDimensions.map((dim, i) => (
            <motion.div key={dim.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}>
              <DimensionBar dim={dim} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="relative z-10 px-5 mb-5">
        <h3 className="text-[10px] text-slate-500 font-bold mb-3 uppercase tracking-wider">💡 لرفع صحة قلبك</h3>
        <div className="space-y-2">
          {sortedDimensions
            .filter((d) => d.score < 50)
            .slice(0, 3)
            .map((dim) => (
              <div key={dim.id} className="rounded-xl px-3 py-2.5 flex items-center gap-3"
                style={{ background: `${dim.color}06`, border: `1px solid ${dim.color}15` }}>
                <span className="text-lg">{dim.emoji}</span>
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-white block">{dim.label} — {dim.score}%</span>
                  <span className="text-[9px] text-slate-500">
                    {dim.id === "purification" && "جرّب دورة تزكية جديدة"}
                    {dim.id === "connection" && "ابنِ جسر إصلاح مع شخص"}
                    {dim.id === "giving" && "أرسل رسالة تشجيع لمسافر"}
                    {dim.id === "stillness" && "خذ 10 دقائق خلوة"}
                    {dim.id === "growth" && "ابدأ تحدي ورشة جديد"}
                    {dim.id === "wisdom" && "أضف جوهرة لكنزك"}
                    {dim.id === "discipline" && "استخدم أدوات المنظومة يومياً"}
                    {dim.id === "nurture" && "ازرع بذرة عادة جديدة"}
                    {dim.id === "integrity" && "اكتب عقد ميثاق مع نفسك"}
                  </span>
                </div>
                <span className="text-[8px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${dim.color}15`, color: dim.color }}>
                  +{Math.min(30, 100 - dim.score)}%
                </span>
              </div>
            ))}
          {sortedDimensions.filter((d) => d.score < 50).length === 0 && (
            <div className="text-center py-4 rounded-xl"
              style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.15)" }}>
              <span className="text-2xl block mb-1">✨</span>
              <p className="text-xs font-bold" style={{ color: "#a78bfa" }}>قلبك في حالة ممتازة!</p>
              <p className="text-[9px] text-slate-500">استمر — كل بُعد فوق 50%</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="relative z-10 mx-5 mt-6 p-4 rounded-2xl text-center"
        style={{ background: "rgba(15,23,42,0.4)", border: "1px solid rgba(51,65,85,0.2)" }}>
        <p className="text-[10px] text-slate-600 leading-relaxed">
          ❤️ قلب — مؤشرك الموحّد لصحة قلبك عبر كل أدوات الرحلة
        </p>
      </motion.div>
    </div>
  );
}
