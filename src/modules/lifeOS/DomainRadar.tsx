"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { LIFE_DOMAINS, type LifeDomainId } from "@/types/lifeDomains";

interface DomainRadarProps {
  scores: Record<LifeDomainId, number>;
  size?: number;
  onDomainClick?: (domainId: LifeDomainId) => void;
}

const RADAR_LEVELS = [25, 50, 75, 100];

export const DomainRadar = memo(function DomainRadar({
  scores,
  size = 320,
  onDomainClick
}: DomainRadarProps) {
  const center = size / 2;
  const maxRadius = (size / 2) - 50;

  const points = useMemo(() => {
    return LIFE_DOMAINS.map((domain, i) => {
      const angle = (i / LIFE_DOMAINS.length) * 2 * Math.PI - Math.PI / 2;
      const score = scores[domain.id] ?? 50;
      const r = (score / 100) * maxRadius;
      return {
        ...domain,
        angle,
        score,
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
        labelX: center + (maxRadius + 30) * Math.cos(angle),
        labelY: center + (maxRadius + 30) * Math.sin(angle),
      };
    });
  }, [scores, center, maxRadius]);

  const polygonPath = points.map((p) => `${p.x},${p.y}`).join(" ");

  const overallAvg = useMemo(() => {
    const vals = Object.values(scores);
    if (vals.length === 0) return 50;
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
  }, [scores]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid levels */}
        {RADAR_LEVELS.map((level) => {
          const r = (level / 100) * maxRadius;
          return (
            <circle
              key={level}
              cx={center}
              cy={center}
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth={0.5}
              className="text-white/8"
            />
          );
        })}

        {/* Axis lines */}
        {points.map((p) => (
          <line
            key={`axis-${p.id}`}
            x1={center}
            y1={center}
            x2={center + maxRadius * Math.cos(p.angle)}
            y2={center + maxRadius * Math.sin(p.angle)}
            stroke="currentColor"
            strokeWidth={0.5}
            className="text-white/6"
          />
        ))}

        {/* Data polygon — filled area */}
        <motion.polygon
          points={polygonPath}
          fill="url(#radarGradient)"
          stroke="url(#radarStroke)"
          strokeWidth={2}
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          style={{ transformOrigin: `${center}px ${center}px` }}
        />

        {/* Gradient definitions */}
        <defs>
          <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.12} />
          </radialGradient>
          <linearGradient id="radarStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.7} />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.7} />
          </linearGradient>
        </defs>

        {/* Data points */}
        {points.map((p, i) => (
          <motion.circle
            key={`dot-${p.id}`}
            cx={p.x}
            cy={p.y}
            r={5}
            fill={p.color}
            stroke="#0a0a0f"
            strokeWidth={2}
            className=""
            onClick={() => onDomainClick?.(p.id)}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
            whileHover={{ scale: 1.5, r: 7 }}
          />
        ))}
      </svg>

      {/* Domain labels */}
      {points.map((p, i) => (
        <motion.button
          key={`label-${p.id}`}
          className="absolute flex flex-col items-center gap-0.5 cursor-pointer group"
          style={{
            left: p.labelX,
            top: p.labelY,
            transform: "translate(-50%, -50%)"
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 + i * 0.06 }}
          onClick={() => onDomainClick?.(p.id)}
        >
          <span className="text-lg group-hover:scale-125 transition-transform">{p.icon}</span>
          <span className="text-[9px] font-bold text-white/50 group-hover:text-white/80 transition-colors whitespace-nowrap">
            {p.label}
          </span>
          <span
            className="text-[10px] font-black font-mono"
            style={{ color: p.color }}
          >
            {p.score}
          </span>
        </motion.button>
      ))}

      {/* Center score */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-2xl font-black text-white/80 font-mono">{overallAvg}</span>
          <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">المتوسط</span>
        </div>
      </div>
    </div>
  );
});
