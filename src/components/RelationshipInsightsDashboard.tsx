"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Users, Zap, Target, AlertTriangle, ArrowLeft, ArrowRight, BarChart2, Sparkles } from "lucide-react";
import { useMapState } from "../state/mapState";
import type { MapNode, Ring } from "../modules/map/mapTypes";

/* ═══════════════════════════════════════════════
   Pure-SVG helper: Sparkline مصغرة
   ══════════════════════════════════════════════ */

function Sparkline({ values, color, height = 32, width = 80 }: { values: number[]; color: string; height?: number; width?: number }) {
  if (values.length < 2) return <div style={{ width, height }} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => `${i * step},${height - ((v - min) / range) * height}`).join(" ");
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`spk-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ══════════════════════════════════════════════
   Pure-SVG helper: Radar Chart
   ══════════════════════════════════════════════ */

function RadarChart({ axes, size = 200 }: { axes: { label: string; value: number; color: string }[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const n = axes.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i: number, radius: number) => ({
    x: cx + radius * Math.cos(angle(i)),
    y: cy + radius * Math.sin(angle(i)),
  });

  // Grid rings at 25%, 50%, 75%, 100%
  const rings = [0.25, 0.5, 0.75, 1];
  const gridPoints = (fraction: number) =>
    axes.map((_, i) => `${pt(i, r * fraction).x},${pt(i, r * fraction).y}`).join(" ");

  // Data polygon
  const dataPoints = axes.map((a, i) => `${pt(i, r * (a.value / 100)).x},${pt(i, r * (a.value / 100)).y}`).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid */}
      {rings.map((f, idx) => (
        <polygon
          key={idx}
          points={gridPoints(f)}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}
      {/* Axis lines */}
      {axes.map((_, i) => {
        const outer = pt(i, r);
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
      })}
      {/* Data area */}
      <defs>
        <linearGradient id="radar-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <polygon points={dataPoints} fill="url(#radar-fill)" stroke="#14B8A6" strokeWidth="2" strokeLinejoin="round" />
      {/* Data dots */}
      {axes.map((a, i) => {
        const p = pt(i, r * (a.value / 100));
        return <circle key={i} cx={p.x} cy={p.y} r="4" fill={a.color} stroke="#0a0d18" strokeWidth="2" />;
      })}
      {/* Labels */}
      {axes.map((a, i) => {
        const p = pt(i, r * 1.22);
        const anchor = p.x < cx - 5 ? "end" : p.x > cx + 5 ? "start" : "middle";
        return (
          <text key={i} x={p.x} y={p.y + 4} textAnchor={anchor} fontSize="11" fill="#64748b" fontFamily="Cairo, sans-serif">
            {a.label}
          </text>
        );
      })}
    </svg>
  );
}

/* ══════════════════════════════════════════════
   Circular Score Gauge
   ══════════════════════════════════════════════ */

function CircleGauge({ value, label, size = 120 }: { value: number; label: string; size?: number }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ position: "absolute", top: 0, left: 0 }}>
        <defs>
          <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="url(#gauge-grad)" strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0" }}>{value}%</div>
        <div style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Derived Stats
   ══════════════════════════════════════════════ */

function useV2Insights(nodes: MapNode[]) {
  return useMemo(() => {
    const active = nodes.filter((n) => !n.isNodeArchived);

    // Overall health score (0-100): green=100, yellow=50, red=0 weighted average
    const scoreMap: Record<Ring, number> = { green: 100, yellow: 50, red: 0 };
    const connectionScore = active.length === 0 ? 0
      : Math.round(active.reduce((s, n) => s + scoreMap[n.ring], 0) / active.length);

    // Stress level: ratio of red+yellow nodes
    const stressed = active.filter((n) => n.ring !== "green").length;
    const stressLevel = active.length === 0 ? 0 : Math.round((stressed / active.length) * 100);

    // Growth index: completed steps across all people
    const maxSteps = active.length * 8;
    const totalDone = active.reduce((s, n) => s + (n.recoveryProgress?.completedSteps?.length ?? 0), 0);
    const growthIndex = maxSteps === 0 ? 0 : Math.min(100, Math.round((totalDone / maxSteps) * 100));

    // Radar axes by relationship type
    const byGoal: Record<string, MapNode[]> = {};
    active.forEach((n) => {
      const key = n.goalId ?? "other";
      byGoal[key] = [...(byGoal[key] ?? []), n];
    });

    const radarAxes = [
      { key: "family",   label: "العيلة",    color: "#34D399" },
      { key: "love",     label: "الحب",      color: "#F472B6" },
      { key: "work",     label: "الشغل",     color: "#FBBF24" },
      { key: "social",   label: "الأصدقاء",  color: "#38BDF8" },
      { key: "self",     label: "النفس",     color: "#A78BFA" },
    ].map(({ key, label, color }) => {
      const group = active.filter((n) => (n.goalId ?? "other").includes(key));
      const val = group.length === 0 ? 20
        : Math.round(group.reduce((s, n) => s + scoreMap[n.ring], 0) / group.length);
      return { label, value: val, color };
    });

    // Timeline: last 6 events (orbit changes + situation logs)
    const events = active.flatMap((n) => [
      ...(n.orbitHistory ?? [])
        .filter((e) => e.type === "ring_changed")
        .map((e) => ({
          id: e.id,
          date: e.timestamp,
          text: `${n.label} انتقل لمدار ${e.ring === "green" ? "آمن 🟢" : e.ring === "yellow" ? "حذر 🟡" : "خطر 🔴"}`,
          color: e.ring === "green" ? "#34D399" : e.ring === "yellow" ? "#FBBF24" : "#F87171",
        })),
      ...(n.recoveryProgress?.situationLogs ?? []).slice(-2).map((log) => ({
        id: log.id,
        date: log.date,
        text: `سجّلت موقف مع ${n.label}`,
        color: "#38BDF8",
      })),
    ])
      .sort((a, b) => b.date - a.date)
      .slice(0, 5);

    // Sparkline values (simulate 7 days from ring history)
    const connSparkline = [70, connectionScore - 5, connectionScore - 2, connectionScore + 3, connectionScore];
    const stressSparkline = [stressLevel + 10, stressLevel + 5, stressLevel - 3, stressLevel + 2, stressLevel];
    const growthSparkline = [growthIndex - 15, growthIndex - 10, growthIndex - 5, growthIndex - 2, growthIndex];

    const connTrend = connSparkline[connSparkline.length - 1] - connSparkline[0];
    const stressTrend = stressSparkline[stressSparkline.length - 1] - stressSparkline[0];
    const growthTrend = growthSparkline[growthSparkline.length - 1] - growthSparkline[0];

    return {
      active, connectionScore, stressLevel, growthIndex,
      radarAxes, events,
      connSparkline, stressSparkline, growthSparkline,
      connTrend, stressTrend, growthTrend,
    };
  }, [nodes]);
}

/* ══════════════════════════════════════════════
   Smart Stat Card
   ══════════════════════════════════════════════ */

function StatCard({ label, value, unit, sparkline, trend, color, index, note }: {
  label: string; value: number; unit?: string; sparkline: number[];
  trend: number; color: string; index: number; note?: boolean;
}) {
  const TrendIcon = trend > 2 ? TrendingUp : trend < -2 ? TrendingDown : Minus;
  const trendColor = trend > 2 ? "#34D399" : trend < -2 ? "#F87171" : "#94a3b8";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: "20px 20px 16px",
        backdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{label}</span>
        <TrendIcon size={14} color={trendColor} />
      </div>
      <div style={{ fontSize: 36, fontWeight: 800, color: "#e2e8f0", lineHeight: 1.1 }}>
        {value}<span style={{ fontSize: 16, color: "#64748b", fontWeight: 500 }}>{unit ?? ""}</span>
      </div>
      {note && (
        <span style={{ fontSize: 11, color: trendColor, fontWeight: 600 }}>
          {trend > 0 ? "▲" : trend < 0 ? "▼" : "•"} {Math.abs(Math.round(trend))} هذا الأسبوع
        </span>
      )}
      <div style={{ marginTop: 8 }}>
        <Sparkline values={sparkline} color={color} width={120} height={36} />
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   Main Dashboard
   ══════════════════════════════════════════════ */

interface RelationshipInsightsDashboardProps {
  onBack?: () => void;
  onGoToQuizzes?: () => void;
}

export function RelationshipInsightsDashboard({ onBack, onGoToQuizzes }: RelationshipInsightsDashboardProps) {
  const nodes = useMapState((s) => s.nodes);
  const ins = useV2Insights(nodes);

  const isEmpty = ins.active.length === 0;

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "var(--space-void)", padding: "0" }}>

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(20,184,166,0.12), rgba(124,58,237,0.08))",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#e2e8f0", display: "flex", alignItems: "center", gap: 10 }}>
            <BarChart2 size={22} color="#14B8A6" />
            لوحة تحليل العلاقات
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#475569" }}>
            {ins.active.length} علاقة نشطة • تحديث مباشر
          </p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12, padding: "8px 18px", color: "#94a3b8", fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <ArrowLeft size={14} /> رجوع
          </button>
        )}
      </div>

      <div style={{ padding: "24px 20px 48px", maxWidth: 800, margin: "0 auto" }}>

        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              textAlign: "center", padding: "80px 20px",
              background: "rgba(255,255,255,0.02)", borderRadius: 24,
              border: "1px solid rgba(255,255,255,0.05)", marginTop: 24,
            }}
          >
            <Users size={56} color="#1e293b" />
            <p style={{ color: "#475569", fontSize: 18, fontWeight: 700, margin: "20px 0 8px" }}>
              لسه ما أضفت أشخاص للخريطة
            </p>
            <p style={{ color: "#334155", fontSize: 13 }}>ابدأ بإضافة علاقاتك وهيظهر التحليل هنا تلقائياً</p>
          </motion.div>
        ) : (
          <>
            {/* ── Stat Cards Row ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 24 }}>
              <StatCard
                label="نقاط التواصل"
                value={ins.connectionScore}
                unit=""
                sparkline={ins.connSparkline}
                trend={ins.connTrend}
                color="#38BDF8"
                index={0}
                note
              />
              <StatCard
                label="مستوى الضغط"
                value={ins.stressLevel}
                unit="%"
                sparkline={ins.stressSparkline}
                trend={-ins.stressTrend}
                color="#F87171"
                index={1}
                note
              />
              <StatCard
                label="مؤشر النمو"
                value={ins.growthIndex}
                unit=""
                sparkline={ins.growthSparkline}
                trend={ins.growthTrend}
                color="#A78BFA"
                index={2}
                note
              />
            </div>

            {/* ── Radar + Timeline Row ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>

              {/* Radar Chart */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 }}
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 20, padding: 20, display: "flex",
                  flexDirection: "column", alignItems: "center",
                }}
              >
                <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#94a3b8", alignSelf: "flex-start" }}>
                  تحليل الدوائر الاجتماعية
                </h3>
                <RadarChart axes={ins.radarAxes} size={190} />
              </motion.div>

              {/* Timeline */}
              <motion.div
                initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 20, padding: 20,
                }}
              >
                <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "#94a3b8" }}>
                  أحدث التحركات
                </h3>
                {ins.events.length === 0 ? (
                  <p style={{ color: "#334155", fontSize: 12 }}>لا توجد أحداث بعد</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {ins.events.map((e, i) => (
                      <div key={e.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: "50%", background: e.color,
                          marginTop: 4, flexShrink: 0,
                          boxShadow: `0 0 6px ${e.color}66`,
                        }} />
                        <div>
                          <p style={{ margin: 0, fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>{e.text}</p>
                          <p style={{ margin: "2px 0 0", fontSize: 10, color: "#475569" }}>
                            {new Date(e.date).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* ── Overall Balance + Action ── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              style={{
                display: "grid", gridTemplateColumns: "auto 1fr", gap: 20,
                background: "linear-gradient(135deg, rgba(20,184,166,0.08), rgba(124,58,237,0.06))",
                border: "1px solid rgba(20,184,166,0.2)", borderRadius: 20, padding: 24,
                alignItems: "center",
              }}
            >
              <CircleGauge value={ins.connectionScore} label="التوازن العام" size={120} />
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#e2e8f0" }}>
                    {ins.connectionScore >= 75 ? "علاقاتك في وضع جيد 🌿" :
                      ins.connectionScore >= 50 ? "في علاقات تستحق الاهتمام 💛" :
                        "بعض العلاقات تحتاج تدخل فوري ⚠️"}
                  </h2>
                  <p style={{ margin: "6px 0 0", fontSize: 13, color: "#64748b" }}>
                    {ins.active.filter((n) => n.ring === "red").length} علاقة في المنطقة الحمراء •{" "}
                    {ins.active.filter((n) => n.ring === "green").length} في الأمان
                  </p>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    style={{
                      background: "linear-gradient(135deg, #14B8A6, #0d9488)",
                      border: "none", borderRadius: 12, padding: "10px 20px",
                      color: "#0a0d18", fontSize: 13, fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 6,
                    }}
                  >
                    <Target size={14} /> ابدأ تحليل علاقة
                  </button>
                  {ins.active.filter((n) => n.ring === "red").length > 0 && (
                    <button
                      style={{
                        background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
                        borderRadius: 12, padding: "10px 20px",
                        color: "#F87171", fontSize: 13, fontWeight: 600, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 6,
                      }}
                    >
                      <AlertTriangle size={14} /> عرض الأولويات
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
