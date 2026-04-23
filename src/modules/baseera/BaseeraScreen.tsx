/**
 * بصيرة — Baseera: لوحة الوعي الذاتي
 * 
 * Dashboard يجمع بيانات من كل المنتجات:
 * - Pulse logs (mood + energy timeline)
 * - Predictive Engine (entropy + crash probability)
 * - Dissonance Engine (goal alignment)
 * - Dawayir Map (node states + rings)
 * - Consciousness History (emotional trajectory)
 * 
 * يسطّح القيمة: المستخدم يرى "خريطة حياته" ببيانات حقيقية.
 */

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Activity, TrendingUp, TrendingDown, Eye, Shield,
  Zap, Heart, AlertTriangle, Target, BarChart3, Clock,
  Zap as Sparkles, CircleDot, Flame, Waves, ChevronDown, ChevronUp,
  Lightbulb, Compass, ArrowRight
} from "lucide-react";
import { usePulseState, type PulseEntry, type PulseMood } from "@/domains/consciousness/store/pulse.store";
import { usePredictiveState } from "@/domains/consciousness/store/predictive.store";
import { useConsciousnessHistory } from "@/domains/consciousness/store/history.store";
import { useMapState } from "@/modules/map/dawayirIndex";
import { useJourneyState } from "@/domains/journey/store/journey.store";
import { calculateEntropy, type PredictiveInsight } from "@/services/predictiveEngine";
import { DissonanceEngine, type DissonanceReport } from "@/services/dissonanceEngine";
import { eventBus } from "@/shared/events/bus";

// ─── Constants ──────────────────────────────────────────────────────────

const MOOD_META: Record<PulseMood, { label: string; emoji: string; color: string }> = {
  bright:      { label: "مشرق",     emoji: "☀️", color: "#fbbf24" },
  calm:        { label: "هادئ",     emoji: "🌊", color: "#60a5fa" },
  anxious:     { label: "قلق",      emoji: "😰", color: "#f97316" },
  angry:       { label: "غاضب",     emoji: "🔥", color: "#ef4444" },
  sad:         { label: "حزين",     emoji: "🌧️", color: "#94a3b8" },
  tense:       { label: "متوتر",    emoji: "⚡", color: "#a855f7" },
  hopeful:     { label: "متفائل",   emoji: "🌱", color: "#10b981" },
  overwhelmed: { label: "مثقل",     emoji: "🏔️", color: "#64748b" },
};

const STATE_META = {
  CHAOS: { label: "فوضى", color: "#ef4444", bg: "rgba(239,68,68,0.1)", icon: <Flame className="w-5 h-5" /> },
  ORDER: { label: "انتظام", color: "#60a5fa", bg: "rgba(96,165,250,0.1)", icon: <Shield className="w-5 h-5" /> },
  FLOW:  { label: "انسياب", color: "#10b981", bg: "rgba(16,185,129,0.1)", icon: <Waves className="w-5 h-5" /> },
};

// ─── Mini Spark Chart ───────────────────────────────────────────────────

