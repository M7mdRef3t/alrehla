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

  // Generate tick marks
  const ticks = Array.from({ length: ENERGY_TICK_COUNT }, (_, i) => {
    const angle = i * ENERGY_ANGLE_MULTIPLIER + ENERGY_ANGLE_OFFSET;
    const rad = (angle * Math.PI) / 180;
    const r1 = 82;
    const r2 = 90;
    return {
      x1: ARC_CENTER_X + r1 * Math.cos(rad),
      y1: ARC_CENTER_Y + r1 * Math.sin(rad),
      x2: ARC_CENTER_X + r2 * Math.cos(rad),
      y2: ARC_CENTER_Y + r2 * Math.sin(rad),
      isActive: i <= energyValue
    };
  });

  return (
    <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id="needleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="1" />
        </linearGradient>
        <radialGradient id="pivotGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <filter id="needleGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
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
          stroke={tick.isActive ? "rgba(251,191,36,0.6)" : "rgba(255,255,255,0.1)"}
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}

      {/* Background Arc */}
      <path
        d={`M 10,${ARC_CENTER_Y} A ${ARC_CENTER_X - 10},${ARC_CENTER_X - 10} 0 0,1 190,${ARC_CENTER_Y}`}
        fill="none"
        stroke={COLORS.arc.background}
        strokeWidth="12"
        strokeLinecap="round"
      />

      {/* Active Filled Arc */}
      <motion.path
        d={`M 10,${ARC_CENTER_Y} A ${ARC_CENTER_X - 10},${ARC_CENTER_X - 10} 0 0,1 190,${ARC_CENTER_Y}`}
        fill="none"
        stroke={COLORS.arc.active}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={ARC_STROKE_DASHARRAY}
        initial={{ strokeDashoffset: ARC_STROKE_DASHARRAY }}
        animate={{ strokeDashoffset: ARC_STROKE_DASHARRAY * (1 - energyValue / 10) }}
        transition={TRANSITION_TWEEN}
        style={{ filter: energyValue > 7 ? `drop-shadow(0 0 8px ${COLORS.needle.glow})` : "none" }}
      />

      {/* Center Pivot Glow */}
      <circle cx={ARC_CENTER_X} cy={ARC_CENTER_Y} r="16" fill="url(#pivotGlow)" />

      {/* The Needle */}
      <motion.g
        animate={{ rotate: needleRotation }}
        transition={isNeedleHovering ? TRANSITION_SPRING : TRANSITION_TWEEN}
      >
        {/* Invisible Anchor for center rotation */}
        <circle cx={ARC_CENTER_X} cy={ARC_CENTER_Y} r="90" fill="transparent" pointerEvents="none" />
        
        {/* The Actual Needle */}
        <path
          d={`M ${ARC_CENTER_X - 1.5},${ARC_CENTER_Y} L ${ARC_CENTER_X},10 L ${ARC_CENTER_X + 1.5},${ARC_CENTER_Y} Z`}
          fill={COLORS.needle.primary}
          filter="url(#needleGlow)"
        />
      </motion.g>

      {/* Fixed Pivot circles */}
      <circle cx={ARC_CENTER_X} cy={ARC_CENTER_Y} r="6" fill="#0f172a" stroke={COLORS.needle.primary} strokeWidth="2" />
      <circle cx={ARC_CENTER_X} cy={ARC_CENTER_Y} r="2" fill={COLORS.needle.primary} />
    </svg>
  );
});
