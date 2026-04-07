/**
 * EnergyGauge Component
 * مكون مؤشر الطاقة الدائري
 */

import { motion } from "framer-motion";
import { memo } from "react";
import {
  ARC_STROKE_DASHARRAY,
  ARC_CENTER_X,
  ARC_CENTER_Y,
  ENERGY_TICK_COUNT,
  ENERGY_ANGLE_MULTIPLIER,
  ENERGY_ANGLE_OFFSET,
  TRANSITION_SPRING,
  TRANSITION_TWEEN,
  COLORS
} from "./constants";

interface EnergyGaugeProps {
  energy: number | null;
  isNeedleHovering: boolean;
  needleMouseAngle: number;
}

export const EnergyGauge = memo(function EnergyGauge({
  energy,
  isNeedleHovering,
  needleMouseAngle
}: EnergyGaugeProps) {
  const energyValue = energy ?? 0;
  const needleRotation = isNeedleHovering
    ? needleMouseAngle
    : energyValue * ENERGY_ANGLE_MULTIPLIER + ENERGY_ANGLE_OFFSET;

  // Generate tick marks for a high-precision instrument feel
  const ticks = Array.from({ length: 21 }, (_, i) => {
    // 21 ticks means half-steps (0, 0.5, 1, 1.5...)
    const stepVal = i / 2;
    const angle = stepVal * ENERGY_ANGLE_MULTIPLIER + ENERGY_ANGLE_OFFSET;
    const rad = (angle * Math.PI) / 180;
    const isMajor = i % 2 === 0;
    const r1 = isMajor ? 78 : 82;
    const r2 = 90;
    return {
      x1: ARC_CENTER_X + r1 * Math.cos(rad),
      y1: ARC_CENTER_Y + r1 * Math.sin(rad),
      x2: ARC_CENTER_X + r2 * Math.cos(rad),
      y2: ARC_CENTER_Y + r2 * Math.sin(rad),
      isActive: stepVal <= energyValue,
      isMajor
    };
  });

  return (
    <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id="needleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#34d399" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="1" />
        </linearGradient>
        <radialGradient id="pivotGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <filter id="needleGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="activeTickGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Dial Ticks */}
      {ticks.map((tick, i) => (
        <line
          key={i}
          x1={tick.x1}
          y1={tick.y1}
          x2={tick.x2}
          y2={tick.y2}
          stroke={tick.isActive ? "rgba(45, 212, 191, 0.8)" : "var(--app-border)"}
          strokeWidth={tick.isMajor ? (tick.isActive ? "2.5" : "1.5") : "0.5"}
          strokeLinecap="round"
          opacity={tick.isActive ? 1 : 0.15}
          style={{ 
            filter: tick.isActive && tick.isMajor ? "url(#activeTickGlow)" : "none",
            transition: "stroke 0.3s ease, opacity 0.3s ease"
          }}
        />
      ))}

      {/* Background Arc */}
      <path
        d={`M 15,${ARC_CENTER_Y} A ${ARC_CENTER_X - 15},${ARC_CENTER_X - 15} 0 0,1 185,${ARC_CENTER_Y}`}
        fill="none"
        stroke="var(--app-muted)"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.3"
      />

      {/* Active Filled Arc with Dynamic Glow */}
      <motion.path
        d={`M 15,${ARC_CENTER_Y} A ${ARC_CENTER_X - 15},${ARC_CENTER_X - 15} 0 0,1 185,${ARC_CENTER_Y}`}
        fill="none"
        stroke="url(#needleGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={ARC_STROKE_DASHARRAY}
        initial={{ strokeDashoffset: ARC_STROKE_DASHARRAY }}
        animate={{ strokeDashoffset: ARC_STROKE_DASHARRAY * (1 - energyValue / 10) }}
        transition={TRANSITION_TWEEN}
        style={{ 
          filter: energyValue > 0 ? `drop-shadow(0 0 10px rgba(45, 212, 191, ${0.1 + (energyValue / 20)}))` : "none",
        }}
      />

      {/* Center Pivot Glow */}
      <circle cx={ARC_CENTER_X} cy={ARC_CENTER_Y} r="14" fill="url(#pivotGlow)" opacity={0.6} />

      {/* The Needle — Master Instrument Style */}
      <motion.g
        animate={{ rotate: needleRotation }}
        transition={isNeedleHovering ? TRANSITION_SPRING : TRANSITION_TWEEN}
      >
        <circle cx={ARC_CENTER_X} cy={ARC_CENTER_Y} r="90" fill="transparent" pointerEvents="none" />
        <path
          d={`M ${ARC_CENTER_X - 2},${ARC_CENTER_Y} L ${ARC_CENTER_X},15 L ${ARC_CENTER_X + 2},${ARC_CENTER_Y} Z`}
          fill="#fff"
          filter="url(#needleGlow)"
          style={{ opacity: 0.9 }}
        />
      </motion.g>

      {/* Fixed Pivot Housing */}
      <circle cx={ARC_CENTER_X} cy={ARC_CENTER_Y} r="7" fill="var(--app-bg)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <circle cx={ARC_CENTER_X} cy={ARC_CENTER_Y} r="3" fill="#fff" className="shadow-lg shadow-white/50" />
    </svg>
  );
});
