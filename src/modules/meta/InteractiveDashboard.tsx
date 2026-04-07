"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Flame, Heart, Sparkles, TrendingUp,
  Users, Zap, CheckCircle2, Circle, ChevronRight, RefreshCw,
  Link2, BarChart3,
} from "lucide-react";
import { useGamificationState } from "@/services/gamificationEngine";
import { useAchievementState } from "@/state/achievementState";
import { useQuizHistory } from "@/hooks/useQuizHistory";
import { useMapState } from "@/state/mapState";
import { UserProfile } from "./UserProfile";


/* ══════════════════════════════════════════
   Pulse Storage (Quick Pulse data)
   ══════════════════════════════════════════ */

const PULSE_KEY = "alrehla_daily_pulse";
const WEEKLY_CAPSULE_KEY = "alrehla_weekly_capsule";

export interface PulseEntry {
  date: string;           // YYYY-MM-DD
  mood: number;           // 1-5
  reason: string;
  action: string;
  timestamp: number;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function loadPulseHistory(): PulseEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PULSE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function savePulseEntry(entry: PulseEntry) {
  const history = loadPulseHistory();
  const filtered = history.filter((e) => e.date !== entry.date);
  const next = [entry, ...filtered].slice(0, 30);
  localStorage.setItem(PULSE_KEY, JSON.stringify(next));
}

function loadWeeklyCapsule(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(WEEKLY_CAPSULE_KEY) ?? "";
}

function saveWeeklyCapsule(val: string) {
  localStorage.setItem(WEEKLY_CAPSULE_KEY, val);
}

/* ══════════════════════════════════════════
   Mood config
   ══════════════════════════════════════════ */

const MOODS = [
  { v: 1, emoji: "💔", label: "صعب", color: "#F87171" },
  { v: 2, emoji: "😔", label: "متعب", color: "var(--ds-color-accent-amber)" },
  { v: 3, emoji: "😐", label: "عادي", color: "var(--ds-theme-text-muted)" },
  { v: 4, emoji: "🙂", label: "بخير", color: "#34D399" },
  { v: 5, emoji: "✨", label: "رائع", color: "var(--ds-color-primary)" },
];

const REASONS = [
  "عمل / ضغط يومي", "علاقات", "صحة", "وقت وحدي", "شريكي", "إنجاز",
];

const ACTIONS = [
  "تأمل 5 دقائق", "أتكلم مع شخص", "أمشي بره", "أكتب مشاعري", "أسمع موسيقى", "أبقى مع نفسي",
];

const DAILY_TASKS = [
  { id: "t1", emoji: "🧘", title: "تأمل اليوم", desc: "5 دقائق صمت واعي", xp: 10 },
  { id: "t2", emoji: "💬", title: "جملة امتنان", desc: "قل لشريكك شيئاً تقدّره", xp: 15 },
  { id: "t3", emoji: "📝", title: "يوميات الحدود", desc: "سجّل حدودًا راعيتها اليوم", xp: 10 },
  { id: "t4", emoji: "❤️", title: "لغة الحب اليوم", desc: "مارس لغة الحب بوعي", xp: 20 },
];

const DONE_KEY = "alrehla_daily_tasks_done";
function loadDoneTasks(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DONE_KEY);
    if (!raw) return new Set();
    const { date, ids } = JSON.parse(raw);
    if (date !== todayStr()) return new Set();
    return new Set(ids);
  } catch { return new Set(); }
}
function saveDoneTasks(ids: Set<string>) {
  localStorage.setItem(DONE_KEY, JSON.stringify({ date: todayStr(), ids: Array.from(ids) }));
}

/* ══════════════════════════════════════════
   Hero / Greeting
   ══════════════════════════════════════════ */

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return { text: "ليلة هادئة 🌙", color: "var(--ds-color-accent-indigo)" };
  if (h < 12) return { text: "صباح النور ☀️", color: "var(--ds-color-accent-amber)" };
  if (h < 18) return { text: "نهار طيب 🌿", color: "#34D399" };
  return { text: "مساء الخير 🌆", color: "#60A5FA" };
}

