"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Award, BarChart3, BookOpen,
  Flame, Heart, Pencil, Check, X as XIcon,
  Map, Star, TrendingUp, Zap, ExternalLink,
} from "lucide-react";
import { useGamificationState } from "../services/gamificationEngine";
import { useAchievementState } from "../state/achievementState";
import { useQuizHistory } from "../hooks/useQuizHistory";
import { useMapState } from "../state/mapState";
import { ACHIEVEMENTS } from "../data/achievements";

/* ══════════════════════════════════════════
   Rank Config
   ══════════════════════════════════════════ */

const RANK_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  "ستطع جدِد": { label: "مستطلع جديد", color: "#94a3b8", emoji: "🌱" },
  "شاف دا": { label: "شاف دا", color: "#14B8A6", emoji: "👁️" },
  "از تعاف": { label: "از تعاف", color: "#34D399", emoji: "🌿" },
  "ب حدد": { label: "ب حدد", color: "#FBBF24", emoji: "🎯" },
  "رائد استرار": { label: "رائد استقرار", color: "#22D3EE", emoji: "🧭" },
  "عد حة": { label: "عد حة", color: "#A78BFA", emoji: "💎" },
  "عد سا": { label: "عد سا", color: "#34D399", emoji: "🏔️" },
  "ارشا ادار": { label: "ارشا ادار", color: "#F87171", emoji: "👑" },
};
const DEFAULT_RANK = { label: "مبتدئ", color: "#475569", emoji: "🌱" };

const BIO_KEY = "alrehla_profile_bio";

/* ══════════════════════════════════════════
   Radar Chart — Personality Dimensions
   ══════════════════════════════════════════ */

interface RadarDim {
  label: string;
  value: number; // 0–100
}

function PersonalityRadar({ dims, size = 220 }: { dims: RadarDim[]; size?: number }) {
  const cx = size / 2, cy = size / 2, r = size * 0.34;
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
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {rings.map((f, idx) => (
        <polygon key={idx} points={gridPts(f)} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {dims.map((_, i) => {
        const o = pt(i, r);
        return <line key={i} x1={cx} y1={cy} x2={o.x} y2={o.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
      })}
      <defs>
        <linearGradient id="radar-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <motion.polygon
        initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7 }} points={dataPoly}
        fill="url(#radar-fill)" stroke="#14B8A6" strokeWidth="2" strokeLinejoin="round"
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {dims.map((d, i) => {
        const lblPt = pt(i, r * 1.26);
        const anchor = lblPt.x < cx - 5 ? "end" : lblPt.x > cx + 5 ? "start" : "middle";
        return (
          <text key={i} x={lblPt.x} y={lblPt.y + 4} textAnchor={anchor}
            fontSize="9.5" fill="#94a3b8" fontFamily="Cairo, sans-serif">
            {d.label}
          </text>
        );
      })}
      {dims.map((d, i) => {
        const val = Math.max(0, Math.min(1, d.value / 100));
        const p = pt(i, r * val);
        return (
          <circle key={`dot-${i}`} cx={p.x} cy={p.y} r={3}
            fill="#14B8A6" stroke="#080b15" strokeWidth={1.5} />
        );
      })}
    </svg>
  );
}

/* ══════════════════════════════════════════
   Profile Avatar with Rank Ring
   ══════════════════════════════════════════ */

function ProfileAvatar({ rank, level }: { rank: string; level: number }) {
  const cfg = RANK_CONFIG[rank] ?? DEFAULT_RANK;
  const size = 88, r = size * 0.42, circ = 2 * Math.PI * r;
  const progress = Math.min(1, (level % 10) / 10);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="rgba(255,255,255,0.05)" strokeWidth={4} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={cfg.color} strokeWidth={4} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - progress) }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }} />
      </svg>
      <div style={{
        position: "absolute", inset: 6, borderRadius: "50%",
        background: `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}0a)`,
        border: `2px solid ${cfg.color}35`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 30,
      }}>
        {cfg.emoji}
      </div>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }}
        style={{
          position: "absolute", bottom: -2, right: -2,
          width: 24, height: 24, borderRadius: "50%",
          background: cfg.color, border: "3px solid #080b15",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 900, color: "#0a0d18",
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
      <div style={{ marginTop: 8, width: "100%" }}>
        <textarea ref={ref} value={draft} onChange={(e) => setDraft(e.target.value)}
          rows={3} maxLength={160}
          placeholder="اكتب نبذة عن رحلتك..."
          style={{
            width: "100%", background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(20,184,166,0.3)", borderRadius: 10,
            padding: "8px 10px", color: "#e2e8f0", fontSize: 11,
            outline: "none", resize: "none", lineHeight: 1.6,
            fontFamily: "Cairo, sans-serif", direction: "rtl", boxSizing: "border-box",
          }} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 5 }}>
          <button onClick={cancel} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 11 }}>
            إلغاء
          </button>
          <button onClick={save} style={{
            background: "linear-gradient(135deg, #14B8A6, #0d9488)", border: "none",
            borderRadius: 8, padding: "4px 14px", color: "#0a0d18",
            fontSize: 11, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <Check size={11} /> حفظ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 6, display: "flex", alignItems: "flex-start", gap: 5, position: "relative" }}
      onClick={() => setEditing(true)}>
      <p style={{
        margin: 0, fontSize: 11, color: bio ? "#64748b" : "#334155",
        lineHeight: 1.6, textAlign: "center", cursor: "pointer",
      }}>
        {bio || "أضف نبذة عن رحلتك..."}
      </p>
      <Pencil size={10} color="#334155" style={{ flexShrink: 0, marginTop: 2 }} />
    </div>
  );
}

