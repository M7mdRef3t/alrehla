import React, { type FC } from "react";
import { motion } from "framer-motion";
import { SafeMotionCircle } from "@/components/ui/SafeSvg";

interface DivineConnectionProps {
  /** Strength of the connection (0 to 1) */
  strength?: number;
  /** Whether to show labels */
  showLabel?: boolean;
}

/**
 * ◈ العلاقة الرأسية (The Vertical Axis) ◈
 * Represents the connection between the "Sovereign Core" (You) and "The Source" (The Creator/Truth).
 */
export const DivineConnection: FC<DivineConnectionProps> = ({ 
  strength = 0.7, 
  showLabel = true 
}) => {
  return (
    <g className="pointer-events-none select-none">
      {/* ─── The Source (المصدر) ─── */}
      <g transform="translate(50, 5)">
        {/* Outer Glows */}
        <SafeMotionCircle
          cx={0} cy={0} r={6}
          fill="rgba(255, 255, 255, 0.05)"
          animate={{ scale: [1, 1.5, 1], opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <SafeMotionCircle
          cx={0} cy={0} r={3}
          fill="rgba(255, 255, 255, 0.1)"
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Core Star */}
        <SafeMotionCircle
          cx={0} cy={0} r={0.8}
          fill="white"
          animate={{ 
            opacity: [0.6, 1, 0.6],
            filter: ["drop-shadow(0 0 2px white)", "drop-shadow(0 0 8px white)", "drop-shadow(0 0 2px white)"]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Label */}
        {showLabel && (
          <text
            y={5}
            textAnchor="middle"
            fill="rgba(255,255,255,0.4)"
            style={{ 
              fontSize: '1.2px', 
              fontWeight: 900, 
              letterSpacing: '0.2em',
              fontFamily: 'inherit'
            }}
          >
            المصدر
          </text>
        )}
      </g>

      {/* ─── The Vertical Beam (The Link) ─── */}
      <defs>
        <linearGradient id="divineBeamGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity={0.6 * strength} />
          <stop offset="100%" stopColor="white" stopOpacity={0} />
        </linearGradient>
        
        <filter id="divineGlow">
          <feGaussianBlur stdDeviation="0.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Core Beam */}
      <motion.line
        x1={50} y1={6}
        x2={50} y2={50}
        stroke="url(#divineBeamGradient)"
        strokeWidth={0.15}
        strokeDasharray="2, 4"
        animate={{ 
          strokeDashoffset: [0, -20],
          opacity: [0.1, 0.3 * strength, 0.1]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      {/* Subtle Energy Pulses Moving Upwards */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx={50}
          cy={50}
          r={0.2}
          fill="white"
          animate={{ 
            cy: [50, 6],
            opacity: [0, 0.6 * strength, 0],
            scale: [1, 0.5, 0.2]
          }}
          transition={{ 
            duration: 4 + i, 
            repeat: Infinity, 
            delay: i * 1.5,
            ease: "easeOut"
          }}
        />
      ))}

      {/* Connection Anchor to "You" Orb */}
      <SafeMotionCircle
        cx={50} cy={50} r={2}
        fill="none"
        stroke="white"
        strokeWidth={0.1}
        animate={{ scale: [1, 1.2, 1], opacity: [0, 0.2 * strength, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </g>
  );
};
