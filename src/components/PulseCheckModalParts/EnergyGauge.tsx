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
          <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#34d399" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="1" />
        </linearGradient>
        <radialGradient id="pivotGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <filter id="needleGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
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
          stroke={tick.isActive ? "rgba(52, 211, 153, 0.7)" : "rgba(255,255,255,0.08)"}
          strokeWidth={tick.isActive ? "2.5" : "1.5"}
          strokeLinecap="round"
        />
      ))}

      {/* Background Arc */}
      <path
        d={`M 15,${ARC_CENTER_Y} A ${ARC_CENTER_X - 15},${ARC_CENTER_X - 15} 0 0,1 185,${ARC_CENTER_Y}`}
        fill="none"
        stroke="rgba(255, 255, 255, 0.04)"
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* Active Filled Arc */}
      <motion.path
        d={`M 15,${ARC_CENTER_Y} A ${ARC_CENTER_X - 15},${ARC_CENTER_X - 15} 0 0,1 185,${ARC_CENTER_Y}`}
        fill="none"
        stroke="url(#needleGrad)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={ARC_STROKE_DASHARRAY}
        initial={{ strokeDashoffset: ARC_STROKE_DASHARRAY }}
        animate={{ strokeDashoffset: ARC_STROKE_DASHARRAY * (1 - energyValue / 10) }}
        transition={TRANSITION_TWEEN}
        style={{ filter: energyValue > 6 ? `drop-shadow(0 0 12px rgba(52, 211, 153, 0.4))` : "none" }}
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
