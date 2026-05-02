import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, Eye } from 'lucide-react';

interface MapMetricsBarProps {
  energy: number;        // 0-100
  boundaries: number;    // 0-100
  clarity: number;       // 0-100
  /** Optional: descriptive label derived from value */
  energyLabel?: string;
  boundariesLabel?: string;
  clarityLabel?: string;
  /** Optional: sub-message for deeper context */
  energyHint?: string;
  boundariesHint?: string;
  clarityHint?: string;
}

function deriveEnergyLabel(v: number): string {
  if (v >= 80) return "طاقتك عالية 🔥";
  if (v >= 60) return "مستوى طاقتك جيد";
  if (v >= 40) return "طاقتك محتاجة شحن";
  if (v >= 20) return "طاقتك منخفضة";
  return "محتاج تستريح";
}

function deriveEnergyHint(v: number): string {
  if (v >= 60) return "حافظ على ما يمنحك طاقة.";
  if (v >= 30) return "حدد مصادر الاستنزاف.";
  return "خد وقت لنفسك دلوقتي.";
}

function deriveBoundariesLabel(v: number): string {
  if (v >= 80) return "حدودك قوية جداً";
  if (v >= 60) return "حدودك في تحسن";
  if (v >= 40) return "محتاج تقوّي حدودك";
  return "حدودك ضعيفة";
}

function deriveBoundariesHint(v: number): string {
  if (v >= 60) return "استمر في حماية مساحتك.";
  if (v >= 30) return "ارجع لنتائج التشخيص.";
  return "ابدأ بأول خطوة حماية.";
}

function deriveClarityLabel(v: number): string {
  if (v >= 80) return "رؤيتك واضحة جداً";
  if (v >= 60) return "رؤيتك أوضح اليوم";
  if (v >= 40) return "محتاج وقت للوضوح";
  return "فيه ضبابية — عادي";
}

function deriveClarityHint(v: number): string {
  if (v >= 60) return "ثق بحدسك وواصل التقدم.";
  if (v >= 30) return "حلل علاقة واحدة كل يوم.";
  return "ابدأ بالتشخيص.";
}

export function MapMetricsBar({ 
  energy, 
  boundaries, 
  clarity,
  energyLabel,
  boundariesLabel,
  clarityLabel,
  energyHint,
  boundariesHint,
  clarityHint
}: MapMetricsBarProps) {
  // Derive labels dynamically if not provided
  const eLabel = energyLabel ?? deriveEnergyLabel(energy);
  const bLabel = boundariesLabel ?? deriveBoundariesLabel(boundaries);
  const cLabel = clarityLabel ?? deriveClarityLabel(clarity);
  const eHint = energyHint ?? deriveEnergyHint(energy);
  const bHint = boundariesHint ?? deriveBoundariesHint(boundaries);
  const cHint = clarityHint ?? deriveClarityHint(clarity);

  // Dynamic color based on value
  const energyColor = energy >= 60 ? "text-teal-400" : energy >= 30 ? "text-amber-400" : "text-rose-400";
  const boundariesColor = boundaries >= 60 ? "text-emerald-400" : boundaries >= 30 ? "text-amber-400" : "text-rose-400";
  const clarityColor = clarity >= 60 ? "text-indigo-400" : clarity >= 30 ? "text-purple-400" : "text-rose-400";

  return (
    <div className="absolute bottom-6 left-6 right-[22rem] z-40 flex gap-4 pointer-events-none" dir="rtl">
      {/* 🔋 Energy Metric */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 max-w-xs p-5 rounded-[2rem] pointer-events-auto border border-white/10 shadow-2xl flex items-center gap-5"
        style={{
          background: "linear-gradient(145deg, rgba(15,23,42,0.85), rgba(30,41,59,0.9))",
          backdropFilter: "blur(24px)",
        }}
      >
        <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
                <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="rgba(45,212,191,0.1)"
                    strokeWidth="6"
                />
                <motion.circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="url(#energy-grad)"
                    strokeWidth="6"
                    strokeDasharray={175}
                    initial={{ strokeDashoffset: 175 }}
                    animate={{ strokeDashoffset: 175 - (175 * energy) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                />
                <defs>
                    <linearGradient id="energy-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={energy >= 60 ? "#2dd4bf" : energy >= 30 ? "#f59e0b" : "#f43f5e"} />
                        <stop offset="100%" stopColor={energy >= 60 ? "#0d9488" : energy >= 30 ? "#d97706" : "#be123c"} />
                    </linearGradient>
                </defs>
            </svg>
            <span className={`absolute text-sm font-black font-mono ${energyColor}`}>{energy}%</span>
        </div>
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                <Zap size={14} className={energyColor} />
                <span className="text-sm font-black text-white">طاقة اليوم</span>
            </div>
            <p className={`text-xs font-bold ${energyColor}/80`}>{eLabel}</p>
            <p className="text-[10px] text-slate-500 leading-tight">{eHint}</p>
        </div>
      </motion.div>

      {/* 🛡️ Boundaries Metric */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 p-5 rounded-[2rem] pointer-events-auto border border-white/10 shadow-2xl space-y-3"
        style={{
          background: "linear-gradient(145deg, rgba(15,23,42,0.85), rgba(30,41,59,0.9))",
          backdropFilter: "blur(24px)",
        }}
      >
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Shield size={14} className={boundariesColor} />
                <span className="text-sm font-black text-white">الحدود</span>
            </div>
            <span className={`text-xs font-black font-mono ${boundariesColor}`}>{boundaries}%</span>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${boundaries}%` }}
                className={`h-full bg-gradient-to-r ${boundaries >= 60 ? "from-amber-500 to-amber-300" : boundaries >= 30 ? "from-orange-500 to-orange-300" : "from-rose-500 to-rose-300"}`}
            />
        </div>
        <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold ${boundaries >= 60 ? "text-amber-200" : boundaries >= 30 ? "text-orange-200" : "text-rose-200"}`}>{bLabel}</span>
            <span className="text-[10px] text-slate-500">{bHint}</span>
        </div>
      </motion.div>

      {/* 👁️ Clarity Metric */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex-1 p-5 rounded-[2rem] pointer-events-auto border border-white/10 shadow-2xl space-y-3"
        style={{
          background: "linear-gradient(145deg, rgba(15,23,42,0.85), rgba(30,41,59,0.9))",
          backdropFilter: "blur(24px)",
        }}
      >
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Eye size={14} className={clarityColor} />
                <span className="text-sm font-black text-white">الوضوح</span>
            </div>
            <span className={`text-xs font-black font-mono ${clarityColor}`}>{clarity}%</span>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${clarity}%` }}
                className={`h-full bg-gradient-to-r ${clarity >= 60 ? "from-indigo-500 to-indigo-300" : clarity >= 30 ? "from-purple-500 to-purple-300" : "from-rose-500 to-rose-300"}`}
            />
        </div>
        <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold ${clarity >= 60 ? "text-indigo-200" : clarity >= 30 ? "text-purple-200" : "text-rose-200"}`}>{cLabel}</span>
            <span className="text-[10px] text-slate-500">{cHint}</span>
        </div>
      </motion.div>
    </div>
  );
}
