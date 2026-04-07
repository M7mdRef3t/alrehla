"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, TrendingUp, AlertTriangle, Copy,
  ChevronRight, ChevronDown, Loader2, Sparkles, MapPin,
} from "lucide-react";
import { CA_DIMENSIONS, type CADimension } from "@/data/comprehensiveAssessmentData";
import { getComparisonResults, type AnalysisResult } from "@/services/partnerCompareService";

/* ══════════════════════════════════════════
   Dual Radar Chart
   ══════════════════════════════════════════ */

function DualRadar({ dimensions, scoresA, scoresB, size = 280 }: {
  dimensions: CADimension[];
  scoresA: Record<string, number>;
  scoresB: Record<string, number>;
  size?: number;
}) {
  const cx = size / 2, cy = size / 2, r = size * 0.34;
  const n = dimensions.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i: number, radius: number) => ({
    x: cx + radius * Math.cos(angle(i)),
    y: cy + radius * Math.sin(angle(i)),
  });
  const rings = [0.25, 0.5, 0.75, 1];
  const gridPts = (f: number) => dimensions.map((_, i) => `${pt(i, r * f).x},${pt(i, r * f).y}`).join(" ");
  const mkPoly = (scores: Record<string, number>) =>
    dimensions.map((d, i) => {
      const val = Math.max(0, Math.min(1, (scores[d.id] ?? 0) / 12));
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
        <linearGradient id="fill-a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="fill-b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <motion.polygon initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }} points={mkPoly(scoresA)}
        fill="url(#fill-a)" stroke="#14B8A6" strokeWidth="2" strokeLinejoin="round"
        style={{ transformOrigin: `${cx}px ${cy}px` }} />
      <motion.polygon initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }} points={mkPoly(scoresB)}
        fill="url(#fill-b)" stroke="#A78BFA" strokeWidth="2" strokeLinejoin="round" strokeDasharray="6 3"
        style={{ transformOrigin: `${cx}px ${cy}px` }} />
      {dimensions.map((d, i) => {
        const lblPt = pt(i, r * 1.25);
        const anchor = lblPt.x < cx - 5 ? "end" : lblPt.x > cx + 5 ? "start" : "middle";
        return (
          <text key={i} x={lblPt.x} y={lblPt.y + 4} textAnchor={anchor}
            fontSize="10" fill="#94a3b8" fontFamily="var(--font-sans)">
            {d.emoji} {d.title}
          </text>
        );
      })}
    </svg>
  );
}

/* ══════════════════════════════════════════
   Compatibility Gauge
   ══════════════════════════════════════════ */

function CompatGauge({ pct, color }: { pct: number; color: string }) {
  const size = 110, r = size * 0.38, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size * 0.09} />
        <motion.circle cx={cx} cy={cy} r={r} fill="none" stroke={color}
          strokeWidth={size * 0.09} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          style={{ fontSize: 22, fontWeight: 900, color: "#e2e8f0", lineHeight: 1 }}>
          {pct}%
        </motion.span>
        <span style={{ fontSize: 9, color: "#64748b", marginTop: 2 }}>توافق</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Avatar Initials
   ══════════════════════════════════════════ */

