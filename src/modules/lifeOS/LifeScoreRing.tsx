"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";

interface LifeScoreRingProps {
  score: number; // 0-100
  size?: number;
  strokeWidth?: number;
  trend?: "improving" | "stable" | "declining";
  label?: string;
  animate?: boolean;
}

function getTrendColor(trend: string): string {
  switch (trend) {
    case "improving": return "#10b981";
    case "declining": return "#ef4444";
    default: return "#8b5cf6";
  }
}

function getScoreGradient(score: number): [string, string] {
  if (score >= 75) return ["#10b981", "#34d399"];
  if (score >= 50) return ["#8b5cf6", "#a78bfa"];
  if (score >= 30) return ["#f59e0b", "#fbbf24"];
  return ["#ef4444", "#f87171"];
}

export const LifeScoreRing = memo(function LifeScoreRing({
  score,
  size = 180,
  strokeWidth = 8,
  trend = "stable",
  label = "Life Score",
  animate = true
}: LifeScoreRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const [colorStart, colorEnd] = getScoreGradient(score);
  const trendColor = getTrendColor(trend);

  const trendIcon = useMemo(() => {
    switch (trend) {
      case "improving": return "↑";
      case "declining": return "↓";
      default: return "→";
    }
  }, [trend]);

  const trendLabel = useMemo(() => {
    switch (trend) {
      case "improving": return "في تحسن";
      case "declining": return "في تراجع";
      default: return "مستقر";
    }
  }, [trend]);

  const gradientId = `life-score-gradient-${size}`;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Glow background */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-20"
        style={{ background: `radial-gradient(circle, ${colorStart}40, transparent 70%)` }}
      />

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorStart} />
            <stop offset="100%" stopColor={colorEnd} />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/5"
        />

        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={animate ? { strokeDashoffset: circumference } : { strokeDashoffset: circumference - progress }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <motion.span
          className="text-4xl font-black text-white font-mono tracking-tighter"
          initial={animate ? { opacity: 0, scale: 0.5 } : undefined}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {score}
        </motion.span>

        <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.15em]">{label}</span>

        {/* Trend indicator */}
        <motion.div
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-full mt-1"
          style={{
            background: `${trendColor}15`,
            border: `1px solid ${trendColor}30`
          }}
          initial={animate ? { opacity: 0, y: 10 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.2 }}
        >
          <span className="text-[10px] font-black" style={{ color: trendColor }}>
            {trendIcon}
          </span>
          <span className="text-[9px] font-bold" style={{ color: trendColor }}>
            {trendLabel}
          </span>
        </motion.div>
      </div>
    </div>
  );
});
