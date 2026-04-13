import type { FC } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useMapState } from '@/modules/map/dawayirIndex';
import { computeTEI, saveTEISnapshot, getTEIComparison } from "@/utils/traumaEntropyIndex";

const CLARITY_COLORS = {
  clear:     { accent: "#34d399", bg: "rgba(52,211,153,0.07)",   border: "rgba(52,211,153,0.18)",   label: "هادي",         pulse: "rgba(52,211,153,0.12)"  },
  settling:  { accent: "#2dd4bf", bg: "rgba(45,212,191,0.07)",   border: "rgba(45,212,191,0.18)",   label: "يتحسن",        pulse: "rgba(45,212,191,0.12)"  },
  turbulent: { accent: "#fbbf24", bg: "rgba(251,191,36,0.07)",   border: "rgba(251,191,36,0.18)",   label: "في حركة",      pulse: "rgba(251,191,36,0.12)"  },
  chaotic:   { accent: "#f87171", bg: "rgba(248,113,113,0.07)",  border: "rgba(248,113,113,0.18)",  label: "محتاج وعي",    pulse: "rgba(248,113,113,0.12)" },
};

/* ── حساب مسار SVG للقوس الدائري ── */
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

export const TEIWidget: FC = () => {
  const nodes = useMapState((s) => s.nodes);
  const savedRef = useRef(false);

  const tei = useMemo(() => computeTEI(nodes), [nodes]);
  const [comparison, setComparison] = useState<{ older: any; newer: any; delta: number } | null>(null);

  useEffect(() => {
    let mounted = true;
    getTEIComparison().then((data) => {
        if (mounted) setComparison(data);
    }).catch(console.error);
    return () => { mounted = false; };
  }, []);

  /* حفظ snapshot مرة واحدة يومياً */
  useEffect(() => {
    if (!savedRef.current && nodes.length > 0) {
      savedRef.current = true;
      saveTEISnapshot(tei);
    }
  }, [tei, nodes.length]);

  if (nodes.filter((n) => !n.isNodeArchived).length === 0) return null;

  const colors = CLARITY_COLORS[tei.clarityLevel];
  const clarity = 100 - tei.score; // نسبة الوضوح (المرتفع جيد)

  /* قوس SVG — يمتد من -210° إلى 30° (240° كامل) */
  const ARC_START = -210;
  const ARC_END   = 30;
  const ARC_RANGE = ARC_END - ARC_START; // 240°
  const filledEnd = ARC_START + (clarity / 100) * ARC_RANGE;
  const trackPath = describeArc(50, 50, 38, ARC_START, ARC_END);
  const fillPath  = describeArc(50, 50, 38, ARC_START, filledEnd);

  /* المقارنة التاريخية */
  let comparisonText: string | null = null;
  if (comparison && Math.abs(comparison.delta) > 5) {
    const abs = Math.abs(comparison.delta);
    comparisonText = comparison.delta > 5
      ? `↑ تراجع الاضطراب بـ ${abs} نقطة`
      : `↓ زاد الضغط بـ ${abs} نقطة.. وعيك هيساعدك`;
  }

  return (
    <motion.div
      className="rounded-[1.25rem] p-4 text-right w-full living-element flow-appear"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        /* نبضة الحياة تتوافق مع لون المؤشر */
        ["--organic-pulse-color" as string]: colors.pulse,
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center gap-3">

        {/* ── قرص SVG — البيانات تتكلم بجمال ── */}
        <div className="shrink-0 relative" style={{ width: 72, height: 72 }}>
          <svg viewBox="0 0 100 100" width="72" height="72" style={{ overflow: "visible" }}>
            {/* Track */}
            <path
              d={trackPath}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Animated fill */}
            <motion.path
              d={fillPath}
              fill="none"
              stroke={colors.accent}
              strokeWidth="8"
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 4px ${colors.accent}60)` }}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            />
          </svg>

          {/* رقم الوضوح في المنتصف */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ paddingBottom: "8px" }} /* تعويض مركز القوس */
          >
            <motion.span
              className="text-[20px] font-black leading-none"
              style={{ color: colors.accent }}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            >
              {clarity}
            </motion.span>
            <span className="text-[8px] font-semibold mt-0.5" style={{ color: `${colors.accent}80` }}>
              وضوح
            </span>
          </div>
        </div>

        {/* ── نص المعلومات ── */}
        <div className="flex-1 min-w-0">
          {/* رأس السطر */}
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ color: colors.accent, background: `${colors.accent}15` }}
            >
              {colors.label}
            </span>
            <span className="text-[10px] font-semibold" style={{ color: "rgba(148,163,184,0.5)" }}>
              مؤشر الوضوح
            </span>
          </div>

          {/* الرسالة */}
          <p className="text-[12px] leading-[1.65]" style={{ color: "rgba(203,213,225,0.75)" }}>
            {tei.message}
          </p>

          {/* إحصاء العلاقات + مقارنة تاريخية */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-[10px]" style={{ color: "rgba(148,163,184,0.4)" }}>
              {tei.disturbedCount}/{tei.totalCount} علاقة تحتاج شغل
            </span>
            {comparisonText && (
              <span
                className="text-[10px] font-medium"
                style={{ color: `${colors.accent}90` }}
              >
                · {comparisonText}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
