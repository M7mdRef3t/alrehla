"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Award, BarChart3, BookOpen,
  Flame, Pencil, Check,
  Map, TrendingUp, Zap,
  Sparkles, Orbit
} from "lucide-react";
import { useGamificationState } from "@/services/gamificationEngine";
import { useAchievementState } from "@/state/achievementState";
import { useQuizHistory } from "@/hooks/useQuizHistory";
import { useMapState } from "@/state/mapState";
import { ACHIEVEMENTS } from "@/data/achievements";
import { DailyQuests } from "../growth/Gamification/DailyQuests";
import { calculateEntropy } from "@/services/predictiveEngine";


/* ══════════════════════════════════════════
   Design Tokens: Cosmic Glass Aesthetic
   ══════════════════════════════════════════ */
const cosmicGlassBase = {
  background: "var(--glass-bg)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid var(--glass-border)",
  boxShadow: "var(--app-shadow)",
  borderRadius: "24px",
};

/* ══════════════════════════════════════════
   Rank Config
   ══════════════════════════════════════════ */
const RANK_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  "مستطلع جديد": { label: "مستطلع جديد", color: "#94a3b8", emoji: "🌱" },
  "كشاف واع": { label: "كشاف واع", color: "#2dd4bf", emoji: "👁️" },
  "غازي تعافي": { label: "غازي تعافي", color: "#34d399", emoji: "🌿" },
  "بطل حدود": { label: "بطل حدود", color: "#fbbf24", emoji: "🎯" },
  "رائد استقرار": { label: "رائد استقرار", color: "#22d3ee", emoji: "🧭" },
  "صائد حكمة": { label: "صائد حكمة", color: "#a78bfa", emoji: "💎" },
  "عمدة سلام": { label: "عمدة سلام", color: "#10b981", emoji: "🏔️" },
  "مارشال الإدارة": { label: "مارشال إدارة", color: "#f43f5e", emoji: "👑" },
};
const DEFAULT_RANK = { label: "مبتدئ", color: "#64748b", emoji: "🌱" };

const BIO_KEY = "alrehla_profile_bio";

/* ══════════════════════════════════════════
   Radar Chart — Cosmic Hologram
   ══════════════════════════════════════════ */
interface RadarDim {
  label: string;
  value: number; // 0–100
}

