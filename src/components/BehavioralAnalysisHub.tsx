"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Brain, Activity, ShieldAlert, TrendingUp, Target,
  Zap, Eye, Network, Lightbulb, Heart, Clock, AlertCircle,
  Share2, Download, Bell, BellOff, ChevronRight, Users,
  Home, Settings, Database, Sun, Moon, Lock, Unlock, X,
  BarChart3, Sparkles, Link2, BookOpen
} from "lucide-react";
import { supabase } from "../services/supabaseClient";
import type { ResourceTab } from "./ResourcesCenter";
import { usePushNotifications } from "../hooks/usePushNotifications";

/* ══════════════════════════════════════════
   Types
   ══════════════════════════════════════════ */

type TimeRange = "week" | "month" | "year";
type SideSection = "home" | "analysis" | "emotional" | "data" | "settings";
type BehavioralMode = "containment" | "growth" | "flow";
type PatternSentiment = "positive" | "negative" | "recurring";

interface TimelinePoint {
  day: string;
  connection: number;   // 0-100
  withdrawal: number;   // 0-100
  stability: number;    // 0-100
  period: "morning" | "evening";
}

interface BehavioralPattern {
  id: string;
  title: string;
  description: string;
  sentiment: PatternSentiment;
  icon: string;
  frequency: number;
  linkedQuiz?: string;
  isSensitive?: boolean;
  // Deep-link to ResourcesCenter
  resourceTab?: ResourceTab;
  resourceSearch?: string;
}

interface SupabaseAlert {
  id: string;
  message: string;
  pattern_id: string | null;
  resource_tab: string | null;
  resource_key: string | null;
  is_read: boolean;
}

interface TriggerSource {
  label: string;
  value: number;
  color: string;
}

interface WeekDelta {
  metric: string;
  current: number;
  previous: number;
  direction: "up" | "down";
  isPositive: boolean;
}

/* ══════════════════════════════════════════
   Mock Data
   ══════════════════════════════════════════ */

const TIMELINE_DATA: Record<TimeRange, TimelinePoint[]> = {
  week: [
    { day: "الأحد",  connection: 60, withdrawal: 30, stability: 70, period: "morning" },
    { day: "الاثنين", connection: 40, withdrawal: 55, stability: 50, period: "evening" },
    { day: "الثلاثاء", connection: 45, withdrawal: 50, stability: 55, period: "morning" },
    { day: "الأربعاء", connection: 70, withdrawal: 20, stability: 75, period: "evening" },
    { day: "الخميس",  connection: 55, withdrawal: 40, stability: 60, period: "morning" },
    { day: "الجمعة",  connection: 80, withdrawal: 15, stability: 85, period: "evening" },
    { day: "السبت",   connection: 65, withdrawal: 25, stability: 72, period: "morning" },
  ],
  month: [
    { day: "أسبوع 1", connection: 55, withdrawal: 45, stability: 60, period: "morning" },
    { day: "أسبوع 2", connection: 42, withdrawal: 58, stability: 48, period: "evening" },
    { day: "أسبوع 3", connection: 68, withdrawal: 32, stability: 72, period: "morning" },
    { day: "أسبوع 4", connection: 75, withdrawal: 22, stability: 80, period: "evening" },
  ],
  year: [
    { day: "يناير",  connection: 50, withdrawal: 50, stability: 55, period: "morning" },
    { day: "فبراير", connection: 45, withdrawal: 55, stability: 50, period: "evening" },
    { day: "مارس",   connection: 65, withdrawal: 35, stability: 70, period: "morning" },
    { day: "أبريل",  connection: 72, withdrawal: 28, stability: 78, period: "evening" },
    { day: "مايو",   connection: 68, withdrawal: 32, stability: 74, period: "morning" },
    { day: "يونيو",  connection: 80, withdrawal: 18, stability: 85, period: "evening" },
  ],
};

const TRIGGER_SOURCES: TriggerSource[] = [
  { label: "ضغط العمل",       value: 68, color: "#F43F5E" },
  { label: "تواصل رقمي",      value: 45, color: "#F59E0B" },
  { label: "أحداث اجتماعية",  value: 30, color: "#8B5CF6" },
  { label: "نمط النوم",        value: 22, color: "#06B6D4" },
];