/* ══════════════════════════════════════════
   Stats Row
   ══════════════════════════════════════════ */

function StatsRow({ xp, achievements, quizCount, level }: {
  xp: number; achievements: number; quizCount: number; level: number;
}) {
  const items = [
    { value: xp, label: "XP", color: "#14B8A6", icon: <Zap size={13} color="#14B8A6" /> },
    { value: achievements, label: "إنجاز", color: "#FBBF24", icon: <Award size={13} color="#FBBF24" /> },
    { value: quizCount, label: "اختبار", color: "#60A5FA", icon: <BarChart3 size={13} color="#60A5FA" /> },
    { value: level, label: "المستوى", color: "#A78BFA", icon: <Star size={13} color="#A78BFA" /> },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
      {items.map((s, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.06 }}
          style={{
            background: `${s.color}08`, border: `1px solid ${s.color}18`,
            borderRadius: 12, padding: "8px 6px", textAlign: "center",
          }}>
          <div style={{ marginBottom: 3 }}>{s.icon}</div>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#e2e8f0" }}>{s.value}</p>
          <p style={{ margin: "1px 0 0", fontSize: 8, color: "#64748b" }}>{s.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   Streak Card
   ══════════════════════════════════════════ */

function StreakCard({ xp }: { xp: number }) {
  const streak = Math.min(30, Math.floor(xp / 15));
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
      style={{
        background: "linear-gradient(135deg, rgba(248,113,113,0.07), rgba(251,191,36,0.05))",
        border: "1px solid rgba(248,113,113,0.12)",
        borderRadius: 14, padding: "10px 14px",
        display: "flex", alignItems: "center", gap: 10,
      }}>
      <Flame size={18} color="#F87171" />
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#e2e8f0" }}>
          {streak > 0 ? `${streak} يوم متتالي 🔥` : "ابدأ سلسلتك!"}
        </p>
        <p style={{ margin: "1px 0 0", fontSize: 10, color: "#64748b" }}>
          {streak >= 7 ? "أداء رائع — استمر!" : "استخدم المنصة يومياً لبناء سلسلتك"}
        </p>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Journey Balance
   ══════════════════════════════════════════ */

function JourneyBalance() {
  const allNodes = useMapState((s) => s.nodes);
  const activeNodes = useMemo(() => allNodes.filter((n) => !n.isNodeArchived), [allNodes]);
  const total = activeNodes.length;
  const green = activeNodes.filter((n) => n.ring === "green").length;
  const yellow = activeNodes.filter((n) => n.ring === "yellow").length;
  const red = activeNodes.filter((n) => n.ring === "red").length;
  const pct = total > 0 ? Math.round(((green + yellow * 0.5) / total) * 100) : 0;

  if (total === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
      style={{
        background: "rgba(45,212,191,0.05)", border: "1px solid rgba(45,212,191,0.12)",
        borderRadius: 14, padding: "10px 14px",
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Map size={12} color="#14B8A6" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>توازن الخريطة</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#14B8A6" }}>{pct}%</span>
      </div>
      <div style={{ display: "flex", gap: 2, height: 5, borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
        {green > 0 && <div style={{ width: `${(green / total) * 100}%`, background: "#34D399" }} />}
        {yellow > 0 && <div style={{ width: `${(yellow / total) * 100}%`, background: "#FBBF24" }} />}
        {red > 0 && <div style={{ width: `${(red / total) * 100}%`, background: "#F87171" }} />}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9 }}>
        <span style={{ color: "#34D399", fontWeight: 600 }}>{green} قريب</span>
        <span style={{ color: "#FBBF24", fontWeight: 600 }}>{yellow} متذبذب</span>
        <span style={{ color: "#F87171", fontWeight: 600 }}>{red} بعيد</span>
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
  const recent = ACHIEVEMENTS.filter((a) => unlockedIds.includes(a.id)).slice(0, 6);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
      style={{
        background: "rgba(251,191,36,0.05)", border: "1px solid rgba(251,191,36,0.12)",
        borderRadius: 16, padding: "12px 14px",
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Award size={12} color="#FBBF24" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>الإنجازات</span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#FBBF24" }}>
          {unlocked}/{total} · {totalPoints.toLocaleString("ar")} نقطة
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.05)", marginBottom: 10 }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8 }}
          style={{ height: "100%", background: "linear-gradient(90deg,#FBBF24,#F59E0B)", borderRadius: 2 }} />
      </div>
      {recent.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 6 }}>
          {recent.map((a) => (
            <div key={a.id} title={a.title}
              style={{
                background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.18)",
                borderRadius: 10, padding: "6px 4px", textAlign: "center", fontSize: 18,
              }}>
              {a.icon}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 10, color: "#475569", textAlign: "center" }}>
          ابدأ رحلتك — إنجازات مخفية بانتظارك!
        </p>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Quiz History (with filter + report button)
   ══════════════════════════════════════════ */

type HistoryFilter = "all" | "month";

function QuizHistorySection({ history }: {
  history: Array<{ quizId: string; quizTitle: string; score: number; maxScore: number; bandTitle: string; bandColor: string; timestamp: number }>;
}) {
  const [filter, setFilter] = useState<HistoryFilter>("all");

  const filtered = useMemo(() => {
    const sorted = [...history].sort((a, b) => b.timestamp - a.timestamp);
    if (filter === "month") {
      const monthAgo = Date.now() - 30 * 86400000;
      return sorted.filter((h) => h.timestamp >= monthAgo);
    }
    return sorted;
  }, [history, filter]);

  if (history.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
        style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 14, padding: "16px", textAlign: "center",
        }}>
        <BookOpen size={22} color="#1e293b" style={{ margin: "0 auto 6px" }} />
        <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>لم تُكمل أي اختبار بعد</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
      style={{
        background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16, padding: "12px 14px",
      }}>
      {/* Header + filters */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <BarChart3 size={12} color="#60A5FA" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>سجل الاختبارات</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {(["all", "month"] as HistoryFilter[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "3px 10px", borderRadius: 14, fontSize: 9, fontWeight: 700, cursor: "pointer",
              background: filter === f ? "rgba(96,165,250,0.15)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${filter === f ? "rgba(96,165,250,0.3)" : "rgba(255,255,255,0.06)"}`,
              color: filter === f ? "#60A5FA" : "#475569",
              transition: "all 0.15s",
            }}>
              {f === "all" ? "كل النتائج" : "الشهر الحالي"}
            </button>
          ))}
        </div>
      </div>

      {/* Table header */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr auto auto",
        gap: 8, paddingBottom: 6, borderBottom: "1px solid rgba(255,255,255,0.05)",
        marginBottom: 6,
      }}>
        <span style={{ fontSize: 9, color: "#334155", fontWeight: 700 }}>اسم الاختبار</span>
        <span style={{ fontSize: 9, color: "#334155", fontWeight: 700 }}>التاريخ</span>
        <span style={{ fontSize: 9, color: "#334155", fontWeight: 700 }}>الإجراءات</span>
      </div>

      {/* Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {(filtered.length > 0 ? filtered : []).map((entry, idx) => {
          const pct = entry.maxScore > 0 ? Math.round((entry.score / entry.maxScore) * 100) : 0;
          const date = new Date(entry.timestamp);
          const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`;
          const bandColor = entry.bandColor || (pct >= 70 ? "#34D399" : pct >= 45 ? "#FBBF24" : "#F87171");
          return (
            <div key={`${entry.quizId}-${entry.timestamp}-${idx}`}
              style={{
                display: "grid", gridTemplateColumns: "1fr auto auto",
                gap: 8, alignItems: "center",
                padding: "7px 0", borderBottom: idx < filtered.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}>
              {/* Title + result badge */}
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#cbd5e1" }}>{entry.quizTitle}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <span style={{
                    fontSize: 8, fontWeight: 700, color: bandColor,
                    background: `${bandColor}15`, padding: "1px 6px", borderRadius: 8,
                  }}>
                    {entry.bandTitle || `${pct}%`}
                  </span>
                  {entry.maxScore > 0 && (
                    <span style={{ fontSize: 8, color: "#475569" }}>{entry.score}/{entry.maxScore}</span>
                  )}
                </div>
              </div>
              {/* Date */}
              <span style={{ fontSize: 9, color: "#475569" }}>{dateStr}</span>
              {/* Action */}
              <button style={{
                background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)",
                borderRadius: 8, padding: "4px 8px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 3,
                color: "#60A5FA", fontSize: 9, fontWeight: 700, whiteSpace: "nowrap",
              }}>
                <ExternalLink size={9} /> عرض التقرير
              </button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p style={{ margin: "10px 0", fontSize: 11, color: "#475569", textAlign: "center" }}>
            لا توجد نتائج في هذه الفترة
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   Personality Radar Section
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
  // Map quiz IDs / titles to radar dimensions via keywords
  const totals: Record<string, { sum: number; n: number }> = {};
  const init = () => RADAR_DIMS.forEach((d) => { if (!totals[d.key]) totals[d.key] = { sum: 0, n: 0 }; });
  init();

  for (const entry of history) {
    const pct = entry.maxScore > 0 ? (entry.score / entry.maxScore) * 100 : 0;
    const title = entry.quizTitle.toLowerCase();
    if (title.includes("عاطف") || title.includes("مشاعر")) {
      totals.emotional.sum += pct; totals.emotional.n++;
    }
    if (title.includes("وعي") || title.includes("ذات") || title.includes("شخصي") || title.includes("mbti")) {
      totals.awareness.sum += pct; totals.awareness.n++;
    }
    if (title.includes("تعاطف") || title.includes("علاقات") || title.includes("حب")) {
      totals.empathy.sum += pct; totals.empathy.n++;
    }
    if (title.includes("مرون") || title.includes("صمود") || title.includes("توتر") || title.includes("قلق")) {
      totals.flexibility.sum += pct; totals.flexibility.n++;
    }
    if (title.includes("نزاع") || title.includes("خلاف") || title.includes("حل")) {
      totals.conflict.sum += pct; totals.conflict.n++;
    }
    if (title.includes("تواصل") || title.includes("حوار") || title.includes("كلام") || title.includes("listen")) {
      totals.communication.sum += pct; totals.communication.n++;
    }
  }

  // Fallback: use XP-based estimate (ensures radar always shows something)
  const xpBase = Math.min(90, 30 + xp * 0.4);
  return RADAR_DIMS.map((d) => ({
    label: d.label,
    value: totals[d.key].n > 0
      ? Math.round(totals[d.key].sum / totals[d.key].n)
      : Math.round(xpBase + (Math.sin(d.label.charCodeAt(0)) * 12)),
  }));
}

/* ══════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════ */

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
    <div dir="rtl" style={{ minHeight: "100vh", background: "#080b15" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "22px 18px 80px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {onBack && (
              <button onClick={onBack} style={{
                background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 10,
                width: 34, height: 34, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <ArrowLeft size={15} color="#94a3b8" />
              </button>
            )}
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#e2e8f0" }}>ملفي الشخصي</h1>
          </div>
        </div>

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 22, padding: "20px 18px", marginBottom: 12,
            display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
          }}>
          <ProfileAvatar rank={rank} level={level} />
          <h2 style={{ margin: "10px 0 2px", fontSize: 17, fontWeight: 900, color: "#e2e8f0" }}>المسافر</h2>
          <span style={{
            fontSize: 9, fontWeight: 700, color: cfg.color,
            background: `${cfg.color}14`, border: `1px solid ${cfg.color}28`,
            padding: "2px 10px", borderRadius: 18, marginBottom: 4,
          }}>
            {cfg.emoji} {cfg.label}
          </span>
          <p style={{ margin: 0, fontSize: 9, color: "#334155" }}>عضو منذ {memberSince}</p>
          {/* ① Editable Bio */}
          <EditableBio />
        </motion.div>

        {/* Stats Row */}
        <div style={{ marginBottom: 10 }}>
          <StatsRow xp={xp} achievements={unlockedIds.length} quizCount={history.length} level={level} />
        </div>

        {/* Streak */}
        <div style={{ marginBottom: 10 }}>
          <StreakCard xp={xp} />
        </div>

        {/* ② Personality Radar Chart */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 18, padding: "14px 12px", marginBottom: 10,
            display: "flex", flexDirection: "column", alignItems: "center",
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, alignSelf: "flex-start" }}>
            <TrendingUp size={12} color="#14B8A6" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#e2e8f0" }}>تحليل نمو الشخصية</span>
          </div>
          <PersonalityRadar dims={radarDims} size={220} />
        </motion.div>

        {/* Journey Balance */}
        <div style={{ marginBottom: 10 }}>
          <JourneyBalance />
        </div>

        {/* Achievements */}
        <div style={{ marginBottom: 10 }}>
          <AchievementsSummary unlockedIds={unlockedIds} totalPoints={totalPoints} />
        </div>

        {/* ③④ Quiz History with filter + report button */}
        <QuizHistorySection history={history} />

        <p style={{ textAlign: "center", fontSize: 9, color: "#1e293b", marginTop: 18 }}>
          رحلتك فريدة — كل خطوة بتقرّبك من النسخة اللي تستحقها.
        </p>
      </div>
    </div>
  );
}
