"use client";

import { useMemo } from "react";
import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import { getWeeklyPattern } from "../utils/sessionHistory";

const NODE_META = {
  ar: {
    1: { label: "الموضوع", tone: "#38B2D8" },
    2: { label: "الهدف", tone: "#2ECC71" },
    3: { label: "العقبات", tone: "#E74C3C" },
  },
  en: {
    1: { label: "Topic", tone: "#38B2D8" },
    2: { label: "Goal", tone: "#2ECC71" },
    3: { label: "Blocks", tone: "#E74C3C" },
  },
} as const;

type WeeklyPatternCardProps = {
  language?: "ar" | "en";
};

function clampClarity(value: number) {
  return Math.max(-1, Math.min(1, value));
}

export default function WeeklyPatternCard({ language = "en" }: WeeklyPatternCardProps) {
  const pattern = useMemo(() => getWeeklyPattern(), []);
  const isArabic = language === "ar";

  if (!pattern) return null;

  const meta = NODE_META[language][pattern.recurringNodeId as 1 | 2 | 3] ?? NODE_META[language][1];
  const trendDirection = pattern.clarityTrend > 0.05 ? "up" : pattern.clarityTrend < -0.05 ? "down" : "steady";
  const sparklinePoints = pattern.history
    .map((entry, index) => {
      const x = pattern.history.length === 1 ? 80 : (index / (pattern.history.length - 1)) * 160;
      const normalized = (clampClarity(entry.clarityDelta) + 1) / 2;
      const y = 38 - normalized * 28;
      return `${x},${y}`;
    })
    .join(" ");

  const trendLabel =
    trendDirection === "up"
      ? isArabic
        ? "الوضوح يتحسن"
        : "Clarity is improving"
      : trendDirection === "down"
        ? isArabic
          ? "الوضوح ينخفض"
          : "Clarity is declining"
        : isArabic
          ? "الوضوح ثابت"
          : "Clarity is steady";

  const overloadLabel =
    pattern.avgOverload > 0.6
      ? isArabic
        ? "حمل ذهني عالٍ"
        : "High load"
      : pattern.avgOverload > 0.3
        ? isArabic
          ? "حمل ذهني متوسط"
          : "Moderate load"
        : isArabic
          ? "حمل ذهني خفيف"
          : "Light load";

  return (
    <div className="weekly-pattern-card" dir={isArabic ? "rtl" : "ltr"}>
      <div className="weekly-pattern-head">
        <div>
          <p className="weekly-pattern-kicker">{isArabic ? "النمط الأسبوعي" : "Weekly Pattern"}</p>
          <h3>{isArabic ? `آخر ${pattern.sessionCount} جلسات` : `Last ${pattern.sessionCount} sessions`}</h3>
        </div>
        <span className="weekly-pattern-chip">
          <Activity className="h-4 w-4" />
          {isArabic ? `${pattern.recurringPct}% متكرر` : `${pattern.recurringPct}% recurring`}
        </span>
      </div>

      <div className="weekly-pattern-meta">
        <div className="weekly-pattern-stat">
          <span className="weekly-pattern-dot" style={{ backgroundColor: meta.tone }} />
          <div>
            <small>{isArabic ? "العقدة الغالبة" : "Recurring node"}</small>
            <strong>{meta.label}</strong>
          </div>
        </div>

        <div className="weekly-pattern-stat">
          {trendDirection === "up" ? (
            <TrendingUp className="h-4 w-4 weekly-pattern-icon up" />
          ) : trendDirection === "down" ? (
            <TrendingDown className="h-4 w-4 weekly-pattern-icon down" />
          ) : (
            <Activity className="h-4 w-4 weekly-pattern-icon steady" />
          )}
          <div>
            <small>{isArabic ? "اتجاه الوضوح" : "Clarity trend"}</small>
            <strong>{trendLabel}</strong>
          </div>
        </div>
      </div>

      <div className="weekly-pattern-sparkline">
        <svg viewBox="0 0 160 44" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 39 H160" className="weekly-pattern-gridline" />
          <polyline points={sparklinePoints} style={{ stroke: meta.tone }} />
        </svg>
      </div>

      <div className="weekly-pattern-foot">
        <span>{isArabic ? `المسار "${meta.label}" يسيطر على ${pattern.recurringPct}% من جلساتك.` : `"${meta.label}" leads ${pattern.recurringPct}% of your recent sessions.`}</span>
        <span>{overloadLabel}</span>
      </div>
    </div>
  );
}