function PersonalityRadar({ dims, size = 260 }: { dims: RadarDim[]; size?: number }) {
  const cx = size / 2, cy = size / 2, r = size * 0.35;
  const n = dims.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i: number, radius: number) => ({
    x: cx + radius * Math.cos(angle(i)),
    y: cy + radius * Math.sin(angle(i)),
  });
  
  const rings = [0.25, 0.5, 0.75, 1];
  const gridPts = (f: number) => dims.map((_, i) => `${pt(i, r * f).x},${pt(i, r * f).y}`).join(" ");
  const dataPoly = dims.map((d, i) => {
    const val = Math.max(0, Math.min(1, d.value / 100));
    return `${pt(i, r * val).x},${pt(i, r * val).y}`;
  }).join(" ");

  return (
    <div className="relative flex justify-center items-center my-4" style={{ filter: "drop-shadow(0 0 15px rgba(45,212,191,0.2))" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="radar-glow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.05" />
          </linearGradient>
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Radar Rings */}
        {rings.map((f, idx) => (
          <polygon key={idx} points={gridPts(f)} fill="none"
            stroke="var(--app-border)" strokeWidth={f === 1 ? "1.5" : "0.5"} strokeDasharray={f === 1 ? "none" : "2 4"} />
        ))}

        {/* Spoke Lines */}
        {dims.map((_, i) => {
          const o = pt(i, r);
          return <line key={i} x1={cx} y1={cy} x2={o.x} y2={o.y} stroke="rgba(45,212,191,0.15)" strokeWidth="1" strokeDasharray="3 3" />;
        })}

        {/* Data Area */}
        <motion.polygon
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
          points={dataPoly}
          fill="url(#radar-glow)" stroke="#2dd4bf" strokeWidth="2" strokeLinejoin="round"
          style={{ transformOrigin: `${cx}px ${cy}px` }}
          filter="url(#neon-glow)"
        />

        {/* Points */}
        {dims.map((d, i) => {
          const val = Math.max(0, Math.min(1, d.value / 100));
          const p = pt(i, r * val);
          return (
            <motion.circle key={`dot-${i}`} cx={p.x} cy={p.y} r={4}
              initial={{ r: 0 }} animate={{ r: 4 }} transition={{ delay: 0.5 + i * 0.1 }}
              fill="#fff" stroke="#2dd4bf" strokeWidth={2} filter="url(#neon-glow)" />
          );
        })}

        {/* Labels */}
        {dims.map((d, i) => {
          const lblPt = pt(i, r * 1.35);
          const anchor = lblPt.x < cx - 10 ? "end" : lblPt.x > cx + 10 ? "start" : "middle";
          return (
            <text key={i} x={lblPt.x} y={lblPt.y + 4} textAnchor={anchor}
              fontSize="11" fontWeight="600" fill="rgba(226,232,240,0.8)" fontFamily="var(--font-sans)">
              {d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════
   Profile Avatar: Cosmic Orb
   ══════════════════════════════════════════ */
function ProfileAvatar({ rank, level }: { rank: string; level: number }) {
  const cfg = RANK_CONFIG[rank] ?? DEFAULT_RANK;
  const size = 110, padding = 8;
  const r = (size - padding * 2) / 2;
  const circ = 2 * Math.PI * r;
  const progress = Math.min(1, (level % 10) / 10);

  return (
    <div style={{ position: "relative", width: size, height: size, margin: "0 auto 16px" }}>
      {/* Background Pulse Glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(circle, ${cfg.color}30 0%, transparent 70%)`, filter: "blur(15px)" }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* SVG Ring Overlays */}
      <svg width={size} height={size} style={{ position: "absolute", transform: "rotate(-90deg)", zIndex: 2 }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="var(--app-border)" strokeWidth={4} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={cfg.color} strokeWidth={4.5} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - progress) }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 6px ${cfg.color}80)` }} 
        />
      </svg>

      {/* Center Core */}
      <div style={{
        position: "absolute", top: padding, left: padding, right: padding, bottom: padding, 
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${cfg.color}15, ${cfg.color}05)`,
        border: `1px solid ${cfg.color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 38,
        boxShadow: `inset 0 0 20px ${cfg.color}20`,
        zIndex: 1
      }}>
        <motion.div
          animate={{ y: [-2, 2, -2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          {cfg.emoji}
        </motion.div>
      </div>

      {/* Level Badge */}
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: "spring", bounce: 0.6 }}
        style={{
          position: "absolute", bottom: -4, right: -4, zIndex: 10,
          width: 32, height: 32, borderRadius: "50%",
          background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}dd)`,
          border: "3px solid #030712",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 900, color: "#000",
          boxShadow: `0 4px 10px ${cfg.color}60`
        }}>
        {level}
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Editable Bio
   ══════════════════════════════════════════ */
function EditableBio() {
  const [bio, setBio] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(BIO_KEY) ?? "";
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(bio);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const save = () => {
    setBio(draft);
    localStorage.setItem(BIO_KEY, draft);
    setEditing(false);
  };
  const cancel = () => { setDraft(bio); setEditing(false); };

  if (editing) {
    return (
      <div className="mt-4 w-full px-2">
        <textarea ref={ref} value={draft} onChange={(e) => setDraft(e.target.value)}
          rows={3} maxLength={160}
          placeholder="دوّن ملاحظة عن رحلتك وملاذك الآمن..."
          className="w-full bg-app-surface border border-teal-500/30 rounded-xl px-4 py-3 text-sm text-app-primary outline-none resize-none placeholder:text-app-muted focus:border-teal-400 focus:ring-1 focus:ring-teal-400/20 transition-all font-sans leading-relaxed text-center"
        />
        <div className="flex justify-center gap-3 mt-3">
          <button onClick={cancel} className="px-4 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
            إلغاء
          </button>
          <button onClick={save} className="flex items-center gap-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 px-5 py-1.5 rounded-full text-xs font-bold text-slate-950 shadow-[0_0_15px_rgba(45,212,191,0.4)] hover:shadow-[0_0_20px_rgba(45,212,191,0.6)] transition-all">
            <Check size={14} /> حفظ المذكرة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 px-4 flex justify-center group relative cursor-text" onClick={() => setEditing(true)}>
      <p className="text-sm text-app-muted leading-relaxed text-center italic opacity-80 group-hover:opacity-100 transition-opacity max-w-[280px]">
        "{bio || "لم يتم تدوين شيء هنا بعد. اضغط للتدوين في رحلتك المدارية."}"
      </p>
      <div className="absolute -right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Pencil size={12} className="text-teal-400" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Stats Row (Holographic Glass)
   ══════════════════════════════════════════ */
function StatsRow({ xp, achievements, quizCount, level }: {
  xp: number; achievements: number; quizCount: number; level: number;
}) {
  const items = [
    { value: xp, label: "طاقة XP", color: "#2dd4bf", icon: <Zap size={15} /> },
    { value: achievements, label: "بصائر", color: "#fbbf24", icon: <Award size={15} /> },
    { value: quizCount, label: "وقفات", color: "#60a5fa", icon: <BarChart3 size={15} /> },
    { value: level, label: "مرتبة", color: "#c084fc", icon: <Orbit size={15} /> },
  ];
  
  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {items.map((s, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.05, type: "spring", bounce: 0.4 }}
          className="bg-app-surface border border-app-border rounded-2xl py-3 px-1 text-center flex flex-col items-center shadow-sm"
          style={{ borderTopColor: `${s.color}40` }}>
          <div className="mb-2 p-1.5 rounded-full" style={{ background: `${s.color}15`, color: s.color, filter: `drop-shadow(0 0 5px ${s.color}40)` }}>
            {s.icon}
          </div>
          <p className="m-0 text-lg font-black text-slate-100 font-sans tabular-nums">{s.value}</p>
          <p className="m-0 mt-1 text-[10px] font-semibold text-slate-400">{s.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   Streak Card: Plasma Core
   ══════════════════════════════════════════ */
function StreakCard({ xp }: { xp: number }) {
  const streak = Math.min(30, Math.floor(xp / 15));
  const isActive = streak > 0;
  
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      className="relative overflow-hidden mb-6"
      style={{
        ...cosmicGlassBase,
        background: isActive ? "linear-gradient(135deg, rgba(67,20,7,0.8), rgba(3,7,18,0.9))" : cosmicGlassBase.background,
        border: isActive ? "1px solid rgba(244,63,94,0.3)" : cosmicGlassBase.border,
      }}
    >
      {isActive && (
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full" 
             style={{ background: "radial-gradient(circle, rgba(244,63,94,0.15) 0%, transparent 70%)", transform: "translate(30%, -30%)", filter: "blur(20px)" }} />
      )}
      <div className="p-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" 
               style={{ background: isActive ? "linear-gradient(135deg, rgba(244,63,94,0.2), rgba(251,191,36,0.1))" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${isActive ? "rgba(244,63,94,0.4)" : "rgba(255,255,255,0.1)"}`,
                        boxShadow: isActive ? "0 0 20px rgba(244,63,94,0.3)" : "none" }}>
            <Flame size={24} color={isActive ? "#fbbf24" : "#64748b"} style={{ filter: isActive ? "drop-shadow(0 0 5px rgba(251,191,36,0.5))" : "none" }} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-100 mb-0.5">
              {isActive ? `ملاذ نشط: ${streak} أيام متواصلة` : "شرارة البدء تنتظر"}
            </h3>
            <p className="text-[11px] font-medium text-slate-400 m-0">
              {isActive ? "استمرارية الحضور تزيد من مناعتك الإدراكية." : "ابنِ ملاذك بتسجيل حضورك اليوم."}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Journey Balance: Sovereign Radar summary
   ══════════════════════════════════════════ */
function JourneyBalance() {
  const allNodes = useMapState((s) => s.nodes);
  const activeNodes = useMemo(() => allNodes.filter((n) => !n.isNodeArchived && !n.isDetached), [allNodes]);
  const total = activeNodes.length;
  const green = activeNodes.filter((n) => n.ring === "green").length;
  const yellow = activeNodes.filter((n) => n.ring === "yellow").length;
  const red = activeNodes.filter((n) => n.ring === "red").length;
  const pct = total > 0 ? Math.round(((green * 1 + yellow * 0.5) / total) * 100) : 0;

  if (total === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      className="p-5 mb-6 relative overflow-hidden"
      style={cosmicGlassBase}
    >
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full" 
           style={{ background: "radial-gradient(circle, rgba(45,212,191,0.05) 0%, transparent 70%)", transform: "translate(40%, -40%)" }} />
           
      <div className="flex justify-between items-center mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20">
            <Map size={14} className="text-teal-400" />
          </div>
          <span className="text-sm font-bold text-slate-100">توازن الرادار الخاص بك</span>
        </div>
        <span className="text-lg font-black text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]">{pct}%</span>
      </div>

      <div className="h-2.5 rounded-full flex gap-1 bg-slate-800/50 p-0.5 border border-slate-700/50 mb-3 relative z-10 overflow-hidden">
        {green > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${(green / total) * 100}%` }} transition={{ duration: 1, delay: 0.5, ease: "easeOut" }} className="h-full rounded-[4px] relative" style={{ background: "linear-gradient(90deg, #10b981, #34d399)", boxShadow: "0 0 10px rgba(52,211,153,0.5)" }} />}
        {yellow > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${(yellow / total) * 100}%` }} transition={{ duration: 1, delay: 0.5, ease: "easeOut" }} className="h-full rounded-[4px] relative" style={{ background: "linear-gradient(90deg, #f59e0b, #fbbf24)", boxShadow: "0 0 10px rgba(251,191,36,0.5)" }} />}
        {red > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${(red / total) * 100}%` }} transition={{ duration: 1, delay: 0.5, ease: "easeOut" }} className="h-full rounded-[4px] relative" style={{ background: "linear-gradient(90deg, #e11d48, #fb7185)", boxShadow: "0 0 10px rgba(251,113,133,0.5)" }} />}
      </div>

      <div className="flex justify-between text-[10px] font-bold relative z-10 px-1">
        <span className="text-emerald-400 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_currentColor]"></div>{green} في دائرة الأمان</span>
        <span className="text-amber-400 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_5px_currentColor]"></div>{yellow} في دائرة الحذر</span>
        <span className="text-rose-400 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_5px_currentColor]"></div>{red} في دائرة الخطر</span>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Achievements Summary
   ══════════════════════════════════════════ */
function AchievementsSummary({ unlockedIds, totalPoints }: { unlockedIds: string[]; totalPoints: number }) {
  const unlocked = unlockedIds.length;
  const total = ACHIEVEMENTS.length;
  const pct = total > 0 ? Math.round((unlocked / total) * 100) : 0;
  const recent = ACHIEVEMENTS.filter((a) => unlockedIds.includes(a.id)).slice(0, 5);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
      className="p-5 mb-6 relative overflow-hidden"
      style={cosmicGlassBase}
    >
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full" 
           style={{ background: "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)", filter: "blur(20px)" }} />

      <div className="flex justify-between items-center mb-5 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Sparkles size={14} className="text-purple-400" />
          </div>
          <span className="text-sm font-bold text-slate-100">سجل البصائر والمكاسب</span>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 font-semibold mb-0.5">النقاط الكلية</div>
          <div className="text-base font-black text-purple-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.4)] tracking-wide">
            {totalPoints.toLocaleString("en-US")}
          </div>
        </div>
      </div>

      <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden mb-5 border border-slate-700/50">
        <motion.div 
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #8b5cf6, #c084fc)", boxShadow: "0 0 10px rgba(167,139,250,0.6)" }} 
        />
      </div>

      {recent.length > 0 ? (
        <div>
          <div className="text-[9px] font-bold text-slate-500 mb-2 uppercase tracking-wider text-right">أحدث البصائر المكتشفة</div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ direction: "rtl" }}>
            {recent.map((a) => (
              <div key={a.id} title={a.title}
                className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-xl bg-slate-800/40 border border-slate-700 hover:border-purple-500/50 transition-colors shadow-inner"
              >
                {a.icon}
              </div>
            ))}
            {unlocked < total && (
              <div className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-lg bg-slate-900/50 border border-dashed border-slate-700 text-slate-600">
                +
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="py-4 text-center border border-dashed border-slate-700/50 rounded-xl bg-slate-800/20">
          <p className="m-0 text-[11px] font-medium text-slate-400">رحلتك بدأت للتو.. استكشف لتفتح آفاقاً جديدة.</p>
        </div>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Main Profile Component Shell
   ══════════════════════════════════════════ */


const RADAR_DIMS = [
  { label: "الكفاءة العاطفية", key: "emotional" },
  { label: "الوعي الذاتي", key: "awareness" },
  { label: "التعاطف", key: "empathy" },
  { label: "المرونة", key: "flexibility" },
  { label: "حل النزاعات", key: "conflict" },
  { label: "التواصل", key: "communication" },
];

function buildRadarDims(
  history: Array<{ quizId: string; quizTitle: string; score: number; maxScore: number; bandTitle: string; bandColor: string; timestamp: number }>,
  xp: number,
): RadarDim[] {
  const totals: Record<string, { sum: number; n: number }> = {};
  const init = () => RADAR_DIMS.forEach((d) => { if (!totals[d.key]) totals[d.key] = { sum: 0, n: 0 }; });
  init();

  for (const entry of history) {
    const pct = entry.maxScore > 0 ? (entry.score / entry.maxScore) * 100 : 0;
    const title = entry.quizTitle.toLowerCase();
    if (title.includes("عاطف") || title.includes("مشاعر")) { totals.emotional.sum += pct; totals.emotional.n++; }
    if (title.includes("وعي") || title.includes("ذات") || title.includes("شخصي") || title.includes("mbti")) { totals.awareness.sum += pct; totals.awareness.n++; }
    if (title.includes("تعاطف") || title.includes("علاقات") || title.includes("حب")) { totals.empathy.sum += pct; totals.empathy.n++; }
    if (title.includes("مرون") || title.includes("صمود") || title.includes("توتر") || title.includes("قلق")) { totals.flexibility.sum += pct; totals.flexibility.n++; }
    if (title.includes("نزاع") || title.includes("خلاف") || title.includes("حل")) { totals.conflict.sum += pct; totals.conflict.n++; }
    if (title.includes("تواصل") || title.includes("حوار") || title.includes("كلام") || title.includes("listen")) { totals.communication.sum += pct; totals.communication.n++; }
  }

  const xpBase = Math.min(90, 30 + xp * 0.4);
  
  // Shadow Memory / Entropy Integration
  const { entropyScore, state, primaryFactor } = calculateEntropy();

  return RADAR_DIMS.map((d) => {
    let baseVal = totals[d.key].n > 0
      ? Math.round(totals[d.key].sum / totals[d.key].n)
      : Math.round(xpBase + (Math.sin(d.label.charCodeAt(0)) * 12));

    // Apply Shadow Effects
    if (entropyScore >= 70 && state === "CHAOS") {
      // Burnout penalty
      if (d.key === "flexibility" || d.key === "emotional" || d.key === "awareness") {
        baseVal = Math.max(10, Math.round(baseVal * 0.8));
      }
    } else if (entropyScore <= 35 && state === "FLOW") {
      // Flow state boost
      baseVal = Math.min(100, Math.round(baseVal * 1.15));
    }

    // Specific pressure impacts
    if (primaryFactor === "relational_pressure" && (d.key === "empathy" || d.key === "conflict")) {
      baseVal = Math.max(10, Math.round(baseVal * 0.85)); // Relationship strain affects conflict resolution
    } else if (primaryFactor === "mood_instability" && d.key === "communication") {
      baseVal = Math.max(10, Math.round(baseVal * 0.9)); // Mood swings affect communication
    }

    return {
      label: d.label,
      value: baseVal,
    };
  });
}

/* ══════════════════════════════════════════
   Test History (Recent Activity)
   ══════════════════════════════════════════ */
function TestHistory({ history }: { history: Array<{ quizTitle: string; score: number; maxScore: number; timestamp: number }> }) {
  if (!history || history.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
      className="mb-6 relative overflow-hidden" style={cosmicGlassBase}
    >
      <div className="p-5 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-app-border bg-app-surface/40 text-right">
        <h2 className="text-sm font-bold flex items-center gap-2 text-app-primary">
          <BookOpen size={16} className="text-teal-600 dark:text-teal-400" />
          سجل الملاصقات والتقييمات
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-800/40 border-b border-white/5">
            <tr>
              <th className="px-5 py-3 font-semibold text-slate-400">التقييم</th>
              <th className="px-5 py-3 font-semibold text-slate-400">التاريخ</th>
              <th className="px-5 py-3 font-semibold text-slate-400">الدرجة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {history.slice().sort((a,b) => b.timestamp - a.timestamp).slice(0, 5).map((h, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors group cursor-default">
                <td className="px-5 py-4">
                  <span className="font-bold text-slate-200 group-hover:text-teal-300 transition-colors">{h.quizTitle}</span>
                </td>
                <td className="px-5 py-4 text-slate-400">
                  {new Date(h.timestamp).toLocaleDateString("ar-EG", { year: 'numeric', month: 'long', day: 'numeric' })}
                </td>
                <td className="px-5 py-4">
                  <span className="font-black text-teal-400 drop-shadow-[0_0_5px_rgba(45,212,191,0.3)]">{h.score}/{h.maxScore}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

interface UserProfileProps {
  onBack?: () => void;
}

export function UserProfile({ onBack }: UserProfileProps) {
  const { xp, rank, level } = useGamificationState();
  const unlockedIds = useAchievementState((s) => s.unlockedIds);
  const totalPoints = useAchievementState((s) => s.totalPoints);
  const { history } = useQuizHistory();
  const cfg = RANK_CONFIG[rank] ?? DEFAULT_RANK;

  const radarDims = useMemo(() => buildRadarDims(history, xp), [history, xp]);

  const memberSince = useMemo(() => {
    if (history.length === 0) return "اليوم";
    const oldest = Math.min(...history.map((h) => h.timestamp));
    const days = Math.floor((Date.now() - oldest) / 86400000);
    if (days < 1) return "اليوم";
    if (days < 30) return `${days} يوم`;
    return `${Math.floor(days / 30)} شهر`;
  }, [history]);

  return (
    <div dir="rtl" className="min-h-screen relative overflow-hidden bg-app text-app-primary">
      {/* Background Accents for extra immersion */}
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ background: "radial-gradient(circle at 50% -10%, var(--soft-teal) 0%, transparent 60%)" }} />

      <div className="max-w-xl mx-auto px-4 pt-6 pb-24 relative z-10">
        
        {/* Top Navbar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="w-10 h-10 rounded-full glass-card border border-teal-500/20 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all hover:border-teal-500/40">
                <ArrowLeft size={18} />
              </button>
            )}
            <h1 className="text-xl font-black m-0 text-transparent bg-clip-text bg-gradient-to-l from-slate-100 to-slate-400 border-b border-transparent">
              هوية الملاذ
            </h1>
          </div>
        </div>

        {/* Identity Head */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative pt-6 pb-8 px-6 flex flex-col items-center mb-8"
          style={cosmicGlassBase}
        >
          {/* Subtle Top Glow */}
          <div className="absolute top-0 left-10 right-10 h-[1px] rounded-full" style={{ background: "linear-gradient(90deg, transparent, rgba(45,212,191,0.5), transparent)" }} />
          
          <ProfileAvatar rank={rank} level={level} />
          
          <h2 className="text-2xl font-black text-slate-50 tracking-wide mb-2">المسافر</h2>
          
          <div className="flex items-center gap-2 rounded-full px-4 py-1.5 mb-5" style={{ background: `${cfg.color}10`, border: `1px solid ${cfg.color}30` }}>
            <span className="text-sm">{cfg.emoji}</span>
            <span className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
          </div>

          <div className="text-[10px] font-semibold text-slate-400 capitalize tracking-widest opacity-80">
            انطلق في رحلته منذ: {memberSince}
          </div>

          <EditableBio />
        </motion.div>

        {/* Analytics Grid */}
        <StatsRow xp={xp} achievements={unlockedIds.length} quizCount={history.length} level={level} />

        <StreakCard xp={xp} />

        {/* Daily Quests */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-6">
          <DailyQuests />
        </motion.div>

        {/* Radar Growth */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="p-5 mb-6" style={cosmicGlassBase}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-teal-400" />
            <span className="text-sm font-bold text-slate-100">رادار النمو الإدراكي</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-6 font-medium leading-relaxed">
            يعكس هذا الهولوغرام أبعاد شخصيتك وتفاعلاتك داخل الملاذ. يتشكل الرادار بناءً على القرارات والمواقف التي تتخذها.
          </p>
          <PersonalityRadar dims={radarDims} size={280} />
        </motion.div>

        <JourneyBalance />
        
        <AchievementsSummary unlockedIds={unlockedIds} totalPoints={totalPoints} />
        
        <TestHistory history={history} />

        {/* Footer Signature */}
        <div className="mt-12 text-center opacity-70">
          <Orbit className="w-6 h-6 text-teal-500/50 mx-auto mb-3 animate-spin duration-1000" style={{ animationDuration: '20s' }} />
          <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">
            SAFE HAVEN SOVEREIGNTY ENGINE OS V1.0
          </p>
        </div>

      </div>
    </div>
  );
}