function HeroSection({ xp, level, moodToday }: { xp: number; level: number; moodToday: PulseEntry | null }) {
  const { text, color } = getGreeting();
  const mood = moodToday ? MOODS.find((m) => m.v === moodToday.mood) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: "linear-gradient(135deg, var(--ds-color-primary-soft) 0%, rgba(167,139,250,0.06) 100%)",
        border: "1px solid var(--ds-color-border-default)", borderRadius: 22,
        padding: "20px 18px", marginBottom: 14, position: "relative", overflow: "hidden",
      }}>
      {/* Background glow */}
      <div style={{
        position: "absolute", top: -30, left: -30, width: 160, height: 160,
        background: "rgba(20,184,166,0.05)", borderRadius: "50%", pointerEvents: "none",
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 900, color }}>
            {text}
          </p>
          <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 900, color: "#e2e8f0" }}>
            لوحة تحكمك ✨
          </h2>
          <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>
            كل يوم خطوة نحو التوازن الحقيقي
          </p>
        </div>
        <div style={{ textAlign: "left" }}>
          {mood ? (
            <div style={{
              background: `${mood.color}12`, border: `1px solid ${mood.color}25`,
              borderRadius: 14, padding: "8px 12px", textAlign: "center",
            }}>
              <div style={{ fontSize: 22, marginBottom: 2 }}>{mood.emoji}</div>
              <p style={{ margin: 0, fontSize: 9, color: mood.color, fontWeight: 700 }}>
                حالتك اليوم
              </p>
            </div>
          ) : (
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.1)",
              borderRadius: 14, padding: "8px 12px", textAlign: "center",
            }}>
              <div style={{ fontSize: 20, marginBottom: 2 }}>❓</div>
              <p style={{ margin: 0, fontSize: 9, color: "#475569", fontWeight: 700 }}>
                كيف حالك؟
              </p>
            </div>
          )}
        </div>
      </div>

      {/* XP bar */}
      <div style={{ marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Zap size={11} color="#14B8A6" />
            <span style={{ fontSize: 10, color: "#14B8A6", fontWeight: 700 }}>المستوى {level}</span>
          </div>
          <span style={{ fontSize: 10, color: "#475569" }}>{xp} XP</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.05)" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (xp % 100))}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ height: "100%", background: "linear-gradient(90deg, var(--ds-color-primary), var(--ds-color-primary-strong))", borderRadius: 3 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   KPI Cards
   ══════════════════════════════════════════ */

interface MapNode {
  ring?: string;
  isNodeArchived?: boolean;
}

function KPICards({ history, nodes, unlockedIds, xp }: {
  history: ReturnType<typeof useQuizHistory>["history"];
  nodes: MapNode[];
  unlockedIds: string[];
  xp: number;
}) {
  const activeNodes = nodes.filter((n) => !n.isNodeArchived);
  const green = activeNodes.filter((n) => n.ring === "green").length;
  const total = activeNodes.length;
  const compatPct = total > 0 ? Math.round(((green) / total) * 100) : 0;

  // Partner compatibility from quiz history
  const latestQuiz = history[0];
  const quizPct = latestQuiz && latestQuiz.maxScore > 0
    ? Math.round((latestQuiz.score / latestQuiz.maxScore) * 100) : null;

  // Communication score from map balance
  const yellow = activeNodes.filter((n) => n.ring === "yellow").length;
  const commPct = total > 0 ? Math.round(((green + yellow * 0.7) / total) * 100) : 0;

  // Insight points = XP + achievements * 5
  const insight = xp + unlockedIds.length * 5;

  const kpis = [
    {
      label: "التوافق مع النفس",
      value: quizPct !== null ? `${quizPct}%` : `${compatPct}%`,
      icon: <Heart size={14} color="#F87171" />, color: "#F87171",
      sub: quizPct !== null ? latestQuiz!.bandTitle : `${green}/${total} علاقة`,
    },
    {
      label: "جودة التواصل",
      value: `${commPct}%`,
      icon: <Users size={14} color="#60A5FA" />, color: "#60A5FA",
      sub: `${green} قريب · ${yellow} متوازن`,
    },
    {
      label: "نقاط البصيرة",
      value: insight.toLocaleString("ar"),
      icon: <Sparkles size={14} color="#A78BFA" />, color: "#A78BFA",
      sub: `${unlockedIds.length} إنجاز مكتسب`,
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
      {kpis.map((k, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.08 }}
          style={{
            background: `${k.color}08`, border: `1px solid ${k.color}18`,
            borderRadius: 16, padding: "12px 10px", textAlign: "center",
            position: "relative", overflow: "hidden",
          }}>
          <div style={{
            position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
            width: 60, height: 60, background: `${k.color}06`, borderRadius: "50%",
          }} />
          <div style={{ marginBottom: 6 }}>{k.icon}</div>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#e2e8f0", lineHeight: 1 }}>
            {k.value}
          </p>
          <p style={{ margin: "3px 0 2px", fontSize: 9, color: k.color, fontWeight: 700 }}>
            {k.label}
          </p>
          <p style={{ margin: 0, fontSize: 8, color: "#334155" }}>{k.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   Partner Sync Badge
   ══════════════════════════════════════════ */

function PartnerSyncBadge() {
  const PARTNER_KEY = "alrehla_partner_code";
  const [partnerCode, setPartnerCode] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPartnerCode(localStorage.getItem(PARTNER_KEY));
    }
  }, []);

  const status: "linked" | "pending" | "none" = partnerCode ? "linked" : "none";

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      style={{
        background: status === "linked" ? "rgba(52,211,153,0.07)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${status === "linked" ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 14, padding: "10px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 10,
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: status === "linked" ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Link2 size={14} color={status === "linked" ? "#34D399" : "#475569"} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>
            {status === "linked" ? "شريكك متصل ✓" : "ربط مع الشريك"}
          </p>
          <p style={{ margin: "1px 0 0", fontSize: 9, color: "#475569" }}>
            {status === "linked"
              ? `كود: ${partnerCode}`
              : "أكمل تحليل المقارنة لتفعيل المزامنة"}
          </p>
        </div>
      </div>
      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        background: status === "linked" ? "#34D399" : "#334155",
        boxShadow: status === "linked" ? "0 0 6px #34D399" : "none",
      }} />
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Streak Momentum Bar
   ══════════════════════════════════════════ */

function StreakMomentum({ xp }: { xp: number }) {
  const streak = Math.min(30, Math.floor(xp / 15));
  const MAX = 30;
  const days = Array.from({ length: MAX }, (_, i) => i < streak);
  const momentum = streak < 3 ? "low" : streak < 7 ? "growing" : streak < 14 ? "strong" : "elite";
  const momentumConfig = {
    low: { label: "ابدأ سلسلتك", color: "#475569" },
    growing: { label: "متحرك 🔥", color: "#FBBF24" },
    strong: { label: "قوة حقيقية 💪", color: "#F87171" },
    elite: { label: "أسطورة 👑", color: "#A78BFA" },
  }[momentum];

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
      style={{
        background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.12)",
        borderRadius: 16, padding: "12px 14px", marginBottom: 10,
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Flame size={12} color="#F87171" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>
            {streak} يوم متتالي
          </span>
        </div>
        <span style={{ fontSize: 9, fontWeight: 700, color: momentumConfig.color }}>
          {momentumConfig.label}
        </span>
      </div>

      {/* Day dots */}
      <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
        {days.map((done, i) => (
          <motion.div key={i}
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.3 + i * 0.015 }}
            style={{
              width: 10, height: 10, borderRadius: 3,
              background: done
                ? i < 7 ? "#FBBF24" : i < 14 ? "#F87171" : "#A78BFA"
                : "rgba(255,255,255,0.06)",
              boxShadow: done ? `0 0 4px ${i < 7 ? "#FBBF24" : i < 14 ? "#F87171" : "#A78BFA"}50` : "none",
            }} />
        ))}
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 9, color: "#334155" }}>
        {MAX - streak} يوم متبقٍ لإتمام التحدي
      </p>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Mood Chart (Sparkline)
   ══════════════════════════════════════════ */

function MoodChart({ pulseHistory }: { pulseHistory: PulseEntry[] }) {
  const last7 = useMemo(() => {
    const result: (PulseEntry | null)[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      result.push(pulseHistory.find((p) => p.date === key) ?? null);
    }
    return result;
  }, [pulseHistory]);

  const labels = ["أ", "ث", "ر", "خ", "ج", "س", "ح"]; // أحد ثنين...
  const H = 60, W_TOTAL = 100, W = W_TOTAL / 7;

  const points = last7.map((p, i) => ({
    x: i * W + W / 2,
    y: p ? H - ((p.mood - 1) / 4) * (H - 10) - 5 : null,
    mood: p?.mood ?? null,
  }));

  const path = points
    .filter((p) => p.y !== null)
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const hasMood = points.some((p) => p.y !== null);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      style={{
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16, padding: "12px 14px", marginBottom: 10,
      }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
        <BarChart3 size={12} color="#60A5FA" />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>مزاجك — آخر 7 أيام</span>
      </div>

      {hasMood ? (
        <div style={{ position: "relative" }}>
          <svg width="100%" height={H} viewBox={`0 0 ${W_TOTAL} ${H}`} preserveAspectRatio="none">
            {/* Grid lines */}
            {[1, 2, 3, 4, 5].map((v) => {
              const y = H - ((v - 1) / 4) * (H - 10) - 5;
              return <line key={v} x1={0} y1={y} x2={W_TOTAL} y2={y}
                stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />;
            })}

            {/* Gradient area */}
            <defs>
              <linearGradient id="mood-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
              </linearGradient>
            </defs>

            {path && (
              <>
                <path d={`${path} V ${H} L ${points.filter((p) => p.y !== null)[0]?.x} ${H} Z`}
                  fill="url(#mood-fill)" />
                <motion.path d={path} fill="none" stroke="#14B8A6" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2 }} />
              </>
            )}

            {/* Dots */}
            {points.map((p, i) => p.y !== null && (
              <circle key={i} cx={p.x} cy={p.y!} r={2}
                fill="#14B8A6" stroke="#080b15" strokeWidth={1} />
            ))}
          </svg>

          {/* Day labels */}
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: 4 }}>
            {last7.map((p, i) => {
              const mood = p ? MOODS.find((m) => m.v === p.mood) : null;
              return (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 11, marginBottom: 1 }}>{mood?.emoji ?? "·"}</div>
                  <div style={{ fontSize: 7, color: "#334155" }}>{labels[i]}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <p style={{ margin: 0, fontSize: 11, color: "#334155" }}>
            لم تُسجّل نبضك بعد — استخدم Quick Pulse أدناه!
          </p>
        </div>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Quick Pulse — 3 steps
   ══════════════════════════════════════════ */

function QuickPulse({ onSave }: { onSave: (e: PulseEntry) => void }) {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0); // 0=closed, 1..3=steps, 3=done
  const [mood, setMood] = useState<number | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [, setAction] = useState<string | null>(null);

  const reset = () => { setStep(0); setMood(null); setReason(null); setAction(null); };

  const handleMood = (v: number) => { setMood(v); setStep(2); };
  const handleReason = (r: string) => { setReason(r); setStep(3); };
  const handleAction = (a: string) => {
    setAction(a);
    const entry: PulseEntry = {
      date: todayStr(),
      mood: mood!,
      reason: r ?? "",
      action: a,
      timestamp: Date.now(),
    };
    savePulseEntry(entry);
    onSave(entry);
    setTimeout(() => reset(), 1200);
  };

  const r = reason;

  const todayDone = loadPulseHistory().some((e) => e.date === todayStr());

  if (todayDone && step === 0) {
    const already = loadPulseHistory().find((e) => e.date === todayStr());
    const m = already ? MOODS.find((x) => x.v === already.mood) : null;
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        style={{
          background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.15)",
          borderRadius: 16, padding: "12px 14px", marginBottom: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>{m?.emoji ?? "✨"}</span>
          <div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#34D399" }}>نبضك اليوم ✓</p>
            <p style={{ margin: "1px 0 0", fontSize: 10, color: "#475569" }}>{already?.reason} · {already?.action}</p>
          </div>
        </div>
        <button onClick={() => { savePulseEntry({ ...already!, date: "force-reset" }); reset(); }}
          style={{ background: "none", border: "none", cursor: "pointer" }}>
          <RefreshCw size={12} color="#334155" />
        </button>
      </motion.div>
    );
  }

  if (step === 0) {
    return (
      <motion.button initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        onClick={() => setStep(1)}
        style={{
          width: "100%", background: "rgba(20,184,166,0.06)",
          border: "1px dashed rgba(20,184,166,0.25)", borderRadius: 16,
          padding: "12px 14px", marginBottom: 10, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8,
        }}>
        <Sparkles size={14} color="#14B8A6" />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#14B8A6" }}>Quick Pulse — كيف حالك الآن؟</span>
        <ChevronRight size={12} color="#14B8A6" style={{ marginRight: "auto" }} />
      </motion.button>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
      style={{
        background: "rgba(20,184,166,0.04)", border: "1px solid rgba(20,184,166,0.2)",
        borderRadius: 16, padding: "14px", marginBottom: 10,
      }}>
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>
              كيف حالك دلوقتي؟
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              {MOODS.map((m) => (
                <button key={m.v} onClick={() => handleMood(m.v)} style={{
                  fontSize: 24, background: "none", border: "none", cursor: "pointer",
                  padding: "4px", transition: "transform 0.15s",
                }} onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.3)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
                  {m.emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>
              {MOODS.find((m) => m.v === mood)?.emoji} السبب؟
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {REASONS.map((r) => (
                <button key={r} onClick={() => handleReason(r)} style={{
                  padding: "5px 10px", borderRadius: 12, fontSize: 10, fontWeight: 600,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "#94a3b8", cursor: "pointer",
                }}>
                  {r}
                </button>
              ))}
            </div>
          </motion.div>
        )}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>
              ماذا ستفعل؟
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {ACTIONS.map((a) => (
                <button key={a} onClick={() => handleAction(a)} style={{
                  padding: "5px 10px", borderRadius: 12, fontSize: 10, fontWeight: 600,
                  background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.2)",
                  color: "#14B8A6", cursor: "pointer",
                }}>
                  {a}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step indicator */}
      <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 10 }}>
        {[1, 2, 3].map((s) => (
          <div key={s} style={{
            width: s <= step ? 16 : 6, height: 4, borderRadius: 2,
            background: s < step ? "#14B8A6" : s === step ? "#14B8A6" : "rgba(255,255,255,0.08)",
            transition: "all 0.3s",
          }} />
        ))}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Daily Tasks
   ══════════════════════════════════════════ */

function DailyTasks({ xp: _xp }: { xp: number }) {
  const [done, setDone] = useState<Set<string>>(() => loadDoneTasks());

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveDoneTasks(next);
      return next;
    });
  };

  const totalXP = Array.from(done).reduce((acc, id) => {
    return acc + (DAILY_TASKS.find((t) => t.id === id)?.xp ?? 0);
  }, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
      style={{
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16, padding: "12px 14px", marginBottom: 10,
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <CheckCircle2 size={12} color="#34D399" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>مهام اليوم</span>
        </div>
        {totalXP > 0 && (
          <span style={{ fontSize: 9, color: "#14B8A6", fontWeight: 700 }}>
            +{totalXP} XP اكتسبت
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {DAILY_TASKS.map((task) => {
          const isDone = done.has(task.id);
          return (
            <button key={task.id} onClick={() => toggle(task.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "8px 10px", borderRadius: 12, cursor: "pointer",
                background: isDone ? "rgba(52,211,153,0.07)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${isDone ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.05)"}`,
                transition: "all 0.2s",
              }}>
              <span style={{ fontSize: 16 }}>{task.emoji}</span>
              <div style={{ flex: 1, textAlign: "right" }}>
                <p style={{
                  margin: 0, fontSize: 11, fontWeight: 700,
                  color: isDone ? "#64748b" : "#cbd5e1",
                  textDecoration: isDone ? "line-through" : "none",
                }}>
                  {task.title}
                </p>
                <p style={{ margin: "1px 0 0", fontSize: 9, color: "#334155" }}>{task.desc}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <span style={{ fontSize: 8, color: "#14B8A6", fontWeight: 700 }}>+{task.xp}</span>
                {isDone
                  ? <CheckCircle2 size={14} color="#34D399" />
                  : <Circle size={14} color="#1e293b" />
                }
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Weekly Capsule
   ══════════════════════════════════════════ */

function WeeklyCapsule({ pulseHistory }: { pulseHistory: PulseEntry[] }) {
  const [open, setOpen] = useState(false);
  const [reflection, setReflection] = useState(() => loadWeeklyCapsule());
  const [saved, setSaved] = useState(false);
  const weekAvg = useMemo(() => {
    const last7 = pulseHistory.filter((p) => {
      const daysAgo = (Date.now() - p.timestamp) / 86400000;
      return daysAgo <= 7;
    });
    if (last7.length === 0) return null;
    return Math.round(last7.reduce((s, p) => s + p.mood, 0) / last7.length * 10) / 10;
  }, [pulseHistory]);

  const weekMood = weekAvg ? MOODS.find((m) => m.v === Math.round(weekAvg)) : null;
  const insights = ["التواصل مع نفسك تحسّن", "ضغوط العمل لا زالت حاضرة", "بدأت تضع حدوداً أوضح"];

  const save = () => {
    saveWeeklyCapsule(reflection);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
      style={{
        background: "linear-gradient(135deg, rgba(167,139,250,0.06), rgba(96,165,250,0.04))",
        border: "1px solid rgba(167,139,250,0.15)",
        borderRadius: 16, padding: "12px 14px", marginBottom: 14,
      }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", background: "none", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 16 }}>📦</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>كبسولة الأسبوع</span>
          {weekMood && (
            <span style={{
              fontSize: 9, color: "#A78BFA", fontWeight: 700,
              background: "rgba(167,139,250,0.12)", padding: "2px 8px", borderRadius: 10,
            }}>
              {weekMood.emoji} متوسط {weekAvg}/5
            </span>
          )}
        </div>
        <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight size={13} color="#475569" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}>
            <div style={{ marginTop: 12 }}>
              {/* AI-generated insights */}
              <p style={{ margin: "0 0 6px", fontSize: 10, color: "#A78BFA", fontWeight: 700 }}>
                ما الذي تغيّر فيك هذا الأسبوع؟
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                {insights.map((ins, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 8px", background: "rgba(167,139,250,0.06)",
                    border: "1px solid rgba(167,139,250,0.12)", borderRadius: 10,
                  }}>
                    <TrendingUp size={9} color="#A78BFA" />
                    <span style={{ fontSize: 10, color: "#94a3b8" }}>{ins}</span>
                  </div>
                ))}
              </div>

              {/* Reflection input */}
              <textarea id="dashboard-reflection" name="dashboardReflection" value={reflection} onChange={(e) => setReflection(e.target.value)}
                placeholder="اكتب تأملك الأسبوعي هنا... ما الذي تعلمته؟"
                rows={3}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(167,139,250,0.2)", borderRadius: 10,
                  padding: "8px 10px", color: "#e2e8f0", fontSize: 11,
                  outline: "none", resize: "none", lineHeight: 1.6,
                  fontFamily: "var(--font-sans)", direction: "rtl", boxSizing: "border-box",
                }} />
              <button onClick={save} style={{
                marginTop: 6, background: saved ? "rgba(52,211,153,0.12)" : "rgba(167,139,250,0.12)",
                border: `1px solid ${saved ? "rgba(52,211,153,0.3)" : "rgba(167,139,250,0.3)"}`,
                borderRadius: 8, padding: "6px 14px",
                color: saved ? "#34D399" : "#A78BFA",
                fontSize: 10, fontWeight: 700, cursor: "pointer",
              }}>
                {saved ? "✓ تم الحفظ" : "حفظ التأمل"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Sidebar Navigation
   ══════════════════════════════════════════ */

type SidebarTab = "overview" | "map" | "community" | "profile" | "settings";

const SIDEBAR_ITEMS: { id: SidebarTab; emoji: string; label: string }[] = [
  { id: "overview", emoji: "🏠", label: "نظرة عامة" },
  { id: "map", emoji: "🌐", label: "خريطة العلاقات" },
  { id: "community", emoji: "👥", label: "المجتمع" },
  { id: "profile", emoji: "👤", label: "الملف الشخصي" },
  { id: "settings", emoji: "⚙️", label: "الإعدادات" },
];

function DashboardSidebar({
  active, onChange, onBack,
}: {
  active: SidebarTab;
  onChange: (t: SidebarTab) => void;
  onBack?: () => void;
}) {
  return (
    <aside style={{
      width: 200, flexShrink: 0, background: "var(--ds-color-glass-default)",
      border: "1px solid var(--ds-color-border-default)", borderRadius: 20,
      padding: "18px 12px", display: "flex", flexDirection: "column",
      gap: 4, position: "sticky", top: 20, alignSelf: "flex-start",
      minHeight: "calc(100vh - 80px)",
      backdropFilter: "blur(24px)",
    }}>
      {/* Brand */}
      <div style={{ marginBottom: 18, paddingRight: 4 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "var(--ds-color-primary)" }}>
          Insight Panel
        </p>
        <p style={{ margin: "1px 0 0", fontSize: 8, color: "var(--ds-theme-text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>
          The Ethereal Analyst
        </p>
      </div>

      {/* Nav items */}
      {SIDEBAR_ITEMS.map((item) => {
        const isActive = item.id === active;
        return (
          <button key={item.id} onClick={() => onChange(item.id)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "9px 10px", borderRadius: 12, cursor: "pointer",
              background: isActive ? "var(--ds-color-primary-soft)" : "transparent",
              border: `1px solid ${isActive ? "var(--ds-color-primary-glow)" : "transparent"}`,
              color: isActive ? "var(--ds-color-primary)" : "var(--ds-theme-text-muted)",
              fontSize: 12, fontWeight: isActive ? 700 : 500,
              transition: "all 0.18s", textAlign: "right",
            }}>
            <span style={{ fontSize: 14 }}>{item.emoji}</span>
            {item.label}
          </button>
        );
      })}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* CTA */}
      <button style={{
        background: "linear-gradient(135deg, var(--ds-color-primary), var(--ds-color-primary-strong))",
        border: "none", borderRadius: 12, padding: "10px 12px",
        color: "var(--ds-color-space-deep)", fontSize: 11, fontWeight: 800, cursor: "pointer",
        display: "flex", alignItems: "center", gap: 6, justifyContent: "center",
        marginTop: 8,
      }}>
        <span style={{ fontSize: 14 }}>✨</span>
        تحليل جديد
      </button>

      {onBack && (
        <button onClick={onBack} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#334155", fontSize: 10, marginTop: 6, padding: "6px 0",
          display: "flex", alignItems: "center", gap: 4, justifyContent: "center",
        }}>
          <ArrowLeft size={10} /> رجوع
        </button>
      )}
    </aside>
  );
}

/* ══════════════════════════════════════════
   Relationship Orbit Map
   ══════════════════════════════════════════ */

const ORB_RELATIONS = [
  { label: "العائلة", emoji: "👨‍👩‍👧", angle: 60, ring: "#FBBF24", growth: "+8%" },
  { label: "الشريك", emoji: "💑", angle: 180, ring: "#F87171", growth: "+12%" },
  { label: "الأصدقاء", emoji: "👫", angle: 300, ring: "#60A5FA", growth: "+5%" },
  { label: "العمل", emoji: "💼", angle: 240, ring: "#A78BFA", growth: "-2%" },
];

function RelationshipOrbitMap({ nodes }: { nodes: MapNode[] }) {
  const activeNodes = nodes.filter((n) => !n.isNodeArchived);
  const greenCount = activeNodes.filter((n) => n.ring === "green").length;
  const total = activeNodes.length;
  const stabilityPct = total > 0 ? Math.round((greenCount / total) * 100) : 72;
  const lifeScore = Math.max(5, Math.min(10, (stabilityPct / 10))).toFixed(1);

  const SIZE = 220;
  const CX = SIZE / 2, CY = SIZE / 2;
  const ORBITS = [38, 70, 96];

  const orbPt = (angleDeg: number, r: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      style={{
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 18, padding: "14px", marginBottom: 10,
      }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#e2e8f0" }}>
            خريطة العلاقات التفاعلية
          </p>
          <p style={{ margin: "1px 0 0", fontSize: 9, color: "#475569" }}>
            توزيع الطاقة العاطفية في دوائرك
          </p>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {["الأيام", "الشهر"].map((l, i) => (
            <span key={i} style={{
              fontSize: 8, fontWeight: 700, padding: "3px 8px", borderRadius: 10, cursor: "pointer",
              background: i === 0 ? "rgba(20,184,166,0.14)" : "rgba(255,255,255,0.04)",
              color: i === 0 ? "#14B8A6" : "#475569",
              border: `1px solid ${i === 0 ? "rgba(20,184,166,0.3)" : "rgba(255,255,255,0.06)"}`,
            }}>{l}</span>
          ))}
        </div>
      </div>

      {/* SVG Orbit */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <defs>
            <radialGradient id="core-grd" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.05" />
            </radialGradient>
          </defs>

          {/* Orbit rings */}
          {ORBITS.map((r, i) => (
            <circle key={i} cx={CX} cy={CY} r={r} fill="none"
              stroke="rgba(255,255,255,0.05)" strokeWidth={1}
              strokeDasharray={i === 2 ? "3 4" : undefined} />
          ))}

          {/* Core */}
          <circle cx={CX} cy={CY} r={ORBITS[0]} fill="url(#core-grd)" />
          <text x={CX} y={CY + 4} textAnchor="middle"
            fontSize="11" fill="#14B8A6" fontWeight="900" fontFamily="var(--font-sans)">
            أنت
          </text>

          {/* Relation nodes */}
          {ORB_RELATIONS.map((rel, i) => {
            const p = orbPt(rel.angle, ORBITS[2]);
            return (
              <g key={i}>
                <motion.circle cx={p.x} cy={p.y} r={16} fill={`${rel.ring}18`}
                  stroke={rel.ring} strokeWidth={1.5}
                  animate={{ r: [16, 17.5, 16] }}
                  transition={{ repeat: Infinity, duration: 2 + i * 0.4 }} />
                <text x={p.x} y={p.y + 4} textAnchor="middle"
                  fontSize="12" fill={rel.ring} fontFamily="var(--font-sans)">
                  {rel.emoji}
                </text>
                <text x={p.x} y={p.y + 24} textAnchor="middle"
                  fontSize="7.5" fill="#64748b" fontFamily="var(--font-sans)">
                  {rel.label}
                </text>
              </g>
            );
          })}

          {/* Connection lines */}
          {ORB_RELATIONS.map((rel, i) => {
            const p = orbPt(rel.angle, ORBITS[2] - 16);
            return (
              <line key={`line-${i}`} x1={CX} y1={CY} x2={p.x} y2={p.y}
                stroke={rel.ring} strokeWidth={0.6} strokeOpacity={0.2}
                strokeDasharray="2 3" />
            );
          })}
        </svg>
      </div>

      {/* Stats row */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8,
        paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 4,
      }}>
        {[
          { label: "نمو", value: "+12%", color: "#34D399" },
          { label: "الاستقرار", value: stabilityPct >= 60 ? "عالي" : stabilityPct >= 40 ? "متوسط" : "منخفض", color: "#14B8A6" },
          { label: "الحياة", value: `${lifeScore}/10`, color: "#A78BFA" },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ margin: "1px 0 0", fontSize: 8, color: "#334155" }}>{s.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Insight Article Card
   ══════════════════════════════════════════ */

const INSIGHT_ARTICLES = [
  {
    tag: "رؤية حصرية",
    tagColor: "#A78BFA",
    title: "كيف تبني حدوداً صحية في علاقاتك؟",
    body: "استكشف دليلنا الجديد المعتمد على الذكاء الاصطناعي لتحليل أنماط التعلق وكيفية تحويلها إلى تواصل أكثر نضجاً.",
    reads: "2,000+",
    readTime: "4 دقائق",
    gradient: "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(96,165,250,0.08))",
    border: "rgba(167,139,250,0.2)",
  },
  {
    tag: "نصيحة اليوم",
    tagColor: "#34D399",
    title: "3 أسئلة تكشف قيمك في العلاقة",
    body: "تعرّف على القيم الجوهرية التي تحرك قراراتك العاطفية واكتشف كيف تؤثر على قرارات شريكك أيضاً.",
    reads: "1,340",
    readTime: "2 دقائق",
    gradient: "linear-gradient(135deg, rgba(52,211,153,0.08), rgba(20,184,166,0.06))",
    border: "rgba(52,211,153,0.18)",
  },
];

function InsightArticleCard() {
  const article = INSIGHT_ARTICLES[Math.floor(Date.now() / 86400000) % INSIGHT_ARTICLES.length];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
      style={{
        background: article.gradient,
        border: `1px solid ${article.border}`,
        borderRadius: 18, padding: "16px", marginBottom: 14,
        position: "relative", overflow: "hidden",
      }}>
      {/* Glow blob */}
      <div style={{
        position: "absolute", bottom: -20, left: -20,
        width: 100, height: 100, borderRadius: "50%",
        background: article.tagColor + "12", pointerEvents: "none",
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* Text content */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{
              fontSize: 9, fontWeight: 800, color: article.tagColor,
              background: article.tagColor + "15", border: `1px solid ${article.tagColor}25`,
              padding: "2px 8px", borderRadius: 10,
            }}>
              {article.tag}
            </span>
            <span style={{ fontSize: 8, color: "#334155" }}>{article.readTime} للقراءة</span>
          </div>

          <h3 style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 800, color: "#e2e8f0", lineHeight: 1.4 }}>
            {article.title}
          </h3>
          <p style={{ margin: "0 0 10px", fontSize: 10, color: "#64748b", lineHeight: 1.6 }}>
            {article.body}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button style={{
              background: article.tagColor + "15", border: `1px solid ${article.tagColor}25`,
              borderRadius: 10, padding: "5px 12px",
              color: article.tagColor, fontSize: 10, fontWeight: 700, cursor: "pointer",
            }}>
              اقرأ الآن ←
            </button>
            <span style={{ fontSize: 9, color: "#334155" }}>👁 {article.reads} قراءة</span>
          </div>
        </div>

        {/* Decorative icon */}
        <div style={{
          width: 64, height: 64, borderRadius: 16, flexShrink: 0,
          background: article.tagColor + "15", border: `1px solid ${article.tagColor}20`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28,
        }}>
          📖
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Main Dashboard
   ══════════════════════════════════════════ */

interface InteractiveDashboardProps {
  onBack?: () => void;
}

export function InteractiveDashboard({ onBack }: InteractiveDashboardProps) {
  const { xp, level } = useGamificationState();
  const unlockedIds = useAchievementState((s) => s.unlockedIds);
  const { history } = useQuizHistory();
  const nodes = useMapState((s) => s.nodes);

  const [activeTab, setActiveTab] = useState<SidebarTab>("overview");
  const [pulseHistory, setPulseHistory] = useState<PulseEntry[]>(() => loadPulseHistory());
  const isProfileTab = activeTab === "profile";

  const moodToday = useMemo(
    () => pulseHistory.find((p) => p.date === todayStr()) ?? null,
    [pulseHistory]
  );

  const handlePulseSave = (entry: PulseEntry) => {
    setPulseHistory((prev) => {
      const next = [entry, ...prev.filter((p) => p.date !== entry.date)];
      return next;
    });
  };

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "var(--ds-color-space-void)", padding: "20px 16px 80px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 16, alignItems: "flex-start" }}>

        {/* ════ Sidebar ════ */}
        <DashboardSidebar active={activeTab} onChange={setActiveTab} onBack={onBack} />

        {/* ════ Main Content ════ */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* ① Hero */}
          <HeroSection xp={xp} level={level} moodToday={moodToday} />

          {isProfileTab && <UserProfile onBack={onBack} />}

          {/* ② KPI Cards */}
          <KPICards history={history} nodes={nodes} unlockedIds={unlockedIds} xp={xp} />

          {/* Partner Badge */}
          <PartnerSyncBadge />

          {/* ⚡ Quick Pulse */}
          <QuickPulse onSave={handlePulseSave} />

          {/* Two-column row: Mood Chart + Orbit Map */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 0 }}>
            <MoodChart pulseHistory={pulseHistory} />
            <RelationshipOrbitMap nodes={nodes} />
          </div>

          {/* 🎯 Streak Momentum */}
          <StreakMomentum xp={xp} />

          {/* ④ Daily Tasks */}
          <DailyTasks xp={xp} />

          {/* 📰 Insight Article */}
          <InsightArticleCard />

          {/* 📦 Weekly Capsule */}
          <WeeklyCapsule pulseHistory={pulseHistory} />

        </div>
      </div>
    </div>
  );
}