function SparkLine({ data, color, height = 48 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) return <div style={{ height }} className="flex items-center justify-center text-slate-600 text-xs">لا توجد بيانات كافية</div>;
  
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - ((v - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(" ");

  const areaPoints = `0,${height} ${points} ${w},${height}`;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${color.replace('#','')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Ring Distribution Bar ──────────────────────────────────────────────

function RingBar({ green, yellow, red, total }: { green: number; yellow: number; red: number; total: number }) {
  if (total === 0) return <div className="h-3 bg-white/5 rounded-full" />;
  const gP = (green / total) * 100;
  const yP = (yellow / total) * 100;
  const rP = (red / total) * 100;
  return (
    <div className="h-3 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.05)" }}>
      {gP > 0 && <div style={{ width: `${gP}%`, background: "#10b981" }} className="transition-all duration-500" />}
      {yP > 0 && <div style={{ width: `${yP}%`, background: "#fbbf24" }} className="transition-all duration-500" />}
      {rP > 0 && <div style={{ width: `${rP}%`, background: "#ef4444" }} className="transition-all duration-500" />}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function BaseeraScreen() {
  const pulses = usePulseState(s => s.logs);
  const predictive = usePredictiveState();
  const history = useConsciousnessHistory(s => s.history);
  const nodes = useMapState(s => s.nodes);
  const journey = useJourneyState();
  const [expandedSection, setExpandedSection] = useState<string | null>("entropy");

  // Compute entropy on mount
  const entropy = useMemo<PredictiveInsight>(() => {
    try { return calculateEntropy(nodes, pulses); }
    catch { return { state: "ORDER" as const, entropyScore: 0, primaryFactor: "N/A", unstableNodes: 0, pulseVolatility: 0, lowEnergyRatio: 0 }; }
  }, [pulses, nodes]);

  // Compute dissonance
  const dissonance = useMemo<DissonanceReport>(() => {
    try { return DissonanceEngine.evaluate(nodes, journey, pulses); }
    catch { return { hasDissonance: false, score: 0, message: "لا توجد بيانات كافية" }; }
  }, [nodes, pulses, journey]);

  // Pulse analytics
  const pulseAnalytics = useMemo(() => {
    const recent = pulses.slice(0, 14); // Last 14 entries
    const energies = recent.map(p => p.energy);
    const avgEnergy = energies.length > 0 ? energies.reduce((a, b) => a + b, 0) / energies.length : 0;
    
    // Mood distribution
    const moodCounts: Partial<Record<PulseMood, number>> = {};
    recent.forEach(p => { moodCounts[p.mood] = (moodCounts[p.mood] || 0) + 1; });
    const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
    
    // Energy trend (is it going up or down?)
    const firstHalf = energies.slice(Math.floor(energies.length / 2));
    const secondHalf = energies.slice(0, Math.floor(energies.length / 2));
    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;
    const trend = secondAvg - firstAvg;
    
    // Weekly pattern (day of week → avg energy)
    const weeklyEnergy: Record<number, number[]> = {};
    recent.forEach(p => {
      const day = new Date(p.timestamp).getDay();
      if (!weeklyEnergy[day]) weeklyEnergy[day] = [];
      weeklyEnergy[day].push(p.energy);
    });
    
    return {
      avgEnergy: Number(avgEnergy.toFixed(1)),
      energies: energies.reverse(),
      dominantMood: dominantMood ? { mood: dominantMood[0] as PulseMood, count: dominantMood[1] } : null,
      trend,
      totalPulses: pulses.length,
      recentCount: recent.length,
      moodCounts,
    };
  }, [pulses]);

  // Node analytics
  const nodeAnalytics = useMemo(() => {
    const active = nodes.filter(n => !n.isNodeArchived);
    const green = active.filter(n => n.ring === "green").length;
    const yellow = active.filter(n => n.ring === "yellow").length;
    const red = active.filter(n => n.ring === "red").length;
    const detached = active.filter(n => n.detachmentMode || n.isDetached).length;
    return { total: active.length, green, yellow, red, detached };
  }, [nodes]);

  // Emit event on mount
  useEffect(() => {
    eventBus.emit("baseera:dashboard_viewed" as any, {});
  }, []);

  const toggleSection = (id: string) => setExpandedSection(prev => prev === id ? null : id);

  const stateMeta = STATE_META[entropy.state];

  return (
    <div
      className="min-h-screen text-white font-sans pb-24"
      dir="rtl"
      style={{ background: "linear-gradient(145deg, #080c1a 0%, #0c1225 40%, #0a0f1f 100%)" }}
    >
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-30 border-b border-white/5"
        style={{ background: "rgba(8, 12, 26, 0.88)", backdropFilter: "blur(24px)" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">
                بصيرة<span className="text-violet-400 text-xs font-bold mr-2">Baseera</span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">لوحة الوعي الذاتي — بياناتك تحكيلك مين أنت</p>
            </div>
          </div>

          {/* Live State Badge */}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-all"
            style={{ background: stateMeta.bg, borderColor: stateMeta.color + "33", color: stateMeta.color }}
          >
            {stateMeta.icon}
            <span className="text-sm font-black">{stateMeta.label}</span>
            <span className="text-xs opacity-60">{entropy.entropyScore}/100</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* ── Quick Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Energy */}
          <StatCard
            label="متوسط الطاقة"
            value={pulseAnalytics.avgEnergy.toString()}
            suffix="/10"
            icon={<Zap className="w-4 h-4" />}
            color={pulseAnalytics.avgEnergy >= 7 ? "#10b981" : pulseAnalytics.avgEnergy >= 4 ? "#fbbf24" : "#ef4444"}
            trend={pulseAnalytics.trend}
          />
          {/* Entropy */}
          <StatCard
            label="مستوى الفوضى"
            value={entropy.entropyScore.toString()}
            suffix="/100"
            icon={<Activity className="w-4 h-4" />}
            color={entropy.entropyScore >= 70 ? "#ef4444" : entropy.entropyScore >= 40 ? "#fbbf24" : "#10b981"}
          />
          {/* Crash Probability */}
          <StatCard
            label="احتمال الانهيار"
            value={Math.round(predictive.crashProbability * 100).toString()}
            suffix="%"
            icon={<AlertTriangle className="w-4 h-4" />}
            color={predictive.crashProbability > 0.7 ? "#ef4444" : predictive.crashProbability > 0.4 ? "#fbbf24" : "#10b981"}
          />
          {/* Relationships */}
          <StatCard
            label="العلاقات النشطة"
            value={nodeAnalytics.total.toString()}
            suffix={`(${nodeAnalytics.red} 🔴)`}
            icon={<Heart className="w-4 h-4" />}
            color={nodeAnalytics.red > 3 ? "#ef4444" : nodeAnalytics.red > 0 ? "#fbbf24" : "#10b981"}
          />
        </div>

        {/* ── Entropy Section ── */}
        <CollapsibleSection
          id="entropy"
          title="رادار الفوضى"
          subtitle="مستوى الضغط النفسي والعلائقي"
          icon={<Flame className="w-5 h-5" />}
          color="#ef4444"
          isExpanded={expandedSection === "entropy"}
          onToggle={() => toggleSection("entropy")}
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* Entropy Gauge */}
            <div className="space-y-4">
              <EntropyGauge score={entropy.entropyScore} state={entropy.state} />
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="العامل الأبرز" value={translateFactor(entropy.primaryFactor)} />
                <MiniStat label="تقلب النبض" value={entropy.pulseVolatility.toString()} />
                <MiniStat label="علاقات غير مستقرة" value={entropy.unstableNodes.toString()} />
                <MiniStat label="طاقة منخفضة" value={`${Math.round(entropy.lowEnergyRatio * 100)}%`} />
              </div>
            </div>

            {/* Relationship Ring Distribution */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">توزيع العلاقات</h4>
              <RingBar {...nodeAnalytics} />
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                  <p className="text-xl font-black text-emerald-400">{nodeAnalytics.green}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">آمنة 🟢</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                  <p className="text-xl font-black text-amber-400">{nodeAnalytics.yellow}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">متذبذبة 🟡</p>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                  <p className="text-xl font-black text-rose-400">{nodeAnalytics.red}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">سامة 🔴</p>
                </div>
              </div>
              {nodeAnalytics.detached > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-500/10 border border-slate-500/20 rounded-xl">
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-400 font-bold">{nodeAnalytics.detached} علاقة معزولة (حدود نشطة)</span>
                </div>
              )}
            </div>
          </div>
        </CollapsibleSection>

        {/* ── Pulse Timeline ── */}
        <CollapsibleSection
          id="pulse"
          title="خط الطاقة"
          subtitle={`${pulseAnalytics.totalPulses} نبضة مسجّلة`}
          icon={<Activity className="w-5 h-5" />}
          color="#60a5fa"
          isExpanded={expandedSection === "pulse"}
          onToggle={() => toggleSection("pulse")}
        >
          <div className="space-y-4">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
              <SparkLine data={pulseAnalytics.energies} color="#60a5fa" height={80} />
              <div className="flex items-center justify-between mt-2 text-[10px] text-slate-600">
                <span>الأقدم</span>
                <span className="flex items-center gap-1">
                  {pulseAnalytics.trend > 0.5 ? (
                    <><TrendingUp className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">اتجاه صاعد</span></>
                  ) : pulseAnalytics.trend < -0.5 ? (
                    <><TrendingDown className="w-3 h-3 text-rose-400" /><span className="text-rose-400">اتجاه هابط</span></>
                  ) : (
                    <span className="text-slate-500">مستقر</span>
                  )}
                </span>
                <span>الأحدث</span>
              </div>
            </div>

            {/* Mood Distribution */}
            {pulseAnalytics.dominantMood && (
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">توزيع المشاعر</h4>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(pulseAnalytics.moodCounts)
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .slice(0, 4)
                    .map(([mood, count]) => {
                      const meta = MOOD_META[mood as PulseMood];
                      if (!meta) return null;
                      return (
                        <div key={mood} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center">
                          <p className="text-lg">{meta.emoji}</p>
                          <p className="text-[10px] font-black mt-1" style={{ color: meta.color }}>{meta.label}</p>
                          <p className="text-xs text-slate-500 font-bold">{count as number}×</p>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* ── Dissonance / Goal Alignment ── */}
        <CollapsibleSection
          id="dissonance"
          title="مرآة التناقض"
          subtitle="هل نيتك تتطابق مع سلوكك؟"
          icon={<Target className="w-5 h-5" />}
          color={dissonance.hasDissonance ? "#f97316" : "#10b981"}
          isExpanded={expandedSection === "dissonance"}
          onToggle={() => toggleSection("dissonance")}
        >
          <div className="space-y-4">
            <div
              className="p-5 rounded-2xl border"
              style={{
                background: dissonance.hasDissonance ? "rgba(249,115,22,0.05)" : "rgba(16,185,129,0.05)",
                borderColor: dissonance.hasDissonance ? "rgba(249,115,22,0.2)" : "rgba(16,185,129,0.2)",
              }}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {dissonance.hasDissonance ? (
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                  ) : (
                    <Target className="w-5 h-5 text-emerald-400" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className={`text-sm font-black ${dissonance.hasDissonance ? "text-orange-400" : "text-emerald-400"}`}>
                    {dissonance.hasDissonance ? `تناقض مكتشف — ${dissonance.score}/100` : "متطابق ✓"}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">{dissonance.message}</p>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* ── Trajectory Forecast ── */}
        <CollapsibleSection
          id="forecast"
          title="توقعات الـ 48 ساعة"
          subtitle="ماذا يتوقع الرادار؟"
          icon={<Compass className="w-5 h-5" />}
          color="#a855f7"
          isExpanded={expandedSection === "forecast"}
          onToggle={() => toggleSection("forecast")}
        >
          <div className="space-y-4">
            <div className="p-5 bg-purple-500/5 border border-purple-500/10 rounded-2xl">
              <p className="text-sm text-slate-300 leading-relaxed font-medium italic border-r-2 border-purple-500/30 pr-4">
                {predictive.forecast}
              </p>
            </div>
            {predictive.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Lightbulb className="w-3.5 h-3.5" />
                  توصيات
                </h4>
                {predictive.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                    <ArrowRight className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-300 leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            )}
            {predictive.isSurvivalMode && (
              <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <Shield className="w-6 h-6 text-rose-400 animate-pulse" />
                <div>
                  <p className="text-sm font-black text-rose-400">وضع البقاء نشط</p>
                  <p className="text-[11px] text-rose-300/60">احتمال الانهيار عالي — النظام يحمي العلاقات السامة تلقائياً</p>
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* ── Consciousness Timeline ── */}
        <CollapsibleSection
          id="consciousness"
          title="خط الوعي"
          subtitle={`${history.length} نقطة وعي مسجّلة`}
          icon={<Brain className="w-5 h-5" />}
          color="#8b5cf6"
          isExpanded={expandedSection === "consciousness"}
          onToggle={() => toggleSection("consciousness")}
        >
          {history.length === 0 ? (
            <div className="py-8 text-center">
              <Brain className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">لا توجد نقاط وعي مسجّلة بعد</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
              {history.slice(-20).reverse().map((point, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <CircleDot className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300 truncate">{point.emotionalState}</p>
                    <p className="text-[10px] text-slate-600">{point.pattern} · شدة {point.intensity}/10</p>
                  </div>
                  <span className="text-[10px] text-slate-600 shrink-0">
                    {point.timestamp ? new Date(point.timestamp).toLocaleDateString("ar-EG", { day: "numeric", month: "short" }) : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>
      </div>
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────────────────────────────

function StatCard({ label, value, suffix, icon, color, trend }: {
  label: string; value: string; suffix?: string; icon: React.ReactNode; color: string; trend?: number;
}) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-slate-600">{icon}</span>
        {trend !== undefined && trend !== 0 && (
          <span className={`flex items-center gap-0.5 text-[10px] font-bold ${trend > 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend).toFixed(1)}
          </span>
        )}
      </div>
      <div>
        <span className="text-2xl font-black" style={{ color }}>{value}</span>
        {suffix && <span className="text-xs text-slate-500 mr-1">{suffix}</span>}
      </div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-black text-slate-300">{value}</p>
    </div>
  );
}

function EntropyGauge({ score, state }: { score: number; state: string }) {
  const meta = STATE_META[state as keyof typeof STATE_META] ?? STATE_META.ORDER;
  const rotation = (score / 100) * 180 - 90; // -90 to 90 degrees
  
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="relative w-40 h-20 overflow-hidden">
        {/* Background arc */}
        <div className="absolute inset-0 rounded-t-full" style={{
          background: `conic-gradient(from 180deg, #10b981 0deg, #fbbf24 90deg, #ef4444 180deg, transparent 180deg)`,
          opacity: 0.2,
        }} />
        {/* Needle */}
        <div className="absolute bottom-0 left-1/2 origin-bottom" style={{
          transform: `translateX(-50%) rotate(${rotation}deg)`,
          width: 2, height: 64,
          background: `linear-gradient(to top, ${meta.color}, transparent)`,
          transition: "transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }} />
        {/* Center dot */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-4 h-4 rounded-full border-2" style={{
          borderColor: meta.color,
          background: "#0a0e1f",
        }} />
      </div>
      <div className="text-center">
        <p className="text-3xl font-black" style={{ color: meta.color }}>{score}</p>
        <p className="text-[10px] font-bold text-slate-500 uppercase">{meta.label}</p>
      </div>
    </div>
  );
}

function CollapsibleSection({ id, title, subtitle, icon, color, isExpanded, onToggle, children }: {
  id: string; title: string; subtitle: string; icon: React.ReactNode;
  color: string; isExpanded: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-5 flex items-center justify-between text-right transition-all hover:bg-white/[0.02]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + "15", color }}>
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-black text-white">{title}</h3>
            <p className="text-[11px] text-slate-500 font-medium">{subtitle}</p>
          </div>
        </div>
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-5 h-5 text-slate-600" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────

function translateFactor(factor: string): string {
  const map: Record<string, string> = {
    relational_pressure: "ضغط علائقي",
    energy_drop: "انخفاض الطاقة",
    mood_instability: "تقلب المزاج",
    pulse_volatility: "تذبذب النبض",
    general_variability: "تغيّر عام",
  };
  return map[factor] ?? factor;
}