const PATTERNS: BehavioralPattern[] = [
  {
    id: "p1",
    title: "نمط الانسحاب المفاجئ",
    description: "تكرار الانسحاب عند مواجهة المشكلة؛ يشير هذا إلى حاجة لمزيد من الوضوح أو تقليل الضغط.",
    sentiment: "negative",
    icon: "🚪",
    frequency: 14,
    linkedQuiz: "attachment",
    isSensitive: true,
    resourceTab: "exit-scripts",
    resourceSearch: "ضغط",
  },
  {
    id: "p2",
    title: "التوافق العاطفي المسائي",
    description: "رصد النظام زيادة في عمق المحادثات بنسبة 60% بعد الساعة 9 مساءً، مما يشير إلى مساحة للتعبير.",
    sentiment: "positive",
    icon: "🌙",
    frequency: 8,
    linkedQuiz: "emotional",
    resourceTab: "articles",
    resourceSearch: "توافق",
  },
  {
    id: "p3",
    title: "نمط الاستجابة المتأخرة",
    description: "يظهر هذا النمط في أيام العمل المكثفة؛ يتأخر التفاعل بنسبة 60% عن المعدل الطبيعي نتيجة الإجهاد الذهني.",
    sentiment: "recurring",
    icon: "⏱️",
    frequency: 11,
    linkedQuiz: "attachment",
    resourceTab: "exercises",
    resourceSearch: "تهدئة",
  },
];

const WEEK_DELTAS: WeekDelta[] = [
  { metric: "الاستقرار", current: 74, previous: 62, direction: "up", isPositive: true },
  { metric: "الانسحاب",  current: 28, previous: 36, direction: "down", isPositive: true },
  { metric: "التواصل",   current: 71, previous: 55, direction: "up", isPositive: true },
  { metric: "الإجهاد",   current: 68, previous: 52, direction: "up", isPositive: false },
];

const SMART_ALERTS = [
  "لاحظنا نمط انسحاب بعد ساعات العمل المكثفة ثلاث مرات هذا الأسبوع — أخذ استراحة 10 دقائق يمكن أن يُقلل من تكراره.",
  "التوافق العاطفي المسائي يرتفع بشكل ملحوظ — هذا هو الوقت المثالي للمحادثات العميقة مع شريكك.",
];

const RECOMMENDATIONS = [
  { text: "ممارسة «الاستماع النشط» في أوقات الفترة المسائية لمدة 15 دقيقة يومياً.", icon: "🎧", color: "#06B6D4" },
  { text: "تقليل التواصل الرقمي خلال فترات الزحام لمواجهة الإجهاد الذهني.", icon: "📵", color: "#10B981" },
  { text: "تحديد «الانسحاب» كإنذار مبكر بدلاً من كونه صراعاً.", icon: "🛡️", color: "#8B5CF6" },
];

const SENTIMENT_CONFIG: Record<PatternSentiment, { label: string; color: string; bg: string; border: string }> = {
  positive:  { label: "إيجابي",  color: "#10B981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.3)" },
  negative:  { label: "سلبي",    color: "#F43F5E", bg: "rgba(244,63,94,0.1)",   border: "rgba(244,63,94,0.3)" },
  recurring: { label: "متكرر",   color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.3)" },
};

const SIDE_SECTIONS: { id: SideSection; label: string; icon: typeof Home }[] = [
  { id: "home",      label: "الرئيسية",          icon: Home },
  { id: "analysis",  label: "تحليل الأنماط",      icon: Brain },
  { id: "emotional", label: "الارتباط العاطفي",   icon: Heart },
  { id: "data",      label: "سجل البيانات",        icon: Database },
  { id: "settings",  label: "الإعدادات",           icon: Settings },
];

/* ══════════════════════════════════════════
   Trigger Ring SVG
   ══════════════════════════════════════════ */

