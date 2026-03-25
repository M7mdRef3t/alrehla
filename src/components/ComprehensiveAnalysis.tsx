"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ChevronLeft, ChevronRight, RotateCcw,
  Sparkles, AlertTriangle, CheckCircle, ArrowUp,
  Clock, Save, CheckCheck, Users,
} from "lucide-react";
import { CA_DIMENSIONS, generateRecommendations, type CADimension } from "../data/comprehensiveAssessmentData";
import { PartnerCompare } from "./PartnerCompare";
import { saveAnalysisResult, generateShareCode } from "../services/partnerCompareService";
import { useQuizHistory } from "../hooks/useQuizHistory";

/* ══════════════════════════════════════════
   Save / Resume — localStorage
   ══════════════════════════════════════════ */

const SESSION_KEY = "alrehla_ca_session";

interface SavedSession {
  dimIndex: number;
  qIndex: number;
  answers: Record<string, number[]>;
  savedAt: number;
}

function loadSession(): SavedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SavedSession) : null;
  } catch { return null; }
}

function saveSession(session: SavedSession) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch { /* ignore */ }
}

function clearSession() {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}

/* ══════════════════════════════════════════
   State Types
   ══════════════════════════════════════════ */

type CAState =
  | { phase: "intro"; savedSession: SavedSession | null }
  | { phase: "quiz"; dimIndex: number; qIndex: number; answers: Record<string, number[]>; savedAt?: number }
  | { phase: "result"; scores: Record<string, number>; total: number }
  | { phase: "compare"; shareCode: string }
  | { phase: "partner-quiz"; shareCode: string; dimIndex: number; qIndex: number; answers: Record<string, number[]> }
  | { phase: "partner-result"; shareCode: string };

/* ══════════════════════════════════════════
   Timer Hook
   ══════════════════════════════════════════ */

function useTimer(initialSeconds: number, running: boolean) {
  const [seconds, setSeconds] = useState(initialSeconds);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const label = seconds === 0 ? "انتهى الوقت" : `${mins}:${secs.toString().padStart(2, "0")}`;
  return { seconds, label };
}

/* ══════════════════════════════════════════
   Section Sidebar
   ══════════════════════════════════════════ */

