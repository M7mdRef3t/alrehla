"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, Zap, Activity, Brain, 
  ChevronRight, Sparkles, Binary, 
  TrendingUp, Fingerprint, Lock
} from "lucide-react";
import { 
  Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, ResponsiveContainer 
} from "recharts";
import { AwarenessVector } from "../../services/trajectoryEngine";

interface ScientificDiagnosticHUDProps {
  onComplete: (score: number) => void;
  personName: string;
  orbId: string; // red, yellow, green
  answers: Record<string, string>; // From QuickQuestionsStep
}

/**
 * ScientificDiagnosticHUD — شاشة التحليل الرقمي السيادي 🛡️🔬
 * تعرض "المعادلات" والتحليل الفني قبل النتيجة النهائية.
 */
export const ScientificDiagnosticHUD: React.FC<ScientificDiagnosticHUDProps> = ({
  onComplete,
  personName,
  orbId,
  answers
}) => {
  const [phase, setPhase] = useState<"calculating" | "reveal">("calculating");
  const [progress, setProgress] = useState(0);

  // 1. حساب المتجهات (Simulated based on inputs)
  const vector = useMemo<AwarenessVector>(() => {
    // Basic logic mapping inputs to vectors
    const rs = orbId === "green" ? 0.8 : orbId === "yellow" ? 0.5 : 0.2;
    const av = Object.keys(answers).length > 0 ? 0.7 : 0.4;
    const bi = Object.values(answers).filter(a => a === "often").length / 5 + 0.3;
    const se = orbId === "red" ? 0.8 : 0.3;
    const cb = orbId === "green" ? 0.9 : 0.4;

    return {
      rs: Math.min(1, rs),
      av: Math.min(1, av),
      bi: Math.min(1, bi),
      se: Math.min(1, se),
      cb: Math.min(1, cb),
      timestamp: Date.now()
    };
  }, [orbId, answers]);

  const radarData = [
    { subject: 'التناغم (RS)', value: vector.rs, fullMark: 1 },
    { subject: 'السرعة (AV)', value: vector.av, fullMark: 1 },
    { subject: 'الأمانة (BI)', value: vector.bi, fullMark: 1 },
    { subject: 'الفوضى (SE)', value: vector.se, fullMark: 1 },
    { subject: 'الاستيعاب (CB)', value: vector.cb, fullMark: 1 },
  ];

  const sovereigntyScore = useMemo(() => {
    const score = ((vector.rs + vector.av + vector.bi + vector.cb) / 4) * (1 - vector.se * 0.5);
    return Math.round(score * 100);
  }, [vector]);

  // Loading Simulation
  useEffect(() => {
    if (phase === "calculating") {
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setTimeout(() => setPhase("reveal"), 800);
            return 100;
          }
          return p + 2;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [phase]);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden font-sans select-none relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-[120px]" />
      </div>

      <AnimatePresence mode="wait">
        {phase === "calculating" ? (
          <motion.div 
            key="calc"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-12"
          >
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="w-48 h-48 rounded-full border-2 border-dashed border-cyan-500/30 flex items-center justify-center"
              >
                <div className="w-32 h-32 rounded-full border border-indigo-500/20" />
              </motion.div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="w-12 h-12 text-cyan-400 animate-pulse" />
              </div>
              <div className="absolute -top-4 -right-4 pt-1 pr-1 bg-slate-950">
                <Binary className="w-6 h-6 text-indigo-400 opacity-50" />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black tracking-tight uppercase">
                جاري معالجة <span className="text-cyan-400">"{personName}"</span>
              </h2>
              <p className="text-sm text-slate-400 max-w-xs mx-auto font-medium leading-relaxed">
                نقوم الآن بحساب متجهات الوعي والسيادة لفك شفرة هذه العلاقة...
              </p>
            </div>

            <div className="w-full max-w-sm space-y-2">
              <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">
                <span>Relational Matrix Scanning</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-cyan-600 to-indigo-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-2 justify-center pt-2 opacity-40">
                <span className="text-[8px] font-mono">θ = INTEGRAL(BI * AV)</span>
                <span className="text-[8px] font-mono">ΔS = Σ(ShadowEntropy)</span>
                <span className="text-[8px] font-mono">V = d(Awareness)/dt</span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="reveal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto custom-scrollbar"
          >
            {/* Header / Sovereignty Badge */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
                  <Shield className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">تحليل السيادة</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Calculated Successfully</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-white tabular-nums">{sovereigntyScore}</div>
                <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Sovereignty Score</div>
              </div>
            </div>

            {/* Main Content: Radar + Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Radar Chart */}
              <div className="h-[280px] w-full bg-slate-900/40 rounded-3xl border border-white/5 p-4 relative overflow-hidden group">
                 <div className="absolute top-2 right-4 text-[8px] text-indigo-400 font-mono tracking-widest uppercase py-1 px-2 bg-indigo-500/10 rounded-md border border-indigo-500/20 opacity-60">
                   Awareness Radar v3.2
                 </div>
                 <div className="absolute bottom-4 left-4 z-10">
                   <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span className="text-[9px] text-slate-400 font-bold uppercase">Dynamic Field</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-700" />
                      <span className="text-[9px] text-slate-500 font-bold uppercase">Baseline</span>
                   </div>
                 </div>
                 <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                      <PolarGrid stroke="#334155" strokeDasharray="3 3" />
                      <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }}
                      />
                      <Radar
                        name={personName}
                        dataKey="value"
                        stroke="#22d3ee"
                        fill="#22d3ee"
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                 </ResponsiveContainer>
              </div>

              {/* Technical Breakdown */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 shadow-inner">
                    <div className="flex items-center gap-2 mb-2 text-indigo-400">
                      <Activity className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Symmetry</span>
                    </div>
                    <div className="text-xl font-bold text-white tabular-nums">{(vector.rs * 10).toFixed(1)}</div>
                    <div className="w-full h-1 bg-white/5 rounded-full mt-2">
                      <div className="h-full bg-indigo-500" style={{ width: `${vector.rs * 100}%` }} />
                    </div>
                  </div>
                  <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 shadow-inner">
                    <div className="flex items-center gap-2 mb-2 text-cyan-400">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Velocity</span>
                    </div>
                    <div className="text-xl font-bold text-white tabular-nums">{(vector.av * 10).toFixed(1)}</div>
                    <div className="w-full h-1 bg-white/5 rounded-full mt-2">
                      <div className="h-full bg-cyan-500" style={{ width: `${vector.av * 100}%` }} />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/60 rounded-2xl border border-white/5 shadow-inner space-y-3">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 text-emerald-400">
                       <Zap className="w-4 h-4" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Relational Integrity</span>
                     </div>
                     <span className="text-xs font-bold text-emerald-400">{Math.round(vector.bi * 100)}%</span>
                   </div>
                   <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                     يعبر عن مدى توافق أفعال وقيم الطرف الآخر مع مدارك السيادي. النسبة الحالية تشير إلى {vector.bi > 0.7 ? "توافق عالي" : vector.bi > 0.4 ? "توافق متوسط" : "تحديات حقيقية"}.
                   </p>
                </div>

                <div className="p-4 bg-rose-500/5 rounded-2xl border border-rose-500/20 shadow-inner space-y-3">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 text-rose-400">
                       <Fingerprint className="w-4 h-4" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Shadow Entropy</span>
                     </div>
                     <span className="text-xs font-bold text-rose-400">{Math.round(vector.se * 100)}%</span>
                   </div>
                   <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
                      <span>Chaos Detected: {(vector.se * 1.5).toFixed(2)} units</span>
                      <span>Signal/Noise: {(1 / vector.se).toFixed(1)}</span>
                   </div>
                </div>
              </div>
            </div>

            {/* Bottom Equation / CTA */}
            <div className="mt-auto pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-xl border border-white/5">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Lock className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                   <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Sovereignty Integral Formula</div>
                   <div className="text-xs font-mono text-cyan-400">S = ∫(BI × AV × CB) dt - Δ(SE)</div>
                </div>
              </div>

              <button 
                onClick={() => onComplete(sovereigntyScore)}
                className="w-full sm:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 active:scale-95 group"
              >
                <span>عرض النتيجة النهائية</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