function TriggerRing({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: 130, height: 130, flexShrink: 0 }}>
      <svg width={130} height={130} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={65} cy={65} r={r} stroke="rgba(255,255,255,0.04)" strokeWidth={10} fill="none" />
        <motion.circle
          cx={65} cy={65} r={r}
          stroke="url(#triggerGrad)" strokeWidth={10} fill="none"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (circ * score) / 100 }}
          transition={{ duration: 1.8, ease: "circOut" }}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="triggerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 2,
      }}>
        <span style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{score}%</span>
        <span style={{ fontSize: 8, color: "#64748b", fontWeight: 700 }}>دقة التحليل</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Timeline Chart
   ══════════════════════════════════════════ */

function TimelineChart({ data }: { data: TimelinePoint[] }) {
  const W = 100 / (data.length - 1);
  const lines: { key: keyof TimelinePoint; color: string; label: string }[] = [
    { key: "connection", color: "#06B6D4", label: "تواصل" },
    { key: "withdrawal",  color: "#F43F5E", label: "انسحاب" },
    { key: "stability",   color: "#10B981", label: "استقرار" },
  ];

  const toPath = (key: keyof TimelinePoint): string => {
    return data
      .map((p, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - (p[key] as number);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginBottom: 12, justifyContent: "flex-end" }}>
        {lines.map((l) => (
          <div key={l.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 24, height: 2, background: l.color, borderRadius: 2 }} />
            <span style={{ fontSize: 9, color: "#64748b", fontWeight: 700 }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* SVG chart */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: 130 }}>
        {/* Grid lines */}
        {[25, 50, 75].map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5} />
        ))}
        {/* Circadian shading (evening) */}
        {data.map((p, i) => p.period === "evening" && i < data.length - 1 && (
          <rect key={i}
            x={i * W} width={W} y={0} height={100}
            fill="rgba(139,92,246,0.04)"
          />
        ))}
        {/* Data lines */}
        {lines.map((l) => (
          <motion.path
            key={l.key}
            d={toPath(l.key)}
            fill="none" stroke={l.color} strokeWidth={2}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {/* X-axis labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        {data.map((p, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 7, color: "#334155", fontWeight: 700 }}>{p.day}</span>
            {p.period === "evening" ? (
              <Moon size={8} color="#8B5CF6" />
            ) : (
              <Sun size={8} color="#F59E0B" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Wave SVG (decorative)
   ══════════════════════════════════════════ */

function WaveVisual() {
  return (
    <svg viewBox="0 0 400 80" style={{ width: "100%", height: 80, opacity: 0.6 }}>
      <defs>
        <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
          <stop offset="50%" stopColor="#06B6D4" stopOpacity={0.6} />
          <stop offset="100%" stopColor="#10B981" stopOpacity={0.3} />
        </linearGradient>
      </defs>
      <motion.path
        d="M0,40 Q50,10 100,40 Q150,70 200,40 Q250,10 300,40 Q350,70 400,40 L400,80 L0,80 Z"
        fill="url(#waveGrad)"
        animate={{ d: [
          "M0,40 Q50,10 100,40 Q150,70 200,40 Q250,10 300,40 Q350,70 400,40 L400,80 L0,80 Z",
          "M0,40 Q50,70 100,40 Q150,10 200,40 Q250,70 300,40 Q350,10 400,40 L400,80 L0,80 Z",
          "M0,40 Q50,10 100,40 Q150,70 200,40 Q250,10 300,40 Q350,70 400,40 L400,80 L0,80 Z",
        ]}}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M0,50 Q50,25 100,50 Q150,75 200,50 Q250,25 300,50 Q350,75 400,50"
        fill="none" stroke="rgba(6,182,212,0.4)" strokeWidth={1.5}
        animate={{ d: [
          "M0,50 Q50,25 100,50 Q150,75 200,50 Q250,25 300,50 Q350,75 400,50",
          "M0,50 Q50,75 100,50 Q150,25 200,50 Q250,75 300,50 Q350,25 400,50",
          "M0,50 Q50,25 100,50 Q150,75 200,50 Q250,25 300,50 Q350,75 400,50",
        ]}}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}

/* ══════════════════════════════════════════
   Pattern Card
   ══════════════════════════════════════════ */

function PatternCard({
  pattern,
  onShare,
  onOpenResource,
}: {
  pattern: BehavioralPattern;
  onShare: (p: BehavioralPattern) => void;
  onOpenResource?: (tab: ResourceTab, search: string) => void;
}) {
  const [locked, setLocked] = useState(pattern.isSensitive ? true : false);
  const [showShare, setShowShare] = useState(false);
  const cfg = SENTIMENT_CONFIG[pattern.sentiment];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: `linear-gradient(135deg, ${cfg.bg}, rgba(255,255,255,0.01))`,
        border: `1px solid ${cfg.border}`,
        borderRadius: 20, padding: "16px",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Sentiment Badge */}
      <div style={{
        position: "absolute", top: 12, left: 12,
        fontSize: 9, fontWeight: 800, color: cfg.color,
        background: `${cfg.color}18`, border: `1px solid ${cfg.color}35`,
        padding: "2px 8px", borderRadius: 12,
      }}>
        {cfg.label}
      </div>

      {/* Behavioral Lock badge */}
      {pattern.isSensitive && (
        <button
          onClick={() => setLocked(!locked)}
          style={{
            position: "absolute", top: 10, right: 10,
            background: locked ? "rgba(244,63,94,0.1)" : "rgba(16,185,129,0.1)",
            border: `1px solid ${locked ? "rgba(244,63,94,0.3)" : "rgba(16,185,129,0.3)"}`,
            borderRadius: 8, padding: "3px 6px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 3,
          }}
        >
          {locked ? <Lock size={10} color="#F43F5E" /> : <Unlock size={10} color="#10B981" />}
          <span style={{ fontSize: 8, color: locked ? "#F43F5E" : "#10B981", fontWeight: 700 }}>
            {locked ? "خاص" : "مرئي"}
          </span>
        </button>
      )}

      <div style={{ marginTop: pattern.isSensitive ? 28 : 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>{pattern.icon}</span>
          <h4 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#e2e8f0" }}>{pattern.title}</h4>
        </div>
        <p style={{ margin: 0, fontSize: 11, color: "#64748b", lineHeight: 1.7 }}>
          {locked && pattern.isSensitive
            ? "هذا النمط حساس — اضغط على القفل للكشف عنه."
            : pattern.description}
        </p>

        <div style={{
          marginTop: 10, display: "flex", alignItems: "center",
          gap: 8, justifyContent: "space-between",
          borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 10,
        }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 9, color: "#334155" }}>
              تكرار: <b style={{ color: "#94a3b8" }}>{pattern.frequency}×</b>
            </span>
            {pattern.linkedQuiz && (
              <div style={{
                display: "flex", alignItems: "center", gap: 3,
                background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)",
                borderRadius: 8, padding: "1px 6px",
              }}>
                <Link2 size={8} color="#A78BFA" />
                <span style={{ fontSize: 8, color: "#A78BFA", fontWeight: 700 }}>اختبار التعلق</span>
              </div>
            )}
            {pattern.resourceTab && onOpenResource && (
              <button
                onClick={() => onOpenResource(pattern.resourceTab!, pattern.resourceSearch ?? "")}
                style={{
                  display: "flex", alignItems: "center", gap: 3,
                  background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)",
                  borderRadius: 8, padding: "1px 6px", cursor: "pointer",
                }}
              >
                <BookOpen size={8} color="#06B6D4" />
                <span style={{ fontSize: 8, color: "#06B6D4", fontWeight: 700 }}>اقرأ أكثر</span>
              </button>
            )}
          </div>

          {/* Share CTA */}
          <AnimatePresence>
            {showShare ? (
              <motion.button
                key="share-confirm"
                initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                onClick={() => { onShare(pattern); setShowShare(false); }}
                style={{
                  fontSize: 8, fontWeight: 800, color: "#06B6D4",
                  background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)",
                  borderRadius: 8, padding: "3px 8px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4,
                }}
              >
                <Users size={9} /> شارك مع شريكك؟
              </motion.button>
            ) : (
              <button
                onClick={() => setShowShare(true)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#334155", display: "flex", alignItems: "center", gap: 3,
                }}
              >
                <Share2 size={11} />
              </button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Main Hub Component
   ══════════════════════════════════════════ */

export function BehavioralAnalysisHub({
  onBack,
  onNavigateToResources,
}: {
  onBack: () => void;
  onNavigateToResources?: (tab: ResourceTab, search: string) => void;
}) {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [activeSection, setActiveSection] = useState<SideSection>("analysis");
  const [alertVisible, setAlertVisible] = useState(true);
  const [activeAlert, setActiveAlert] = useState(0);
  const [shareModal, setShareModal] = useState<BehavioralPattern | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [supabaseAlerts, setSupabaseAlerts] = useState<SupabaseAlert[]>([]);

  // Web Push
  const { isSupported: pushSupported, isSubscribed: pushOn, isLoading: pushLoading,
    permission: pushPermission, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePushNotifications();

  const timelineData = TIMELINE_DATA[timeRange];

  // Trigger score: average of trigger sources weighted by inverse value
  const triggerScore = useMemo(() => {
    const weighted = TRIGGER_SOURCES.reduce((s, t) => s + t.value, 0) / TRIGGER_SOURCES.length;
    return Math.round(weighted * 1.15); // bump for display
  }, []);

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Cycle local fallback alerts
  useEffect(() => {
    const t = setInterval(() => {
      setActiveAlert((p) => (p + 1) % SMART_ALERTS.length);
    }, 8000);
    return () => clearInterval(t);
  }, []);

  // Fetch Supabase behavioral_alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        if (!supabase) return;
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase
          .from("behavioral_alerts")
          .select("id, message, pattern_id, resource_tab, resource_key, is_read")
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(5);
        if (data && data.length > 0) setSupabaseAlerts(data as SupabaseAlert[]);
      } catch (_) { /* graceful fallback to local alerts */ }
    };
    fetchAlerts();
  }, []);

  // Dismiss a Supabase alert (mark as read)
  const dismissSupabaseAlert = useCallback(async (alertId: string) => {
    setSupabaseAlerts((prev) => prev.filter((a) => a.id !== alertId));
    try {
      if (!supabase) return;
      await supabase.from("behavioral_alerts").update({ is_read: true }).eq("id", alertId);
    } catch (_) { /* ignore */ }
  }, []);

  // Active alert message (Supabase first, then local)
  const activeAlertMessage = supabaseAlerts.length > 0
    ? supabaseAlerts[0].message
    : SMART_ALERTS[activeAlert];

  const handleSharePattern = useCallback((pattern: BehavioralPattern) => {
    setShareModal(pattern);
  }, []);

  // Glass card style
  const glass = (color = "rgba(255,255,255,0.03)", border = "rgba(255,255,255,0.07)"): React.CSSProperties => ({
    background: color,
    border: `1px solid ${border}`,
    borderRadius: 22,
    backdropFilter: "blur(16px)",
  });

  return (
    <div dir="rtl" style={{
      minHeight: "100vh", background: "#050810",
      display: "flex", position: "relative", overflow: "hidden",
      flexDirection: isMobile ? "column" : "row",
    }}>
      {/* ── Ambient Background ── */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse 80% 50% at 20% 20%, rgba(139,92,246,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(6,182,212,0.06) 0%, transparent 60%)",
      }} />

      {/* ══════════════════════════════════════
          Glassmorphism SideNavBar (desktop only)
      ══════════════════════════════════════ */}
      {!isMobile && (
      <motion.aside
        initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          width: 200, flexShrink: 0, position: "sticky", top: 0, height: "100vh",
          background: "rgba(8,11,21,0.7)", borderLeft: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(24px)", display: "flex", flexDirection: "column",
          padding: "28px 16px", zIndex: 10,
        }}
      >
        {/* Brand */}
        <div style={{ marginBottom: 32, textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#e2e8f0" }}>Ethereal Insight</p>
              <p style={{ margin: 0, fontSize: 9, color: "#475569" }}>The Analyst</p>
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(6,182,212,0.2))",
              border: "1px solid rgba(139,92,246,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Brain size={18} color="#A78BFA" />
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          {SIDE_SECTIONS.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => {
                  setActiveSection(id);
                  if (id === "home") onBack();
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 14,
                  background: isActive ? "rgba(139,92,246,0.12)" : "transparent",
                  border: isActive ? "1px solid rgba(139,92,246,0.25)" : "1px solid transparent",
                  cursor: "pointer", textAlign: "right", width: "100%",
                  transition: "all 0.18s",
                }}
              >
                <Icon size={15} color={isActive ? "#A78BFA" : "#475569"} />
                <span style={{
                  fontSize: 12, fontWeight: isActive ? 800 : 600,
                  color: isActive ? "#e2e8f0" : "#475569",
                }}>
                  {label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    style={{
                      marginRight: "auto", width: 4, height: 4,
                      borderRadius: "50%", background: "#A78BFA",
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Export Button */}
        <button
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "11px 0", borderRadius: 14,
            background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.15))",
            border: "1px solid rgba(139,92,246,0.3)",
            color: "#A78BFA", fontSize: 11, fontWeight: 800, cursor: "pointer",
            width: "100%",
          }}
        >
          <Download size={13} />
          تصدير التقرير الكامل
        </button>
      </motion.aside>
      )}

      {/* ══════════════════════════════════════
          Main Content
      ══════════════════════════════════════ */}
      {/* ══════════════════════════════════════
          Mobile Bottom Nav
      ══════════════════════════════════════ */}
      {isMobile && (
        <motion.nav
          initial={{ y: 80 }} animate={{ y: 0 }}
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
            background: "rgba(8,11,21,0.92)", backdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex", padding: "6px 8px 10px",
          }}
        >
          {SIDE_SECTIONS.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => { setActiveSection(id); if (id === "home") onBack(); }}
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 3, padding: "6px 0",
                  background: "none", border: "none", cursor: "pointer",
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: isActive ? "rgba(139,92,246,0.18)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.2s",
                }}>
                  <Icon size={16} color={isActive ? "#A78BFA" : "#475569"} />
                </div>
                <span style={{ fontSize: 8, fontWeight: isActive ? 800 : 600, color: isActive ? "#A78BFA" : "#475569" }}>
                  {label}
                </span>
              </button>
            );
          })}
        </motion.nav>
      )}

      <main style={{
        flex: 1, overflowY: "auto", padding: isMobile ? "16px 14px 100px" : "28px 24px 80px",
        position: "relative", zIndex: 1,
      }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={onBack}
              style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, padding: 7, cursor: "pointer", color: "#475569",
              }}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 style={{
                margin: 0, fontSize: 22, fontWeight: 900,
                background: "linear-gradient(135deg, #A78BFA, #06B6D4)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                تحليل الأنماط السلوكية
              </h1>
              <p style={{ margin: "3px 0 0", fontSize: 10, color: "#334155" }}>
                نظرة عميقة في ديناميكيات التفاعل العاطفي المستمر.
              </p>
            </div>
          </div>

          {/* Time Range Selector */}
          <div style={{
            display: "flex", gap: 4, padding: 4,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 14,
          }}>
            {(["week", "month", "year"] as TimeRange[]).map((r) => {
              const labels: Record<TimeRange, string> = { week: "أسبوع", month: "شهر", year: "سنة" };
              return (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  style={{
                    padding: "6px 14px", borderRadius: 10, fontSize: 10, fontWeight: 800,
                    background: timeRange === r ? "rgba(139,92,246,0.2)" : "transparent",
                    border: timeRange === r ? "1px solid rgba(139,92,246,0.3)" : "1px solid transparent",
                    color: timeRange === r ? "#A78BFA" : "#475569", cursor: "pointer",
                  }}
                >
                  {labels[r]}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Smart Alert Banner */}
        <AnimatePresence>
          {alertVisible && (
            <motion.div
              key="alert"
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(6,182,212,0.06))",
                border: "1px solid rgba(139,92,246,0.2)",
                borderRadius: 16, padding: "12px 16px", marginBottom: 16,
                display: "flex", alignItems: "flex-start", gap: 10,
              }}
            >
              <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <Bell size={16} color={supabaseAlerts.length > 0 ? "#06B6D4" : "#A78BFA"} />
              </motion.div>
              <p style={{ flex: 1, margin: 0, fontSize: 11, color: "#94a3b8", lineHeight: 1.7 }}>
                {activeAlertMessage}
              </p>
              {/* Push toggle button */}
              {pushSupported && pushPermission !== "denied" && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => pushOn ? pushUnsubscribe() : pushSubscribe()}
                  disabled={pushLoading}
                  title={pushOn ? "إيقاف الإشعارات" : "تفعيل الإشعارات"}
                  style={{
                    background: pushOn ? "rgba(6,182,212,0.12)" : "rgba(139,92,246,0.12)",
                    border: `1px solid ${pushOn ? "rgba(6,182,212,0.3)" : "rgba(139,92,246,0.3)"}`,
                    borderRadius: 8, padding: "4px 8px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 4, opacity: pushLoading ? 0.5 : 1,
                  }}
                >
                  {pushOn
                    ? <><BellOff size={10} color="#06B6D4" /><span style={{ fontSize: 9, color: "#06B6D4", fontWeight: 700 }}>إيقاف</span></>
                    : <><Bell size={10} color="#A78BFA" /><span style={{ fontSize: 9, color: "#A78BFA", fontWeight: 700 }}>تفعيل</span></>
                  }
                </motion.button>
              )}
              <button
                onClick={() => {
                  if (supabaseAlerts.length > 0) dismissSupabaseAlert(supabaseAlerts[0].id);
                  else setAlertVisible(false);
                }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#334155", padding: 0 }}
              >
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Week Delta Row ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {WEEK_DELTAS.map((d) => {
            const delta = d.current - d.previous;
            const pct = Math.abs(Math.round((delta / d.previous) * 100));
            const color = d.isPositive ? "#10B981" : "#F43F5E";
            return (
              <div key={d.metric} style={{
                flex: "1 1 80px", ...glass(),
                padding: "10px 12px", borderRadius: 14,
              }}>
                <p style={{ margin: "0 0 2px", fontSize: 8, color: "#334155", fontWeight: 700 }}>{d.metric}</p>
                <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                  {d.current}%
                </p>
                <p style={{ margin: "3px 0 0", fontSize: 9, fontWeight: 800, color }}>
                  {d.direction === "up" ? "↑" : "↓"} {pct}% هذا الأسبوع
                </p>
              </div>
            );
          })}
        </div>

        {/* ── Row 1: Trigger Analyzer + Timeline Chart ── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          {/* Trigger Analyzer */}
          <motion.div
            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
            style={{
              ...glass("rgba(139,92,246,0.05)", "rgba(139,92,246,0.15)"),
              padding: "18px", width: 200, flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, justifyContent: "flex-end" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#e2e8f0" }}>محلل المحفزات</span>
              <Zap size={13} color="#A78BFA" />
            </div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
              <TriggerRing score={triggerScore} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TRIGGER_SOURCES.map((t) => (
                <div key={t.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 9, color: t.color, fontWeight: 800 }}>{t.value}%</span>
                    <span style={{ fontSize: 9, color: "#334155" }}>{t.label}</span>
                  </div>
                  <div style={{ height: 3, background: "rgba(255,255,255,0.04)", borderRadius: 3, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${t.value}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      style={{ height: "100%", background: t.color, borderRadius: 3 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Timeline Chart */}
          <motion.div
            initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
            style={{ ...glass(), padding: "18px", flex: 1 }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 8, color: "#334155" }}>
                <Sun size={10} color="#F59E0B" /> <span>صباح</span>
                <Moon size={10} color="#8B5CF6" style={{ marginRight: 8 }} /> <span>مساء</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#e2e8f0" }}>تسلسل الاستجابات العاطفية</span>
            </div>
            <TimelineChart data={timelineData} />
          </motion.div>
        </div>

        {/* ── Discovered Patterns ── */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, justifyContent: "flex-end" }}>
            <span style={{ fontSize: 9, color: "#334155" }}>
              نمط مكتشف — اضغط للتفاصيل
            </span>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#e2e8f0" }}>
              الأنماط المكتشفة مؤخراً
            </h2>
            <AlertCircle size={14} color="#475569" />
          </div>
          <div style={{ display: isMobile ? "flex" : "flex", flexDirection: isMobile ? "column" : "row", gap: 10 }}>
            {PATTERNS.map((p, idx) => (
              <div key={p.id} style={{ flex: 1, minWidth: 0 }}>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <PatternCard
                    pattern={p}
                    onShare={handleSharePattern}
                    onOpenResource={onNavigateToResources}
                  />
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Behavioral Transformation Path ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            ...glass("rgba(6,182,212,0.03)", "rgba(6,182,212,0.1)"),
            padding: "20px", marginTop: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, justifyContent: "flex-end" }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#e2e8f0" }}>
              مسار التحول السلوكي
            </h3>
          </div>
          <p style={{ margin: "0 0 14px", fontSize: 10, color: "#334155", textAlign: "right" }}>
            توصيات مخصصة بناءً على الأنماط المكتشفة لتحسين جودة العلاقة وزيادة العمق العاطفي.
          </p>

          <WaveVisual />

          <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              {RECOMMENDATIONS.map((r, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.08 }}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 8,
                    padding: "10px 0", borderBottom: idx < RECOMMENDATIONS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  }}
                >
                  <span style={{ fontSize: 15 }}>{r.icon}</span>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: r.color, flexShrink: 0, marginTop: 4 }} />
                  <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", lineHeight: 1.7 }}>{r.text}</p>
                </motion.div>
              ))}
            </div>

            {/* Prediction Card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)",
                borderRadius: 18, padding: "16px 20px", minWidth: 200,
                display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center",
              }}
            >
              <Sparkles size={18} color="#10B981" style={{ margin: "0 auto 8px" }} />
              <p style={{ margin: "0 0 4px", fontSize: 9, color: "#10B981", fontWeight: 800, letterSpacing: 2 }}>
                توقع التحسن
              </p>
              <p style={{ margin: "0 0 2px", fontSize: 38, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                24%
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 9, color: "#334155" }}>
                في استقرار العلاقة عند اتباع هذه التوصيات لمدة
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 900, color: "#10B981" }}>
                14 يوماً
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Last Updated Footer */}
        <div style={{
          marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center",
          fontSize: 9, color: "#1e293b",
        }}>
          <div style={{ display: "flex", gap: 16 }}>
            <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 9, color: "#1e293b" }}>
              سياسة الخصوصية
            </button>
            <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 9, color: "#1e293b" }}>
              مساعدة
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981", display: "inline-block" }}
            />
            <span>تم التحديث · اليوم · 2:45 صباحاً</span>
          </div>
        </div>
      </main>

      {/* ══════════════════════════════════════
          Behavioral Lock / Share Modal
      ══════════════════════════════════════ */}
      <AnimatePresence>
        {shareModal && (
          <motion.div
            key="share-modal"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, background: "rgba(5,8,16,0.85)",
              backdropFilter: "blur(8px)", zIndex: 100,
              display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
            }}
            onClick={(e) => e.target === e.currentTarget && setShareModal(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
              style={{
                background: "linear-gradient(135deg, rgba(8,11,21,0.98), rgba(15,23,42,0.95))",
                border: "1px solid rgba(6,182,212,0.2)",
                borderRadius: 24, padding: "28px 24px", maxWidth: 380, width: "100%",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <Users size={32} color="#06B6D4" style={{ margin: "0 auto 10px" }} />
                <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 900, color: "#e2e8f0" }}>
                  مشاركة مع شريكك
                </h3>
                <p style={{ margin: 0, fontSize: 11, color: "#475569", lineHeight: 1.7 }}>
                  لاحظنا نمط «{shareModal.title}» في تفاعلاتك. هل تريد مشاركة هذا التحليل مع شريكك لفهم أفضل؟
                </p>
              </div>
              <div style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 14, padding: "12px 14px", marginBottom: 16, textAlign: "right",
              }}>
                <p style={{ margin: 0, fontSize: 10, color: "#64748b", lineHeight: 1.7 }}>
                  {shareModal.description}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setShareModal(null)}
                  style={{
                    flex: 1, padding: "11px 0", borderRadius: 14,
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    color: "#475569", fontSize: 11, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  لاحقاً
                </button>
                <button
                  onClick={() => {
                    const text = `شريكي — لاحظت نمط "${shareModal.title}" في تفاعلاتنا. أريد نتحدث عنه.`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                    setShareModal(null);
                  }}
                  style={{
                    flex: 2, padding: "11px 0", borderRadius: 14,
                    background: "linear-gradient(135deg, #06B6D4, #0891b2)",
                    border: "none", color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  <Users size={13} />
                  إرسال عبر واتساب
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