function SectionSidebar({ activeDimIndex, answers }: {
  activeDimIndex: number;
  answers: Record<string, number[]>;
}) {
  return (
    <div style={{
      width: 200,
      flexShrink: 0,
      background: "rgba(255,255,255,0.02)",
      borderLeft: "1px solid rgba(255,255,255,0.06)",
      display: "flex",
      flexDirection: "column",
      padding: "24px 0",
    }}>
      {CA_DIMENSIONS.map((dim, idx) => {
        const dimAnswers = answers[dim.id] ?? [];
        const isCompleted = dimAnswers.length >= dim.questions.length;
        const isActive = idx === activeDimIndex;
        const isUpcoming = idx > activeDimIndex && !isCompleted;

        return (
          <div key={dim.id} style={{
            padding: "12px 18px",
            borderRight: isActive ? `3px solid ${dim.color}` : "3px solid transparent",
            background: isActive ? `${dim.color}08` : "transparent",
            display: "flex", alignItems: "center", gap: 10,
            transition: "all 0.2s",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: isCompleted ? "#34D39920" : isActive ? `${dim.color}20` : "rgba(255,255,255,0.04)",
              border: `1px solid ${isCompleted ? "#34D399" : isActive ? dim.color : "rgba(255,255,255,0.08)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, flexShrink: 0,
            }}>
              {isCompleted ? <CheckCheck size={13} color="#34D399" /> : dim.emoji}
            </div>
            <div>
              <p style={{
                margin: 0, fontSize: 12, fontWeight: isActive ? 700 : 500,
                color: isCompleted ? "#34D399" : isActive ? dim.color : "#475569",
              }}>
                {dim.title}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: "#334155" }}>
                {isCompleted ? "مكتمل ✓" : isActive ? `${dim.questions.length} أسئلة` : "قادم"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════
   Radio Option
   ══════════════════════════════════════════ */

function RadioOption({ text, selected, onSelect }: { text: string; selected: boolean; onSelect: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        borderRadius: 14,
        border: `1.5px solid ${selected ? "#14B8A6" : "rgba(255,255,255,0.07)"}`,
        background: selected ? "rgba(20,184,166,0.12)" : "rgba(255,255,255,0.02)",
        cursor: "pointer",
        textAlign: "right",
        transition: "border 0.15s, background 0.15s",
      }}
    >
      {/* Radio circle */}
      <div style={{
        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
        border: `2px solid ${selected ? "#14B8A6" : "rgba(255,255,255,0.2)"}`,
        background: selected ? "#14B8A6" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s",
      }}>
        {selected && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#0a0d18" }} />}
      </div>
      <span style={{ fontSize: 15, color: selected ? "#e2e8f0" : "#94a3b8", fontWeight: selected ? 600 : 400 }}>
        {text}
      </span>
    </motion.button>
  );
}

/* ══════════════════════════════════════════
   Radar Chart
   ══════════════════════════════════════════ */

function AnalysisRadar({ dimensions, scores, size = 240 }: {
  dimensions: CADimension[]; scores: Record<string, number>; size?: number;
}) {
  const cx = size / 2, cy = size / 2, r = size * 0.36;
  const n = dimensions.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i: number, radius: number) => ({
    x: cx + radius * Math.cos(angle(i)),
    y: cy + radius * Math.sin(angle(i)),
  });
  const rings = [0.25, 0.5, 0.75, 1];
  const gridPts = (f: number) => dimensions.map((_, i) => `${pt(i, r * f).x},${pt(i, r * f).y}`).join(" ");
  const dataPts = dimensions.map((d, i) => {
    const val = (scores[d.id] ?? 0) / 12;
    return `${pt(i, r * val).x},${pt(i, r * val).y}`;
  }).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings.map((f, idx) => (
        <polygon key={idx} points={gridPts(f)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {dimensions.map((_, i) => {
        const o = pt(i, r);
        return <line key={i} x1={cx} y1={cy} x2={o.x} y2={o.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
      })}
      <defs>
        <linearGradient id="ca-radar-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <motion.polygon
        initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        points={dataPts} fill="url(#ca-radar-fill)" stroke="#14B8A6"
        strokeWidth="2" strokeLinejoin="round"
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {dimensions.map((d, i) => {
        const valPt = pt(i, r * ((scores[d.id] ?? 0) / 12));
        return <circle key={i} cx={valPt.x} cy={valPt.y} r="5" fill={d.color} stroke="#080b15" strokeWidth="2" />;
      })}
      {dimensions.map((d, i) => {
        const lblPt = pt(i, r * 1.25);
        const anchor = lblPt.x < cx - 5 ? "end" : lblPt.x > cx + 5 ? "start" : "middle";
        return (
          <text key={i} x={lblPt.x} y={lblPt.y + 4} textAnchor={anchor}
            fontSize="11" fill="#94a3b8" fontFamily="Cairo, sans-serif">
            {d.emoji} {d.title}
          </text>
        );
      })}
    </svg>
  );
}

/* ══════════════════════════════════════════
   Intro Screen
   ══════════════════════════════════════════ */

function IntroScreen({ savedSession, onStart, onResume, onBack }: {
  savedSession: SavedSession | null;
  onStart: () => void;
  onResume: (session: SavedSession) => void;
  onBack?: () => void;
}) {
  const hoursAgo = savedSession
    ? Math.round((Date.now() - savedSession.savedAt) / (1000 * 60 * 60))
    : 0;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px 60px", textAlign: "center" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🧠</div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#e2e8f0" }}>تحليل العلاقات الشامل</h1>
        <p style={{ margin: "12px 0 28px", fontSize: 14, color: "#64748b", lineHeight: 1.8, maxWidth: 420, marginInline: "auto" }}>
          20 سؤال عبر 5 أبعاد — نمط التعلق، الحدود، الاستقلال العاطفي، التواصل، والوعي الذاتي.
        </p>

        {/* Resume Banner */}
        {savedSession && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.25)",
              borderRadius: 16, padding: "14px 20px", marginBottom: 20,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#14B8A6" }}>جلسة محفوظة</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#475569" }}>
                القسم {savedSession.dimIndex + 1} • سؤال {savedSession.qIndex + 1} •
                {hoursAgo === 0 ? " منذ قليل" : ` منذ ${hoursAgo} ساعة`}
              </p>
            </div>
            <button
              onClick={() => onResume(savedSession)}
              style={{
                background: "linear-gradient(135deg, #14B8A6, #0d9488)",
                border: "none", borderRadius: 10, padding: "8px 18px",
                color: "#0a0d18", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}
            >
              استكمل ←
            </button>
          </motion.div>
        )}

        {/* Dimensions preview */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28, textAlign: "right" }}>
          {CA_DIMENSIONS.map((dim) => (
            <div key={dim.id} style={{
              background: `${dim.color}08`, border: `1px solid ${dim.color}20`,
              borderRadius: 14, padding: "10px 14px",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 22 }}>{dim.emoji}</span>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{dim.title}</p>
                <p style={{ margin: 0, fontSize: 10, color: "#475569" }}>4 أسئلة</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={onStart} style={{
            background: "linear-gradient(135deg, #14B8A6, #0d9488)",
            border: "none", borderRadius: 16, padding: "14px 36px",
            color: "#0a0d18", fontSize: 16, fontWeight: 800, cursor: "pointer",
          }}>
            {savedSession ? "ابدأ من جديد" : "ابدأ التحليل ←"}
          </button>
          {onBack && (
            <button onClick={onBack} style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16, padding: "14px 24px",
              color: "#94a3b8", fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <ArrowLeft size={14} /> رجوع
            </button>
          )}
        </div>
        <p style={{ margin: "24px 0 0", fontSize: 11, color: "#1e293b" }}>
          ≈ 8 دقائق • سري تماماً • يحفظ تلقائياً
        </p>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Quiz Phase — full redesign
   ══════════════════════════════════════════ */

function QuizPhase({ state, onAnswer, onPrev, onSave, onBack }: {
  state: Extract<CAState, { phase: "quiz" }>;
  onAnswer: (value: number) => void;
  onPrev: () => void;
  onSave: () => void;
  onBack: () => void;
}) {
  const dim = CA_DIMENSIONS[state.dimIndex];
  const q = dim.questions[state.qIndex];
  const totalQ = CA_DIMENSIONS.reduce((s, d) => s + d.questions.length, 0);
  const doneQ = CA_DIMENSIONS.slice(0, state.dimIndex).reduce((s, d) => s + d.questions.length, 0) + state.qIndex;
  const progress = ((doneQ) / totalQ) * 100;
  const currentAnswer = state.answers[dim.id]?.[state.qIndex];
  const hasPrev = state.qIndex > 0 || state.dimIndex > 0;
  const { label: timerLabel, seconds } = useTimer(480, true);
  const timerColor = seconds < 60 ? "#F87171" : seconds < 120 ? "#FBBF24" : "#64748b";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080b15" }}>
      {/* Section Sidebar */}
      <SectionSidebar activeDimIndex={state.dimIndex} answers={state.answers} />

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Top bar */}
        <div style={{
          padding: "14px 24px", display: "flex", alignItems: "center", gap: 12,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex" }}>
            <ArrowLeft size={18} color="#94a3b8" />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                style={{ height: "100%", borderRadius: 4, background: `linear-gradient(90deg, #14B8A6, ${dim.color})` }}
              />
            </div>
          </div>
          {/* Timer */}
          <div style={{ display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
            <Clock size={13} color={timerColor} />
            <span style={{ fontSize: 13, fontWeight: 600, color: timerColor }}>
              {timerLabel}
            </span>
          </div>
        </div>

        {/* Section + Question counter */}
        <div style={{ padding: "20px 32px 0" }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: dim.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            القسم: {dim.title}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 800, color: "#e2e8f0" }}>
            سؤال {doneQ + 1} من {totalQ}
          </p>
        </div>

        {/* Question Card */}
        <div style={{ flex: 1, padding: "24px 32px 16px", maxWidth: 600, width: "100%" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${state.dimIndex}-${state.qIndex}`}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
            >
              {/* Question bubble */}
              <div style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 20, padding: "22px 24px", marginBottom: 20,
              }}>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.7 }}>
                  {q.question}
                </p>
              </div>

              {/* Radio options */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {q.options.map((opt, i) => (
                  <RadioOption
                    key={i}
                    text={opt.text}
                    selected={currentAnswer === opt.value}
                    onSelect={() => onAnswer(opt.value)}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom nav */}
        <div style={{
          padding: "16px 32px", borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            style={{
              background: "none", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12, padding: "10px 20px",
              color: hasPrev ? "#94a3b8" : "#1e293b", fontSize: 13, cursor: hasPrev ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <ChevronRight size={15} /> السابق
          </button>

          <button
            onClick={onSave}
            style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12, padding: "10px 20px",
              color: "#475569", fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <Save size={14} /> حفظ الجلسة
          </button>

          <button
            onClick={() => currentAnswer !== undefined && onAnswer(currentAnswer)}
            disabled={currentAnswer === undefined}
            style={{
              background: currentAnswer !== undefined
                ? "linear-gradient(135deg, #14B8A6, #0d9488)"
                : "rgba(255,255,255,0.04)",
              border: "none", borderRadius: 12, padding: "10px 20px",
              color: currentAnswer !== undefined ? "#0a0d18" : "#1e293b",
              fontSize: 13, fontWeight: 700, cursor: currentAnswer !== undefined ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            التالي <ChevronLeft size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Circular Gauge
   ══════════════════════════════════════════ */

function CircularGauge({ pct, label, color, size = 160 }: {
  pct: number; label: string; color: string; size?: number;
}) {
  const r = size * 0.4;
  const cx = size / 2, cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - pct / 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size * 0.08} />
          <motion.circle
            cx={cx} cy={cy} r={r} fill="none"
            stroke={color} strokeWidth={size * 0.08}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <motion.span
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            style={{ fontSize: size * 0.22, fontWeight: 800, color: "#e2e8f0", lineHeight: 1 }}
          >
            {pct}%
          </motion.span>
          <span style={{ fontSize: size * 0.09, color: "#64748b", marginTop: 4 }}>{label}</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   AI Insights Generator
   ══════════════════════════════════════════ */

interface AIInsight { tag: string; title: string; body: string; color: string; emoji: string }

function generateAIInsights(scores: Record<string, number>): AIInsight[] {
  const sorted = [...CA_DIMENSIONS].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  const strongScore = scores[strongest.id] ?? 0;
  const weakScore = scores[weakest.id] ?? 0;
  const strongInterp = strongest.interpret(strongScore);
  const weakInterp = weakest.interpret(weakScore);

  // Dynamic pattern
  const avgScore = Object.values(scores).reduce((s, v) => s + v, 0) / CA_DIMENSIONS.length;
  const dynamicLabel = avgScore >= 9 ? "توازن صحي" : avgScore >= 6 ? "علاقة في طور النمو" : "ديناميكية تحتاج مراجعة";
  const dynamicBody = avgScore >= 9
    ? "علاقتك مبنية على أسس متوازنة. استمر في تعزيز نقاط قوتك وانتبه لأي تغيرات مستقبلية."
    : avgScore >= 6
      ? "علاقتك لديها إمكانات قوية. العمل على مجالات النمو سيحدث فرقاً ملموساً."
      : "العلاقة بحاجة لمراجعة عميقة. الخطوة الأولى هي الوعي — وأنت بالفعل هنا.";

  return [
    {
      tag: "نقطة قوة",
      title: `${strongest.title} — ${strongInterp.label}`,
      body: `${strongest.emoji} ${strongInterp.description}`,
      color: strongest.color,
      emoji: "⭐",
    },
    {
      tag: "مجال النمو",
      title: `${weakest.title} — ${weakInterp.label}`,
      body: `${weakest.emoji} ${weakInterp.description}`,
      color: weakest.color,
      emoji: "🌱",
    },
    {
      tag: "ديناميكية العلاقة",
      title: dynamicLabel,
      body: dynamicBody,
      color: "#A78BFA",
      emoji: "🔮",
    },
  ];
}

/* ══════════════════════════════════════════
   Action Plan Generator
   ══════════════════════════════════════════ */

const ACTION_PLANS: Record<string, { icon: string; title: string; desc: string }[]> = {
  attachment: [
    { icon: "💬", title: "جلسة التواصل الأسبوعية", desc: "خصص 30 دقيقة أسبوعياً لمحادثة عميقة غير مرتبطة بالمهام اليومية." },
    { icon: "📓", title: "يوميات المشاعر", desc: "اكتب 3 مشاعر شعرت بها اليوم كل صباح — بدون حكم أو تفسير." },
  ],
  boundaries: [
    { icon: "🚧", title: "حد واحد أسبوعياً", desc: "اختر موقفاً واحداً هذا الأسبوع وقل 'لا' بهدوء وحزم." },
    { icon: "📋", title: "قائمة قيمي الشخصية", desc: "اكتب 5 أشياء لا تقبل التفاوط عليها في علاقاتك." },
  ],
  codependency: [
    { icon: "🌟", title: "نشاطك المستقل الأسبوعي", desc: "خصص وقتاً لنشاط تحبه وحدك بدون شريان." },
    { icon: "🗣️", title: "احتياجاتك بصوت عالٍ", desc: "اذكر احتياجاً واحداً بوضوح لشخص قريب منك هذا الأسبوع." },
  ],
  communication: [
    { icon: "👂", title: "الاستماع الفعّال", desc: "في محادثتك القادمة، استمع حتى النهاية قبل أن ترد — بدون إكمال جمل للآخر." },
    { icon: "🔤", title: "التعبير بـ 'أنا'", desc: "استبدل 'أنت دائماً...' بـ 'أنا أشعر بـ...' في أي خلاف قادم." },
  ],
  selfawareness: [
    { icon: "🧘", title: "5 دقائق تأمل يومياً", desc: "قبل النوم، اسأل نفسك: ما المشاعر التي سيطرت عليّ اليوم ولماذا؟" },
    { icon: "🔍", title: "تتبع الأنماط", desc: "لاحظ المواقف التي تثير ردود فعل انفعالية عندك — سجّلها بدون تبرير." },
  ],
};

function generateActionPlan(scores: Record<string, number>): { icon: string; title: string; desc: string }[] {
  const sorted = [...CA_DIMENSIONS].sort((a, b) => (scores[a.id] ?? 0) - (scores[b.id] ?? 0));
  const steps: { icon: string; title: string; desc: string }[] = [];
  for (const dim of sorted.slice(0, 3)) {
    const dimSteps = ACTION_PLANS[dim.id] ?? [];
    if (dimSteps[0]) steps.push(dimSteps[0]);
    if (steps.length >= 4) break;
    if (dimSteps[1]) steps.push(dimSteps[1]);
    if (steps.length >= 4) break;
  }
  return steps.slice(0, 4);
}

/* ══════════════════════════════════════════
   Cross-Quiz Aggregate Analysis
   ══════════════════════════════════════════ */

const PATTERN_LABELS: Array<{ min: number; max: number; label: string; emoji: string; color: string; desc: string }> = [
  { min: 0, max: 20, label: "في بداية رحلة الوعي", emoji: "🌱", color: "#F87171", desc: "الوعي الذاتي يتشكّل — كل خطوة تُحسب." },
  { min: 21, max: 45, label: "نمو متسارع", emoji: "🔥", color: "#FBBF24", desc: "أنت في مرحلة بناء مشاعر أكثر وضوحاً." },
  { min: 46, max: 65, label: "علاقات واعية", emoji: "💡", color: "#A78BFA", desc: "تفهم نفسك جيداً وتسعى لتعميق العلاقات." },
  { min: 66, max: 80, label: "ناضج عاطفياً", emoji: "⭐", color: "#34D399", desc: "وعيك العلائقي متقدم — نادر وقيّم." },
  { min: 81, max: 100, label: "قائد في الصحة النفسية", emoji: "🏆", color: "#14B8A6", desc: "من أعلى 5% من المستخدمين في الإدراك النفسي." },
];

function CrossQuizPanel({ caOverallPct }: { caOverallPct: number }) {
  const { history, totalCompleted } = useQuizHistory();
  const quizScores = history
    .filter((e, i, arr) => arr.findIndex((x) => x.quizId === e.quizId) === i)
    .map((e) => ({
      title: e.quizTitle.replace("اختبار ", "").replace("مقياس ", "").replace("مؤشر ", ""),
      pct: Math.round((e.score / e.maxScore) * 100),
      color: e.bandColor,
    }));
  const allScores = [...quizScores.map((q) => q.pct), caOverallPct];
  const avgPct = Math.round(allScores.reduce((s, v) => s + v, 0) / allScores.length);
  const pattern = PATTERN_LABELS.find((p) => avgPct >= p.min && avgPct <= p.max) ?? PATTERN_LABELS[PATTERN_LABELS.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}
      style={{
        background: `linear-gradient(135deg, ${pattern.color}10, ${pattern.color}05)`,
        border: `1px solid ${pattern.color}25`, borderRadius: 20, padding: "18px 18px", marginBottom: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 16 }}>🧠</span>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#e2e8f0" }}>نمطك العلائقي العام</h3>
        <span style={{ fontSize: 8, fontWeight: 700, color: pattern.color, background: `${pattern.color}18`, padding: "2px 8px", borderRadius: 20, marginRight: "auto" }}>
          AI · {totalCompleted + 1} اختبار
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: "12px 14px", marginBottom: quizScores.length > 0 ? 10 : 0 }}>
        <span style={{ fontSize: 32 }}>{pattern.emoji}</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: pattern.color }}>{pattern.label}</p>
          <p style={{ margin: "3px 0 0", fontSize: 10, color: "#64748b", lineHeight: 1.5 }}>{pattern.desc}</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: pattern.color }}>{avgPct}%</div>
          <div style={{ fontSize: 8, color: "#334155" }}>معدل مجمّع</div>
        </div>
      </div>
      {quizScores.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {[...quizScores, { title: "التحليل الشامل", pct: caOverallPct, color: "#14B8A6" }].map((q, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 9, color: "#475569", width: 110, textAlign: "right", flexShrink: 0 }}>{q.title}</span>
              <div style={{ flex: 1, height: 3, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${q.pct}%` }}
                  transition={{ duration: 0.5, delay: 0.08 * i }}
                  style={{ height: "100%", background: q.color, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, color: q.color, width: 28 }}>{q.pct}%</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Result Report — V2
   ══════════════════════════════════════════ */

function ResultReport({ scores, total, onRetry, onBack, onCompare }: {
  scores: Record<string, number>; total: number;
  onRetry: () => void; onBack?: () => void;
  onCompare?: () => void;
}) {
  const maxTotal = CA_DIMENSIONS.length * 12;
  const overallPct = Math.round((total / maxTotal) * 100);
  const gaugeColor = overallPct >= 66 ? "#14B8A6" : overallPct >= 40 ? "#FBBF24" : "#F87171";
  const overallLabel = overallPct >= 66 ? "تحليل عميق للعلاقة" : overallPct >= 40 ? "مرحلة التطوير" : "يستحق الاهتمام";
  const aiInsights = useMemo(() => generateAIInsights(scores), [scores]);
  const actionPlan = useMemo(() => generateActionPlan(scores), [scores]);
  const reportRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleDownload = useCallback(() => {
    const text = [
      "═══ تقرير تحليل العلاقات الشامل ═══",
      `التاريخ: ${new Date().toLocaleDateString("ar-EG")}`,
      `النسبة الكلية: ${overallPct}%`,
      "",
      "── النتائج بالأبعاد ──",
      ...CA_DIMENSIONS.map((d) => {
        const s = scores[d.id] ?? 0;
        const pct = Math.round((s / 12) * 100);
        const interp = d.interpret(s);
        return `${d.emoji} ${d.title}: ${pct}% — ${interp.label}`;
      }),
      "",
      "── رؤى الذكاء الاصطناعي ──",
      ...aiInsights.map((i) => `${i.emoji} ${i.tag}: ${i.title}\n${i.body}`),
      "",
      "── خطة العمل الأسبوعية ──",
      ...actionPlan.map((a, i) => `${i + 1}. ${a.title}: ${a.desc}`),
    ].join("\n");

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "relationship-analysis.txt";
    a.click(); URL.revokeObjectURL(url);
  }, [overallPct, aiInsights, actionPlan, scores]);

  const handleCopy = useCallback(() => {
    const text = `نتيجة تحليل العلاقات الشامل: ${overallPct}% — ${overallLabel}\n\nأبرز نقاط القوة: ${aiInsights[0].title}\nمجال النمو: ${aiInsights[1].title}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [overallPct, overallLabel, aiInsights]);

  return (
    <div ref={reportRef} style={{ maxWidth: 680, margin: "0 auto", padding: "28px 20px 60px" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#e2e8f0" }}>تقرير التحليل الشامل</h1>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "#334155" }}>{new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })}</p>
      </motion.div>

      {/* Gauge + Radar side by side */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14,
        }}>
        {/* Radar */}
        <div style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20,
          padding: 16, display: "flex", justifyContent: "center", alignItems: "center",
        }}>
          <AnalysisRadar dimensions={CA_DIMENSIONS} scores={scores} size={220} />
        </div>

        {/* Gauge + summary */}
        <div style={{
          background: `linear-gradient(135deg, ${gaugeColor}12, ${gaugeColor}06)`,
          border: `1px solid ${gaugeColor}30`, borderRadius: 20,
          padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
        }}>
          <CircularGauge pct={overallPct} label="معدل التوافق" color={gaugeColor} size={140} />
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#e2e8f0" }}>{overallLabel}</p>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#475569" }}>بناءً على 20 سؤال</p>
          </div>
        </div>
      </motion.div>

      {/* Dimension breakdown (compact) */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 20, padding: "16px 18px", marginBottom: 14,
        }}>
        <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>توزيع القوى النفسية</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {CA_DIMENSIONS.map((dim, idx) => {
            const score = scores[dim.id] ?? 0;
            const pct = Math.round((score / 12) * 100);
            const interp = dim.interpret(score);
            return (
              <div key={dim.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14 }}>{dim.emoji}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1" }}>{dim.title}</span>
                    <span style={{ fontSize: 10, color: "#334155" }}>({interp.label})</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: dim.color }}>{pct}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 3, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: 0.3 + idx * 0.07 }}
                    style={{ height: "100%", background: `linear-gradient(90deg, ${dim.color}, ${dim.color}99)`, borderRadius: 3 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* AI Insights — 3 cards */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Sparkles size={15} color="#A78BFA" />
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#e2e8f0" }}>رؤى الذكاء الاصطناعي</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {aiInsights.map((ins) => (
            <div key={ins.tag} style={{
              background: `${ins.color}08`, border: `1px solid ${ins.color}20`,
              borderRadius: 16, padding: "14px 14px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, color: ins.color,
                  background: `${ins.color}18`, padding: "2px 8px", borderRadius: 20,
                }}>
                  {ins.tag}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.4, marginBottom: 6 }}>{ins.title}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{ins.body}</p>
            </div>
          ))}
        </div>
      </motion.div>


      {/* Cross-Quiz Aggregate Analysis */}
      <CrossQuizPanel caOverallPct={overallPct} />

      {/* Action Plan */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
        style={{
          background: "linear-gradient(135deg, rgba(20,184,166,0.08), rgba(124,58,237,0.05))",
          border: "1px solid rgba(20,184,166,0.18)",
          borderRadius: 20, padding: "18px 18px", marginBottom: 16,
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <CheckCircle size={15} color="#14B8A6" />
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#e2e8f0" }}>خطة العمل المقترحة</h3>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {actionPlan.map((step, i) => (
            <div key={i} style={{
              display: "flex", gap: 12, alignItems: "flex-start",
              background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "12px 14px",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                background: "rgba(20,184,166,0.12)", border: "1px solid rgba(20,184,166,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
              }}>
                {step.icon}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{step.title}</p>
                <p style={{ margin: "3px 0 0", fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Compare with Partner */}
      {onCompare && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
          style={{ marginBottom: 12 }}>
          <button onClick={onCompare} style={{
            width: "100%", padding: "14px 20px", borderRadius: 16,
            background: "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(20,184,166,0.1))",
            border: "1px solid rgba(167,139,250,0.3)",
            color: "#e2e8f0", fontSize: 14, fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}>
            <Users size={18} color="#A78BFA" /> 💑 قارن مع الشريك
          </button>
        </motion.div>
      )}

      {/* Actions Row */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={handleDownload} style={{
          flex: 1, minWidth: 120, padding: "12px 16px", borderRadius: 14,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          color: "#94a3b8", fontSize: 13, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          📥 تحميل التقرير
        </button>
        <button onClick={handleCopy} style={{
          flex: 1, minWidth: 120, padding: "12px 16px", borderRadius: 14,
          background: copied ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.06)",
          border: `1px solid ${copied ? "rgba(52,211,153,0.3)" : "rgba(255,255,255,0.1)"}`,
          color: copied ? "#34D399" : "#94a3b8", fontSize: 13, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          transition: "all 0.2s",
        }}>
          {copied ? "✓ تم النسخ" : "🔗 مشاركة النتيجة"}
        </button>
        <button onClick={onRetry} style={{
          flex: 1, minWidth: 120, padding: "12px 16px", borderRadius: 14,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          color: "#64748b", fontSize: 13, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <RotateCcw size={14} /> أعد التحليل
        </button>
      </motion.div>

      {onBack && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          onClick={onBack} style={{
            width: "100%", padding: "14px", borderRadius: 14,
            background: "linear-gradient(135deg, #14B8A6, #0d9488)",
            border: "none", color: "#0a0d18", fontSize: 14, fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
          <ChevronRight size={16} /> رجوع للاختبارات
        </motion.button>
      )}

      <p style={{ textAlign: "center", fontSize: 10, color: "#1e293b", marginTop: 20 }}>
        هذا التقرير للتوعية الذاتية وليس بديلاً عن الاستشارة المتخصصة.
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════
   Main Exported Component
   ══════════════════════════════════════════ */

interface ComprehensiveAnalysisProps {
  onBack?: () => void;
  partnerShareCode?: string;
}

export function ComprehensiveAnalysis({ onBack, partnerShareCode }: ComprehensiveAnalysisProps) {
  const [state, setState] = useState<CAState>(() => {
    // If opened via partner share link, go directly to partner quiz
    if (partnerShareCode) {
      return { phase: "partner-quiz", shareCode: partnerShareCode, dimIndex: 0, qIndex: 0, answers: {} };
    }
    const saved = loadSession();
    return { phase: "intro", savedSession: saved };
  });

  const [saveConfirmed, setSaveConfirmed] = useState(false);

  /* Auto-save on every answer */
  useEffect(() => {
    if (state.phase !== "quiz") return;
    saveSession({
      dimIndex: state.dimIndex,
      qIndex: state.qIndex,
      answers: state.answers,
      savedAt: Date.now(),
    });
  }, [state]);

  const handleStart = useCallback(() => {
    clearSession();
    setState({ phase: "quiz", dimIndex: 0, qIndex: 0, answers: {} });
  }, []);

  const handleResume = useCallback((session: SavedSession) => {
    setState({
      phase: "quiz",
      dimIndex: session.dimIndex,
      qIndex: session.qIndex,
      answers: session.answers,
    });
  }, []);

  const handleAnswer = useCallback((value: number) => {
    setState((prev) => {
      if (prev.phase !== "quiz" && prev.phase !== "partner-quiz") return prev;
      const dim = CA_DIMENSIONS[prev.dimIndex];

      // Record answer
      const nextAnswers = { ...prev.answers };
      const dimAnswers = [...(nextAnswers[dim.id] ?? [])];
      dimAnswers[prev.qIndex] = value;
      nextAnswers[dim.id] = dimAnswers;

      // Advance
      const nextQ = prev.qIndex + 1;
      if (nextQ < dim.questions.length) {
        return { ...prev, qIndex: nextQ, answers: nextAnswers };
      }

      const nextDim = prev.dimIndex + 1;
      if (nextDim < CA_DIMENSIONS.length) {
        return { ...prev, dimIndex: nextDim, qIndex: 0, answers: nextAnswers };
      }

      // Done — compute
      const scores: Record<string, number> = {};
      let total = 0;
      for (const d of CA_DIMENSIONS) {
        const dimScore = (nextAnswers[d.id] ?? []).reduce((s: number, v: number) => s + v, 0);
        scores[d.id] = dimScore;
        total += dimScore;
      }
      clearSession();

      // Partner flow: save to Supabase then show comparison
      if (prev.phase === "partner-quiz") {
        saveAnalysisResult(prev.shareCode, "partner", scores, total);
        return { phase: "partner-result", shareCode: prev.shareCode };
      }

      return { phase: "result", scores, total };
    });
  }, []);

  const handlePrev = useCallback(() => {
    setState((prev) => {
      if (prev.phase !== "quiz" && prev.phase !== "partner-quiz") return prev;
      if (prev.qIndex > 0) {
        return { ...prev, qIndex: prev.qIndex - 1 };
      }
      if (prev.dimIndex > 0) {
        const prevDim = CA_DIMENSIONS[prev.dimIndex - 1];
        return { ...prev, dimIndex: prev.dimIndex - 1, qIndex: prevDim.questions.length - 1 };
      }
      return prev;
    });
  }, []);

  const handleSave = useCallback(() => {
    if (state.phase !== "quiz" && state.phase !== "partner-quiz") return;
    saveSession({
      dimIndex: state.dimIndex,
      qIndex: state.qIndex,
      answers: state.answers,
      savedAt: Date.now(),
    });
    setSaveConfirmed(true);
    setTimeout(() => setSaveConfirmed(false), 2000);
  }, [state]);

  const handleRetry = useCallback(() => {
    clearSession();
    setState({ phase: "intro", savedSession: null });
  }, []);

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#080b15", position: "relative" }}>
      {/* Save Confirmed Toast */}
      <AnimatePresence>
        {saveConfirmed && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
              background: "#14B8A6", color: "#0a0d18",
              padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 700,
              zIndex: 1000, display: "flex", alignItems: "center", gap: 8,
            }}
          >
            <Save size={14} /> تم حفظ جلستك ✓
          </motion.div>
        )}
      </AnimatePresence>

      {state.phase === "intro" && (
        <IntroScreen
          savedSession={state.savedSession}
          onStart={handleStart}
          onResume={handleResume}
          onBack={onBack}
        />
      )}
      {state.phase === "quiz" && (
        <QuizPhase
          state={state}
          onAnswer={handleAnswer}
          onPrev={handlePrev}
          onSave={handleSave}
          onBack={() => setState({ phase: "intro", savedSession: loadSession() })}
        />
      )}
      {state.phase === "result" && (
        <ResultReport
          scores={state.scores}
          total={state.total}
          onRetry={handleRetry}
          onBack={onBack}
          onCompare={async () => {
            const code = generateShareCode();
            await saveAnalysisResult(code, "initiator", state.scores, state.total);
            setState({ phase: "compare", shareCode: code });
          }}
        />
      )}
      {state.phase === "compare" && (
        <PartnerCompare
          shareCode={state.shareCode}
          onBack={() => setState({ phase: "intro", savedSession: loadSession() })}
        />
      )}
      {state.phase === "partner-quiz" && (
        <QuizPhase
          state={{ phase: "quiz", dimIndex: state.dimIndex, qIndex: state.qIndex, answers: state.answers }}
          onAnswer={handleAnswer}
          onPrev={handlePrev}
          onSave={handleSave}
          onBack={() => setState({ phase: "intro", savedSession: null })}
        />
      )}
      {state.phase === "partner-result" && (
        <PartnerCompare
          shareCode={state.shareCode}
          onBack={() => {
            if (onBack) onBack();
            else setState({ phase: "intro", savedSession: null });
          }}
        />
      )}
    </div>
  );
}