function AvatarBubble({ label, color, size = 52 }: { label: string; color: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `${color}20`, border: `2px solid ${color}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.32, fontWeight: 800, color, flexShrink: 0,
    }}>
      {label}
    </div>
  );
}

/* ══════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════ */

interface GapItem {
  dim: CADimension;
  scoreA: number;
  scoreB: number;
  gap: number;
  advice: string;
}

const GAP_ADVICE: Record<string, string> = {
  attachment: "ناقشوا أنماط التعلق — فهم احتياجات الأمان لكل طرف يخلق قاعدة صلبة.",
  boundaries: "تفاوضوا على الحدود كفريق — مش كخصمين. كل حد مشروع.",
  codependency: "شجعوا بعض على أنشطة مستقلة — الاستقلالية تغذي العلاقة.",
  communication: "جربوا 'ساعة الصدق الأسبوعية' — 30 دقيقة لكل طرف يتكلم والثاني يستمع فقط.",
  selfawareness: "شاركوا يوميات المشاعر الأسبوعية — الوعي المشترك يعمّق الاتصال.",
};

function computeGaps(scoresA: Record<string, number>, scoresB: Record<string, number>): GapItem[] {
  return CA_DIMENSIONS.map((dim) => ({
    dim,
    scoreA: scoresA[dim.id] ?? 0,
    scoreB: scoresB[dim.id] ?? 0,
    gap: Math.abs((scoresA[dim.id] ?? 0) - (scoresB[dim.id] ?? 0)),
    advice: GAP_ADVICE[dim.id] ?? "",
  })).sort((a, b) => b.gap - a.gap);
}

function computeCompatibility(scoresA: Record<string, number>, scoresB: Record<string, number>): number {
  let totalDiff = 0;
  for (const dim of CA_DIMENSIONS) {
    totalDiff += Math.abs((scoresA[dim.id] ?? 0) - (scoresB[dim.id] ?? 0));
  }
  return Math.round((1 - totalDiff / (CA_DIMENSIONS.length * 12)) * 100);
}

/* ══════════════════════════════════════════
   Synergy Insights — 2 cards
   ══════════════════════════════════════════ */

interface SynergyInsight {
  icon: string;
  tag: string;
  tagColor: string;
  title: string;
  body: string;
}

function buildSynergyInsights(
  scoresA: Record<string, number>,
  scoresB: Record<string, number>,
  gaps: GapItem[],
): SynergyInsight[] {
  const strengths = CA_DIMENSIONS.filter((d) => (scoresA[d.id] ?? 0) >= 8 && (scoresB[d.id] ?? 0) >= 8);
  const topGap = gaps[0];

  const SYNERGY_TEXT: Record<string, { title: string; body: string }> = {
    attachment: { title: "رابط عاطفي آمن", body: "كلاكما يؤسسان علاقتهما على الأمان العاطفي — هذا ينعكس على الاستقرار اليومي." },
    boundaries: { title: "احترام الفضاء الشخصي", body: "حدودكما متوازنة — كل طرف يحترم مساحة الآخر دون أن يشعر بالقيود." },
    codependency: { title: "استقلالية صحية", body: "علاقتكما مبنية على الاختيار لا الاحتياج — هذا أساس الاستمرارية." },
    communication: { title: "جسر تواصل قوي", body: "قدرتكما على التعبير والاستماع في مستوى متقارب — هذا يقلل سوء الفهم." },
    selfawareness: { title: "وعي ذاتي مشترك", body: "كلاكما يمتلك وعياً بمشاعره — هذا يسهّل التعامل مع الخلافات بنضج." },
  };

  const CONFLICT_TEXT: Record<string, { title: string; body: string }> = {
    attachment: { title: "أنماط تعلق مختلفة", body: "أحدكما يحتاج أماناً أكثر من الآخر — التحدث عن هذا الاحتياج يصنع جسراً." },
    boundaries: { title: "تعريف الحدود يختلف", body: "ما يبدو 'طبيعياً' لأحدكما قد يبدو 'تدخلاً' للآخر — المصارحة هي الحل." },
    codependency: { title: "الاعتماد يحتاج توازن", body: "أحدكما يميل للاعتماد أكثر — فضاء شخصي مشترك الاتفاق عليه يساعد." },
    communication: { title: "أسلوب التعبير مختلف", body: "أحدكما أكثر مباشرة من الآخر — التعلم من أسلوب بعض يثري الحوار." },
    selfawareness: { title: "عمق التأمل يتفاوت", body: "أحدكما أكثر تأملاً — شارك الآخر يومياتك العاطفية لجسر هذا الفارق." },
  };

  const results: SynergyInsight[] = [];

  if (strengths.length > 0) {
    const best = strengths[0];
    const txt = SYNERGY_TEXT[best.id] ?? { title: `${best.title} مشترك`, body: "كلاكما متقاربان في هذا البُعد." };
    results.push({ icon: "✅", tag: "رؤية مشتركة", tagColor: "#34D399", title: txt.title, body: txt.body });
  } else {
    results.push({
      icon: "🌱", tag: "مجال للتطور", tagColor: "#FBBF24",
      title: "نقطة انطلاق للنمو",
      body: "لا بأس — الفوارق بينكما هي الفرصة الذهبية للتعلم من بعض.",
    });
  }

  if (topGap) {
    const txt = CONFLICT_TEXT[topGap.dim.id] ?? { title: topGap.dim.title, body: GAP_ADVICE[topGap.dim.id] ?? "" };
    results.push({ icon: "🔄", tag: "يحتاج عمل مشترك", tagColor: "#FBBF24", title: txt.title, body: txt.body });
  }

  return results;
}

/* ══════════════════════════════════════════
   Shared Growth Roadmap
   ══════════════════════════════════════════ */

interface RoadmapPhase {
  phase: string;
  weeks: string;
  icon: string;
  title: string;
  desc: string;
  color: string;
}

const ROADMAP_BY_DIM: Record<string, { short: { title: string; desc: string }; mid: { title: string; desc: string }; long: { title: string; desc: string } }> = {
  attachment: {
    short: { title: "ساعة الأمان الأسبوعية", desc: "جلسة 30 دقيقة مخصصة للتعبير عن احتياجات الأمان بدون أحكام." },
    mid: { title: "خريطة الاحتياجات العاطفية", desc: "ارسموا معاً ما يجعل كل طرف يشعر بالأمان — وعلّقوها في مكان مرئي." },
    long: { title: "بناء طقوس الاتصال", desc: "أنشئوا عادة يومية صغيرة (قهوة الصباح / رسالة مساء) تُرسّخ الارتباط." },
  },
  boundaries: {
    short: { title: "اتفاقية الحدود الزوجية", desc: "اكتبوا معاً 3 حدود لكل طرف — بدون تفاوض أولي، مجرد استماع." },
    mid: { title: "مراجعة شهرية للحدود", desc: "كل شهر راجعوا ما يشعر فيه أحدكما بضغط وأعيدوا رسم الاتفاق." },
    long: { title: "الحدود كلغة مشتركة", desc: "حوّلوا الحدود من 'رفض' إلى 'احترام' — طوّروا قاموساً زوجياً لذلك." },
  },
  codependency: {
    short: { title: "يوم الاستقلالية الأسبوعي", desc: "كل طرف يقضي 3 ساعات في نشاط منفرد بدون إحساس بالذنب." },
    mid: { title: "مشروع شخصي لكل طرف", desc: "كل فرد يبدأ مشروعاً خاصاً — الموسيقى، الرياضة، القراءة — ويشارك تقدمه." },
    long: { title: "الهوية الفردية داخل الشراكة", desc: "ادعموا بعض في الطموحات الفردية — الإنجاز الشخصي يثري العلاقة." },
  },
  communication: {
    short: { title: "تعزيز الحوار العاطفي", desc: "خصصوا 15 دقيقة يومياً للمشاعر: كل طرف يشارك شيئاً واحداً أثّر فيه اليوم." },
    mid: { title: "لغة الحب المتبادلة", desc: "تعلّموا لغة حب الآخر (الخدمة، اللمس، الكلمات، الهدايا، الوقت) وطبّقوها أسبوعياً." },
    long: { title: "رسم خارطة الأحلام المشتركة", desc: "جلسة شهرية لرسم أهدافكما على مدى 3 سنوات — دا بيحوّل اللي محدش قاله لأهداف حقيقية." },
  },
  selfawareness: {
    short: { title: "يوميات المشاعر المشتركة", desc: "دفتر واحد تكتبان فيه بالتناوب — 3 مشاعر يومياً بدون رأي أو تعليق." },
    mid: { title: "مرايا التأمل الزوجي", desc: "أسبوعياً، كل طرف يخبر الآخر: 'لاحظت أني هذا الأسبوع...' — وعي يبني وعياً." },
    long: { title: "رحلة النمو الروحي المشترك", desc: "اختاروا ممارسة مشتركة (تأمل، يوغا، قراءة) تُغذّي الوعي بالذات معاً." },
  },
};

function buildRoadmap(scoresA: Record<string, number>, scoresB: Record<string, number>): RoadmapPhase[] {
  // Sort dims by average score (ascending) = most needed first
  const sorted = [...CA_DIMENSIONS].sort((a, b) => {
    const avgA = ((scoresA[a.id] ?? 0) + (scoresB[a.id] ?? 0)) / 2;
    const avgB = ((scoresA[b.id] ?? 0) + (scoresB[b.id] ?? 0)) / 2;
    return avgA - avgB;
  });

  const primary = sorted[0];
  const secondary = sorted[1] ?? sorted[0];
  const tertiary = sorted[2] ?? sorted[0];

  const getRoadmap = (dim: CADimension, phase: "short" | "mid" | "long") =>
    ROADMAP_BY_DIM[dim.id]?.[phase] ?? { title: dim.title, desc: GAP_ADVICE[dim.id] ?? "" };

  return [
    {
      phase: "المرحلة الأولى",
      weeks: "الأسبوع 1—2",
      icon: primary.emoji,
      color: "#14B8A6",
      ...getRoadmap(primary, "short"),
    },
    {
      phase: "المرحلة الثانية",
      weeks: "الأسبوع 3—6",
      icon: secondary.emoji,
      color: "#A78BFA",
      ...getRoadmap(secondary, "mid"),
    },
    {
      phase: "المرحلة الثالثة",
      weeks: "الأسبوع 8+",
      icon: tertiary.emoji,
      color: "#FBBF24",
      ...getRoadmap(tertiary, "long"),
    },
  ];
}

/* ══════════════════════════════════════════
   Waiting Screen
   ══════════════════════════════════════════ */

function WaitingForPartner({ shareCode, onBack }: { shareCode: string; onBack: () => void }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname}?compare=${shareCode}`
    : `?compare=${shareCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "60px 24px", textAlign: "center" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>💑</div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#e2e8f0" }}>في انتظار شريكك</h2>
        <p style={{ margin: "10px 0 28px", fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>
          شارك الرابط مع شريكك. بمجرد إكماله التحليل ستظهر المقارنة تلقائياً.
        </p>

        <div style={{
          background: "rgba(20,184,166,0.08)", border: "1px solid rgba(20,184,166,0.25)",
          borderRadius: 16, padding: "18px 20px", marginBottom: 20,
        }}>
          <p style={{ margin: "0 0 6px", fontSize: 11, color: "#14B8A6", fontWeight: 600 }}>كود المشاركة</p>
          <p style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "0.2em", color: "#e2e8f0", fontFamily: "var(--font-mono)" }}>
            {shareCode}
          </p>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12, padding: "10px 14px", marginBottom: 20,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <input id="partner-compare-share-url" name="partnerCompareShareUrl" readOnly value={shareUrl} style={{ flex: 1, background: "none", border: "none", color: "#94a3b8", fontSize: 12, outline: "none", direction: "ltr" }} />
          <button onClick={handleCopy} style={{
            background: copied ? "rgba(52,211,153,0.2)" : "rgba(20,184,166,0.15)",
            border: "none", borderRadius: 8, padding: "6px 12px",
            color: copied ? "#34D399" : "#14B8A6", fontSize: 12, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            <Copy size={13} /> {copied ? "تم!" : "نسخ"}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 24 }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
            <Loader2 size={16} color="#475569" />
          </motion.div>
          <span style={{ fontSize: 12, color: "#475569" }}>يتم التحقق تلقائياً كل 10 ثوان...</span>
        </div>

        <button onClick={onBack} style={{
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14, padding: "12px 24px", color: "#94a3b8", fontSize: 13, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6, margin: "0 auto",
        }}>
          <ArrowLeft size={14} /> رجوع
        </button>
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Comparison View (V2)
   ══════════════════════════════════════════ */

function ComparisonView({ initiator, partner, onBack }: {
  initiator: AnalysisResult;
  partner: AnalysisResult;
  onBack: () => void;
}) {
  const [openPhase, setOpenPhase] = useState<number | null>(0);
  const compat = useMemo(() => computeCompatibility(initiator.scores, partner.scores), [initiator, partner]);
  const gaps = useMemo(() => computeGaps(initiator.scores, partner.scores), [initiator, partner]);
  const synergyInsights = useMemo(() => buildSynergyInsights(initiator.scores, partner.scores, gaps), [initiator, partner, gaps]);
  const roadmap = useMemo(() => buildRoadmap(initiator.scores, partner.scores), [initiator, partner]);
  const compatColor = compat >= 70 ? "#14B8A6" : compat >= 45 ? "#FBBF24" : "#F87171";
  const compatLabel = compat >= 70 ? "توافق عالي 💚" : compat >= 45 ? "توافق متوسط 💛" : "يحتاج عمل مشترك ❤️‍🩹";

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 20px 60px" }}>

      {/* ① Avatar Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 28 }}>
        <div style={{ textAlign: "center" }}>
          <AvatarBubble label="أنا" color="#14B8A6" />
          <p style={{ margin: "6px 0 0", fontSize: 11, color: "#64748b" }}>أنا</p>
        </div>

        {/* Gauge in center */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <CompatGauge pct={compat} color={compatColor} />
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>
            {compatLabel}
          </motion.span>
        </div>

        <div style={{ textAlign: "center" }}>
          <AvatarBubble label="هو/هي" color="#A78BFA" />
          <p style={{ margin: "6px 0 0", fontSize: 11, color: "#64748b" }}>الشريك/ة</p>
        </div>
      </motion.div>

      {/* ② Dual Radar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20,
          padding: 14, display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 14,
        }}>
        <DualRadar dimensions={CA_DIMENSIONS} scoresA={initiator.scores} scoresB={partner.scores} size={240} />
        <div style={{ display: "flex", gap: 20, marginTop: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 3, background: "#14B8A6", borderRadius: 2 }} />
            <span style={{ fontSize: 11, color: "#64748b" }}>أنا</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 3, background: "#A78BFA", borderRadius: 2 }} />
            <span style={{ fontSize: 11, color: "#64748b" }}>الشريك/ة</span>
          </div>
        </div>
      </motion.div>

      {/* ③ Dimension bars */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 20, padding: "16px 18px", marginBottom: 14,
        }}>
        <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>نظرة عامة على التوازن</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {CA_DIMENSIONS.map((dim) => {
            const aScore = initiator.scores[dim.id] ?? 0;
            const bScore = partner.scores[dim.id] ?? 0;
            const aPct = Math.round((aScore / 12) * 100);
            const bPct = Math.round((bScore / 12) * 100);
            const avgPct = Math.round((aPct + bPct) / 2);
            const barColor = avgPct >= 70 ? "#34D399" : avgPct >= 45 ? "#FBBF24" : "#F87171";
            return (
              <div key={dim.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 14 }}>{dim.emoji}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1" }}>{dim.title}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, fontSize: 10 }}>
                    <span style={{ color: "#14B8A6", fontWeight: 700 }}>{aPct}%</span>
                    <span style={{ color: "#475569" }}>|</span>
                    <span style={{ color: "#A78BFA", fontWeight: 700 }}>{bPct}%</span>
                  </div>
                </div>
                {/* Stacked bar: me + partner */}
                <div style={{ height: 6, borderRadius: 4, background: "rgba(255,255,255,0.05)", overflow: "hidden", display: "flex" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${aPct / 2}%` }}
                    transition={{ duration: 0.5 }}
                    style={{ height: "100%", background: "#14B8A6" }} />
                  <motion.div initial={{ width: 0 }} animate={{ width: `${bPct / 2}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    style={{ height: "100%", background: "#A78BFA" }} />
                </div>
                <div style={{ marginTop: 3, display: "flex", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: 9, color: barColor, fontWeight: 700 }}>
                    {avgPct >= 70 ? "متناغم" : avgPct >= 45 ? "مشترك" : "يحتاج تطوير"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ④ Synergy Insights */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Sparkles size={14} color="#A78BFA" />
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>رؤى التآزر</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {synergyInsights.map((ins, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + idx * 0.1 }}
              style={{
                background: `${ins.tagColor}08`, border: `1px solid ${ins.tagColor}20`,
                borderRadius: 16, padding: "14px 14px",
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>{ins.icon}</span>
                <span style={{
                  fontSize: 9, fontWeight: 700, color: ins.tagColor,
                  background: `${ins.tagColor}18`, padding: "2px 8px", borderRadius: 20,
                }}>
                  {ins.tag}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.4, marginBottom: 5 }}>{ins.title}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{ins.body}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ⑤ Gap Analysis */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        style={{
          background: "linear-gradient(135deg, rgba(251,191,36,0.06), rgba(248,113,113,0.04))",
          border: "1px solid rgba(251,191,36,0.15)",
          borderRadius: 20, padding: "16px 18px", marginBottom: 14,
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <TrendingUp size={14} color="#FBBF24" />
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>أبرز فجوات التوافق</h3>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {gaps.slice(0, 3).map((g) => (
            <div key={g.dim.id} style={{
              background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "12px 14px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{g.dim.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{g.dim.title}</span>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: g.gap >= 6 ? "#F87171" : g.gap >= 3 ? "#FBBF24" : "#34D399",
                }}>
                  فجوة {Math.round((g.gap / 12) * 100)}%
                </span>
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#475569", marginBottom: 6 }}>
                <span>أنا: <strong style={{ color: "#14B8A6" }}>{Math.round((g.scoreA / 12) * 100)}%</strong></span>
                <span>الشريك: <strong style={{ color: "#A78BFA" }}>{Math.round((g.scoreB / 12) * 100)}%</strong></span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                <AlertTriangle size={12} color="#FBBF24" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ margin: 0, fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{g.advice}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ⑥ Shared Growth Roadmap */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <MapPin size={14} color="#14B8A6" />
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>خارطة طريق النمو المشترك</h3>
          <span style={{ fontSize: 10, color: "#475569" }}>- خطوات انطلاق من النتائج القائمة</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {roadmap.map((phase, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 + idx * 0.08 }}>
              <button
                onClick={() => setOpenPhase(openPhase === idx ? null : idx)}
                style={{
                  width: "100%", background: openPhase === idx
                    ? `linear-gradient(135deg, ${phase.color}12, ${phase.color}06)`
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${openPhase === idx ? phase.color + "30" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: 14, padding: "13px 16px", cursor: "pointer", textAlign: "right",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  transition: "all 0.2s",
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: `${phase.color}15`, border: `1px solid ${phase.color}30`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                  }}>
                    {phase.icon}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontSize: 12, color: phase.color, fontWeight: 600 }}>{phase.phase} — {phase.weeks}</p>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{phase.title}</p>
                  </div>
                </div>
                <ChevronDown size={16} color="#475569"
                  style={{ transform: openPhase === idx ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
              </button>

              <AnimatePresence>
                {openPhase === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                    style={{ overflow: "hidden" }}>
                    <div style={{
                      padding: "12px 16px 14px",
                      background: `${phase.color}06`,
                      border: `1px solid ${phase.color}20`, borderTop: "none",
                      borderRadius: "0 0 14px 14px",
                    }}>
                      <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>{phase.desc}</p>
                      <div style={{ marginTop: 10 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: phase.color,
                          background: `${phase.color}15`, padding: "3px 10px", borderRadius: 20,
                        }}>
                          💡 ابدأوا هذا الأسبوع
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Action Button */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
        <button onClick={onBack} style={{
          width: "100%", padding: "14px", borderRadius: 14,
          background: "linear-gradient(135deg, #14B8A6, #0d9488)",
          border: "none", color: "#0a0d18", fontSize: 14, fontWeight: 800, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <ChevronRight size={16} /> رجوع للاختبارات
        </button>
      </motion.div>

      <p style={{ textAlign: "center", fontSize: 10, color: "#1e293b", marginTop: 20 }}>
        هذا التقرير للتوعية المشتركة وليس بديلاً عن الاستشارة المتخصصة.
      </p>
    </div>
  );
}

/* ══════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════ */

interface PartnerCompareProps {
  shareCode: string;
  onBack: () => void;
}

export function PartnerCompare({ shareCode, onBack }: PartnerCompareProps) {
  const [initiator, setInitiator] = useState<AnalysisResult | null>(null);
  const [partner, setPartner] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const fetchResults = async () => {
      const { initiator: ini, partner: par } = await getComparisonResults(shareCode);
      if (!active) return;
      setInitiator(ini);
      setPartner(par);
      setLoading(false);
      if (ini && par && intervalId) clearInterval(intervalId);
    };

    fetchResults();
    intervalId = setInterval(fetchResults, 10000);

    return () => {
      active = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [shareCode]);

  if (loading) {
    return (
      <div dir="rtl" style={{ minHeight: "100vh", background: "#080b15", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
          <Loader2 size={32} color="#14B8A6" />
        </motion.div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#080b15" }}>
      {initiator && partner ? (
        <ComparisonView initiator={initiator} partner={partner} onBack={onBack} />
      ) : (
        <WaitingForPartner shareCode={shareCode} onBack={onBack} />
      )}
    </div>
  );
}
